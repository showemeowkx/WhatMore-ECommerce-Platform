/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SignInDto } from './dto/sing-in.dto';
import { JwtPayload } from './jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { StoreService } from 'src/store/store.service';
import { CartService } from 'src/cart/cart.service';
import { ConfigService } from '@nestjs/config';
import { VerificationCode } from './entities/verification-code.entity';
import { SmsService } from 'src/notifications/sms.service';
import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { RefreshPasswordDto } from './dto/refresh-password.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly jwtService: JwtService,
    private readonly cartService: CartService,
    private readonly storeService: StoreService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    const { password, code } = createUserDto;
    const phoneRaw = createUserDto.phone;

    const phone = parsePhoneNumberWithError(
      phoneRaw,
      'UA',
    ).formatInternational();

    await this.verifyCode(phone, code);

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      password: hashedPassword,
      phone,
      imagePath: this.configService.get('DEFAULT_USER_PFP') as string,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      await this.cartService.create(savedUser);
    } catch (error) {
      if (error.code === '23505') {
        this.logger.error(`User already exists {phone: ${phone}}`);
        throw new ConflictException('Цей номер вже зареєстрований.');
      } else {
        this.logger.error(`Failed to register a user: ${error.stack}`);
        throw new InternalServerErrorException(
          'Не вдалося зареєструвати користувача. Спробуйте ще раз пізніше.',
        );
      }
    }
  }

  async requestRegistrationCode(
    phoneRaw: string,
    refresh: 0 | 1,
  ): Promise<void> {
    const phone = parsePhoneNumberWithError(
      phoneRaw,
      'UA',
    ).formatInternational();

    this.logger.verbose(
      `Requesting a verification code for number '${phone}'... {refresh: ${Boolean(refresh)}}`,
    );

    const existingUser = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingUser && !refresh) {
      this.logger.error(`Phone number is already registered {phone: ${phone}}`);
      throw new ConflictException('Цей номер вже зареєстрований.');
    }

    if (!existingUser && refresh) {
      this.logger.error(`User is not registered {phone: ${phone}}`);
      throw new ConflictException('Цей номер не зареєстрований.');
    }

    const lastCode = await this.verificationCodeRepository.findOne({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    if (lastCode) {
      const minutesOld =
        (Date.now() - lastCode.createdAt.getTime()) / 1000 / 60;
      if (minutesOld < 5) {
        const remainingSeconds = Math.ceil((5 - minutesOld) * 60);
        const minLeft = Math.floor(remainingSeconds / 60);
        const secLeft = remainingSeconds % 60;
        const timeLeftStr =
          minLeft > 0 ? `${minLeft} хв ${secLeft} сек` : `${secLeft} сек`;

        throw new HttpException(
          `СМС вже відправлено. Зачекайте ${timeLeftStr} перед повторною відправкою.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const rawCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(rawCode, 10);

    await this.verificationCodeRepository.delete({ phone });

    await this.verificationCodeRepository.save({
      phone,
      code: hashedCode,
    });

    if (this.configService.get<string>('NODE_ENV') !== 'prod') {
      this.smsService.sendVerificationCodeMock(phone, rawCode);
    } else {
      const text = `Ваш код для реєстрації "Що? Ще?": ${rawCode},\nДійсний протягом 5 хвилин.`;
      await this.smsService.sendSms(phone, text);
    }
  }

  private async verifyCode(phone: string, code: string): Promise<void> {
    const record = await this.verificationCodeRepository.findOne({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException(
        'Код верифікації не знайдено. Будь ласка, запросіть новий код.',
      );
    }

    const minutesOld = (Date.now() - record.createdAt.getTime()) / 1000 / 60;
    const expiresIn =
      this.configService.get<number>('VERIFICATION_CODE_EXPIRE_MINUTES') || 5;

    if (minutesOld > expiresIn) {
      await this.verificationCodeRepository.delete({ phone });
      throw new BadRequestException(
        'Код верифікації вичерпано. Будь ласка, запросіть новий код.',
      );
    }

    const isMatch = await bcrypt.compare(code, record.code);
    if (!isMatch) {
      throw new BadRequestException('Неправильний код верифікації.');
    }

    await this.verificationCodeRepository.delete({ phone });

    this.logger.verbose(`Verification code accepted for '${phone}'`);
  }

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const password = signInDto.password;
    const loginRaw = signInDto.login;

    let login = loginRaw;

    if (isValidPhoneNumber(loginRaw, 'UA')) {
      login = parsePhoneNumberWithError(loginRaw, 'UA').formatInternational();
    }

    const user = await this.userRepository.findOneBy([
      { phone: login },
      { email: login },
    ]);

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = {
        sub: user.id,
        login,
        isAdmin: user.isAdmin,
      };
      const tokens = await this.getTokens(payload);

      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } else {
      this.logger.error(`Wrong login or password {login: ${login}}`);
      throw new UnauthorizedException('Неправильний логін або пароль.');
    }
  }

  private async getTokens(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRE_TIME') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRE_TIME') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hash });
  }

  async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access denied');

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches) throw new UnauthorizedException('Access denied');

    const payload: JwtPayload = {
      sub: user.id,
      login: user.phone,
      isAdmin: user.isAdmin,
    };

    const tokens = await this.getTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  async chooseStore(user: User, storeId: number): Promise<void> {
    const store = await this.storeService.findOne(storeId);

    if (!store.isActive && !user.isAdmin) {
      this.logger.error(`Store with ID ${storeId} is not active`);
      throw new Error('Цей магазин не активний');
    }

    user.selectedStore = store;

    try {
      await this.userRepository.save(user);
      await this.cartService.clearCart(user.id);
    } catch (error) {
      this.logger.error(
        `Failed to asign a store {userId: ${user.id}, storeId: ${storeId}}: ${error.stack}`,
      );
      throw new InternalServerErrorException(
        'Не вдалося выбрати магазин. Спробуйте ще раз пізніше.',
      );
    }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.error(`User with ID ${id} not found`);
      throw new NotFoundException('Користувача не знайдено.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const password = updateUserDto.password;
    const phoneRaw = updateUserDto.phone;
    const email = updateUserDto.email;
    const oldImagePath = user.imagePath;
    const imagePath = updateUserDto.imagePath;

    const isSensitiveUpdate = password || (email && user.email) || phoneRaw;

    if (isSensitiveUpdate) {
      if (!updateUserDto.currentPassword) {
        this.logger.error(`No current password provided {userId: ${id}}`);
        throw new BadRequestException(
          'Потрібно вказати поточний пароль для зміни чутливих даних',
        );
      }

      const isMatch = await bcrypt.compare(
        updateUserDto.currentPassword,
        user.password,
      );
      if (!isMatch) {
        this.logger.error(`Wrong current password {userId: ${id}}`);
        throw new UnauthorizedException('Неправильний поточний пароль.');
      }
    }

    delete updateUserDto.currentPassword;

    if (password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      updateUserDto.password = hashedPassword;
    }

    if (phoneRaw) {
      const newPhone = parsePhoneNumberWithError(
        phoneRaw,
        'UA',
      ).formatInternational();

      const sameUser = await this.userRepository.findOneBy({
        phone: newPhone,
      });

      if (sameUser) {
        this.logger.error(`User with phone '${newPhone}' already exists`);
        throw new ConflictException(
          'Цей номер телефону вже використовується. Спробуйте інший номер.',
        );
      }

      if (!updateUserDto.code) {
        this.logger.error(
          `No verification code provided for number '${newPhone}'`,
        );
        throw new BadRequestException(
          'Код верифікації не надано. Будь ласка, вкажіть код для зміни номера телефону.',
        );
      }

      await this.verifyCode(newPhone, updateUserDto.code);
      updateUserDto.phone = newPhone;
    }

    if (email) {
      const sameUser = await this.userRepository.findOne({ where: { email } });

      if (sameUser) {
        this.logger.error(`User with email '${email}' already exists`);
        throw new ConflictException(
          'Користувач з цією електронною поштою вже існує. Спробуйте іншу електронну пошту.',
        );
      }
    }

    const defaultPfp = this.configService.get<string>('DEFAULT_USER_PFP');

    if (imagePath !== undefined && imagePath !== oldImagePath) {
      if (imagePath === null) {
        updateUserDto.imagePath = defaultPfp;
      }

      if (oldImagePath && oldImagePath !== defaultPfp) {
        try {
          await this.cloudinaryService.deleteFile(oldImagePath);
        } catch (error) {
          this.logger.error(
            `Failed to delete old image from Cloudinary: ${(error as Error).message}`,
          );
        }
      }
    }

    try {
      this.userRepository.merge(user, updateUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to update a user: ${error.stack}`);
      throw new InternalServerErrorException('Failed to update a user');
    }
  }

  async restorePassword(refreshPasswordDto: RefreshPasswordDto): Promise<void> {
    const { phoneRaw, code, newPassword } = refreshPasswordDto;

    const phone = parsePhoneNumberWithError(
      phoneRaw,
      'UA',
    ).formatInternational();

    const user = await this.userRepository.findOneBy({ phone });

    if (!user) {
      this.logger.error(`User with phone '${phone}' not found`);
      throw new NotFoundException(
        'Користувача з таким номером телефону не знайдено.',
      );
    }

    await this.verifyCode(phone, code);

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    try {
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to restore password: ${error.stack}`);
      throw new InternalServerErrorException(
        'Не вдалося відновити пароль. Спробуйте ще раз пізніше.',
      );
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      this.logger.error(`User with ID ${id} not found`);
      throw new NotFoundException('Користувача не знайдено.');
    }
  }
}

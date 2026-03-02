import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
  InternalServerErrorException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SignInDto } from './dto/sing-in.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { RequestVerificationCodeDto } from './dto/req-code.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayload } from './jwt-payload.interface';
import { RefreshPasswordDto } from './dto/refresh-password.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Req() req: { user: User }): Promise<User> {
    this.logger.verbose(`Getting user profile... {userId: ${req.user.id}}`);
    return this.authService.findOne(req.user.id);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('/send-code')
  sendCode(
    @Body() requestVerificationCodeDto: RequestVerificationCodeDto,
    @Query('refresh') refresh: 0 | 1,
  ): Promise<void> {
    return this.authService.requestRegistrationCode(
      requestVerificationCodeDto.phone,
      refresh,
    );
  }

  @Post('/register')
  register(@Body() createUserDto: CreateUserDto): Promise<void> {
    this.logger.verbose(`Creating a user... {phone: ${createUserDto.phone}}`);
    return this.authService.register(createUserDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/signin')
  signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.verbose(`Signing in... {login: ${signInDto.login}}`);
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refreshTokens(
    @Req() req: { user: JwtPayload & { refreshToken: string } },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];

    this.logger.verbose(`Refreshing tokens... {userId: ${userId}}`);

    if (!refreshToken) {
      throw new InternalServerErrorException('Refresh token is missing');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: { user: User }): Promise<void> {
    this.logger.verbose(`Logging out... {login: ${req.user.phone}}`);
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/store/:storeId')
  chooseStore(
    @Req() req: { user: User },
    @Param('storeId') storeId: number,
  ): Promise<void> {
    this.logger.verbose(
      `Selecting a store... {userId: ${req.user.id}, storeId: ${storeId}}`,
    );
    return this.authService.chooseStore(req.user, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('pfp'))
  async updateProfile(
    @Req() req: { user: User },
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    this.logger.verbose(`Updating a user... {userId: ${req.user.id}}`);

    let oldPfp: string = '';
    if (file) {
      const user = await this.authService.findOne(req.user.id);
      oldPfp = user.imagePath;

      const result = await this.cloudinaryService.uploadFile(file);
      updateUserDto.imagePath = result.secure_url as string;
    }

    const updatedUser = await this.authService.update(
      req.user.id,
      updateUserDto,
    );

    if (oldPfp && oldPfp !== this.configService.get('DEFAULT_USER_PFP')) {
      await this.cloudinaryService.deleteFile(oldPfp);
    }

    return updatedUser;
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteProfile(@Req() req: { user: User }): Promise<void> {
    this.logger.verbose(`Deleting a user... {userId: ${req.user.id}}`);

    const user = await this.authService.findOne(req.user.id);
    const pfpPath = user.imagePath;

    await this.authService.remove(req.user.id);

    if (pfpPath && pfpPath !== this.configService.get('DEFAULT_USER_PFP')) {
      await this.cloudinaryService.deleteFile(pfpPath);
    }
  }

  @Post('/restore-password')
  restorePassword(@Body() refreshPasswordDto: RefreshPasswordDto) {
    this.logger.verbose(
      `Restoring password... {phone: ${refreshPasswordDto.phoneRaw}}`,
    );
    return this.authService.restorePassword(refreshPasswordDto);
  }
}

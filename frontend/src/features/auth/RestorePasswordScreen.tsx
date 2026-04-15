/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonLoading,
  useIonToast,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import {
  arrowBack,
  keypadOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../../config/api";

const ForgotPasswordScreen: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      presentToast({
        message: "Введіть коректний номер телефону",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/send-code?refresh=1", { phone });

      presentToast({
        message: "Код надіслано!",
        duration: 1500,
        color: "success",
      });
      setStep(2);
      setTimeLeft(300);
    } catch (error: any) {
      presentToast({
        message: error.response?.data?.message || "Помилка відправки коду",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!code || !password || !confirmPassword) {
      presentToast({
        message: "Заповніть всі поля",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    if (password !== confirmPassword) {
      presentToast({
        message: "Паролі не співпадають",
        duration: 2000,
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/restore-password", {
        phoneRaw: phone,
        code,
        newPassword: password,
      });

      presentToast({
        message: "Пароль успішно змінено! Увійдіть.",
        duration: 2000,
        color: "success",
      });
      history.replace("/login");
    } catch (error: any) {
      presentToast({
        message: error.response?.data?.message || "Помилка зміни пароля",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding custom-login-bg" scrollY={false}>
        <div className="flex flex-col h-full justify-start items-center px-6 pt-20">
          <div className="w-full max-w-sm mb-8 flex items-center relative">
            <IonButton
              fill="clear"
              className="absolute -left-3 z-10"
              onClick={() =>
                step === 2 ? setStep(1) : history.replace("/login")
              }
            >
              <IonIcon icon={arrowBack} className="text-gray-600 text-2xl" />
            </IonButton>
            <h1 className="w-full text-center text-3xl font-black text-gray-800 tracking-tight">
              {step === 1 ? "Відновлення" : "Новий пароль"}
            </h1>
          </div>

          <div className="w-full max-w-sm bg-white/95 rounded-[45px] p-6 shadow-2xl border border-white">
            {step === 1 ? (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex border-[1px] border-gray-300 items-center justify-center mx-auto mb-4">
                    <IonIcon
                      icon={lockClosedOutline}
                      className="text-3xl text-gray-500"
                    />
                  </div>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    Введіть номер телефону, щоб отримати код для відновлення
                  </p>
                </div>

                <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner">
                  <IonItem
                    lines="none"
                    className="bg-transparent"
                    style={{ "--background": "transparent" }}
                  >
                    <div className="w-full">
                      <IonLabel
                        position="stacked"
                        className="text-gray-600 font-bold ml-1 mb-1"
                      >
                        Номер телефону
                      </IonLabel>
                      <IonInput
                        type="tel"
                        inputmode="tel"
                        value={phone}
                        color="dark"
                        onIonInput={(e) => {
                          const val = e.detail.value!;
                          const filtered = val.replace(/[^0-9+]/g, "");
                          setPhone(filtered);
                          if (val !== filtered) e.target.value = filtered;
                        }}
                        className="font-medium text-gray-800"
                        placeholder="+380..."
                        maxlength={13}
                      />
                    </div>
                  </IonItem>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleSendCode}
                  className="h-14 mt-4 font-black text-lg"
                  style={{
                    "--border-radius": "30px",
                    "--box-shadow": "0 12px 24px -6px rgba(60, 60, 60, 0.4)",
                  }}
                  color="dark"
                >
                  ОТРИМАТИ КОД
                </IonButton>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                  <p className="text-gray-500 text-xs font-medium">
                    Введіть код з СМС та придумайте новий пароль
                  </p>
                </div>

                <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner">
                  <IonItem
                    lines="none"
                    className="bg-transparent"
                    style={{ "--background": "transparent" }}
                  >
                    <div className="w-full">
                      <IonLabel
                        position="stacked"
                        className="text-gray-600 font-bold ml-1 mb-1"
                      >
                        СМС Код
                      </IonLabel>
                      <div className="flex items-center">
                        <IonInput
                          type="tel"
                          color="dark"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          value={code}
                          onIonInput={(e) => {
                            const val = e.detail.value!;
                            const numeric = val.replace(/\D/g, "");
                            setCode(numeric);
                            if (val !== numeric) e.target.value = numeric;
                          }}
                          className="font-medium text-gray-800"
                          placeholder="6-значний код"
                          maxlength={6}
                        />
                        <IonIcon
                          icon={keypadOutline}
                          className="text-gray-400 text-xl ml-2"
                        />
                      </div>
                    </div>
                  </IonItem>
                </div>

                <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner">
                  <IonItem
                    lines="none"
                    className="bg-transparent"
                    style={{ "--background": "transparent" }}
                  >
                    <div className="w-full">
                      <IonLabel
                        position="stacked"
                        className="text-gray-600 font-bold ml-1 mb-1"
                      >
                        Новий пароль
                      </IonLabel>
                      <div className="flex items-center">
                        <IonInput
                          type={showPassword ? "text" : "password"}
                          color="dark"
                          value={password}
                          onIonInput={(e) => setPassword(e.detail.value!)}
                          className="font-medium text-gray-800"
                          placeholder="Мінімум 6 символів"
                        />
                        <IonIcon
                          icon={showPassword ? eyeOffOutline : eyeOutline}
                          className="text-gray-400 text-xl ml-2 cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </div>
                    </div>
                  </IonItem>
                </div>

                <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner">
                  <IonItem
                    lines="none"
                    className="bg-transparent"
                    style={{ "--background": "transparent" }}
                  >
                    <div className="w-full">
                      <IonLabel
                        position="stacked"
                        className="text-gray-600 font-bold ml-1 mb-1"
                      >
                        Підтвердіть пароль
                      </IonLabel>
                      <div className="flex items-center">
                        <IonInput
                          type={showPassword ? "text" : "password"}
                          color="dark"
                          value={confirmPassword}
                          onIonInput={(e) =>
                            setConfirmPassword(e.detail.value!)
                          }
                          className="font-medium text-gray-800"
                          placeholder="Повторіть пароль"
                        />
                        {password &&
                          confirmPassword &&
                          password === confirmPassword && (
                            <IonIcon
                              icon={checkmarkCircleOutline}
                              className="text-green-500 text-xl ml-2"
                            />
                          )}
                      </div>
                    </div>
                  </IonItem>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleChangePassword}
                  className="h-14 mt-4 font-black text-lg"
                  style={{
                    "--border-radius": "30px",
                    "--box-shadow": "0 12px 24px -6px rgba(60, 60, 60, 0.4)",
                  }}
                  color="dark"
                >
                  ЗМІНИТИ ПАРОЛЬ
                </IonButton>

                <div className="text-center pt-2">
                  <IonButton
                    fill="clear"
                    disabled={timeLeft > 0}
                    onClick={handleSendCode}
                    color="medium"
                    className="text-xs normal-case opacity-80"
                  >
                    {timeLeft > 0
                      ? `Надіслати код знову через ${formatTime(timeLeft)}`
                      : "Надіслати код ще раз"}
                  </IonButton>
                </div>
              </div>
            )}
          </div>
          <p className="mt-8 text-gray-400 text-[8px] md:text-[10px] tracking-widest text-center px-4">
            Продовжуючи, Ви погоджуєтесь з нашою{" "}
            <span
              onClick={() => history.push("/privacy")}
              className="underline cursor-pointer hover:text-gray-600 transition-colors font-bold text-gray-500"
            >
              Політикою конфіденційності
            </span>
          </p>
        </div>

        <IonLoading
          isOpen={isLoading}
          message="Оновлення даних..."
          spinner="circular"
          style={{ "--spinner-color": "black" } as any}
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordScreen;

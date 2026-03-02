/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  useIonToast,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useAuthStore } from "./auth.store";
import { useHistory } from "react-router-dom";
import api from "../../config/api";

const LoginScreen: React.FC = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const history = useHistory();
  const [presentToast] = useIonToast();

  const handleLogin = async () => {
    if (!login || !password) {
      presentToast({
        message: "Будь ласка, введіть логін та пароль",
        duration: 2000,
        color: "danger",
      });
      return;
    }

    try {
      const response = await api.post("/auth/signin", { login, password });

      const token = response.data.accessToken;

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const user = await api.get("/auth").then((res) => res.data);

      setAuth(token, user);

      presentToast({
        message: "Вхід успішний!",
        duration: 1500,
        color: "success",
      });

      if (user.selectedStoreId) {
        if (user.isAdmin) {
          history.replace("/admin/shop");
        } else {
          history.replace("/app/shop");
        }
      } else {
        history.replace("/select-store");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message || "Помилка входу. Перевірте дані";
      presentToast({
        message: Array.isArray(message) ? message[0] : message,
        duration: 3000,
        color: "danger",
      });
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding custom-login-bg" scrollY={false}>
        <div className="flex flex-col h-full justify-center items-center px-6">
          <div className="text-center mb-6 animate-fade-in flex flex-col items-center">
            <img
              src="/logo.png"
              alt="Логотип"
              className="h-[120px] w-auto object-contain mb-3 drop-shadow-md"
            />
            <div className="h-1 w-12 bg-gray-600 mx-auto rounded-full mb-2"></div>
            <p className="text-gray-400 font-bold tracking-widest uppercase text-[9px]">
              Ласкаво просимо! Будь ласка, увійдіть до свого кабінету
            </p>
          </div>

          <div className="w-full max-w-sm bg-white/95 rounded-[45px] p-6 shadow-2xl border border-white">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Вхід
            </h2>

            <div className="space-y-4">
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
                      Email або Телефон
                    </IonLabel>
                    <IonInput
                      value={login}
                      color={"medium"}
                      onIonInput={(e) => setLogin(e.detail.value!)}
                      className="font-medium text-gray-800"
                      placeholder="Введіть дані для входу"
                    />
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
                      Пароль
                    </IonLabel>
                    <div className="flex items-center">
                      <IonInput
                        type={showPassword ? "text" : "password"}
                        color={"medium"}
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value!)}
                        className="font-medium text-gray-800"
                        placeholder="Введіть пароль"
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

              <div className="text-right px-2">
                <span
                  onClick={() => history.push("/forgot-password")}
                  className="text-[11px] text-gray-600 font-medium hover:underline cursor-pointer"
                >
                  Забули пароль?
                </span>
              </div>

              <IonButton
                expand="block"
                onClick={handleLogin}
                className="h-14 mt-4 font-black text-lg"
                style={{
                  "--border-radius": "30px",
                  "--box-shadow": "0 12px 24px -6px rgba(60, 60, 60, 0.4)",
                }}
                color="dark"
              >
                УВІЙТИ
              </IonButton>
            </div>

            <div className="mt-8 text-center border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-1">Немає акаунту?</p>
              <span
                onClick={() => history.push("/register")}
                className="text-sm text-black font-bold hover:underline cursor-pointer"
              >
                Створити обліковий запис
              </span>
            </div>
          </div>

          <p className="mt-8 text-gray-400 text-[8px] md:text-[10px] tracking-widest">
            Продовжуючи, Ви погоджуєтесь з нашою Політикою конфіденційності
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginScreen;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonToggle,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import { syncOutline, timeOutline, alertCircleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "../auth/auth.store";
import api from "../../config/api";
import { useIsDesktop } from "../../hooks/useIsDesktop";

const SyncScreen: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthStore();
  const [presentToast] = useIonToast();

  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState("1");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [lastRun, setLastRun] = useState<string | null>(null);
  const [nextRun, setNextRun] = useState<string | null>(null);

  const isDesktop = useIsDesktop();
  const isAdminOnDesktop = user?.isAdmin && isDesktop;

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Ніколи";
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (date.toDateString() === today.toDateString()) {
      return `Сьогодні, ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Вчора, ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `${dateString}, ${timeString}`;
    }
  };

  useEffect(() => {
    if (!isAdminOnDesktop) return;

    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/sync/config");
        setIsAutoSyncEnabled(data.running);
        setLastRun(data.lastRun);
        setNextRun(data.nextRun);

        const rawPeriod = data.period;
        const cron =
          typeof rawPeriod === "string" ? rawPeriod : rawPeriod?.source || "";

        switch (cron) {
          case "0 */30 * * * *":
            setSyncInterval("0.5");
            break;
          case "0 0 */3 * * *":
            setSyncInterval("3");
            break;
          case "0 0 */6 * * *":
            setSyncInterval("6");
            break;
          case "0 0 */12 * * *":
            setSyncInterval("12");
            break;
          case "0 0 0 * * *":
            setSyncInterval("24");
            break;
          default:
            setSyncInterval("1");
        }
      } catch (error) {
        console.error("Failed to load sync config", error);
      }
    };

    fetchConfig();
  }, [isAdminOnDesktop]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const { data } = await api.post("/sync/");

      const errorsCount = data.errors?.length || 0;

      let message = "Синхронізація успішна";
      let toastColor = "success";

      if (errorsCount > 0) {
        message += ` Помилок: ${errorsCount}.`;
        toastColor = "warning";
      }

      presentToast({
        message,
        duration: 3500,
        color: toastColor,
      });

      setLastRun(new Date().toISOString());
    } catch (error) {
      console.error("Manual sync failed:", error);
      presentToast({
        message: "Не вдалося виконати синхронізацію",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggle = async (e: any) => {
    const checked = e.detail.checked;
    if (checked === isAutoSyncEnabled) return;

    setIsAutoSyncEnabled(checked);

    try {
      await api.post("/sync/toggle", { enabled: checked });
      const { data } = await api.get("/sync/config");
      setIsAutoSyncEnabled(data.running);
      setLastRun(data.lastRun);
      setNextRun(data.nextRun);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsAutoSyncEnabled(!checked);
      presentToast({
        message: "Не вдалося змінити статус",
        duration: 3000,
        color: "danger",
      });
    }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    let cronExpression = "0 0 * * * *";

    if (syncInterval === "0.5") cronExpression = "0 */30 * * * *";
    else if (syncInterval === "3") cronExpression = "0 0 */3 * * *";
    else if (syncInterval === "6") cronExpression = "0 0 */6 * * *";
    else if (syncInterval === "12") cronExpression = "0 0 */12 * * *";
    else if (syncInterval === "24") cronExpression = "0 0 0 * * *";

    try {
      await api.post("/sync/config", { cronExpression });

      const { data } = await api.get("/sync/config");
      setNextRun(data.nextRun);

      presentToast({
        message: "Розклад успішно збережено",
        duration: 2500,
        color: "success",
      });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      presentToast({
        message: "Не вдалося зберегти розклад",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  if (!isAdminOnDesktop) {
    return (
      <IonPage>
        <IonContent className="bg-gray-50">
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <IonIcon
              icon={alertCircleOutline}
              className="text-6xl text-gray-300"
            />
            <h2 className="text-xl font-bold text-gray-700">
              Доступ заборонено
            </h2>
            <p className="text-sm">
              Ця сторінка доступна лише для адміністраторів з ПК.
            </p>
            <button
              onClick={() => history.goBack()}
              className="mt-4 px-6 py-2 bg-black text-white rounded-xl font-bold active:scale-95 transition-all"
            >
              Повернутися
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-8 py-12 max-w-4xl mt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
              Управління синхронізацією
            </h1>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <IonIcon icon={syncOutline} className="text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Ручна синхронізація
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 max-w-md mt-4 leading-relaxed">
                    Примусово завантажити останні залишки, ціни та нові товари з
                    УкрСкладу. Цей процес може зайняти від кількох секунд до
                    хвилини.
                  </p>
                </div>

                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`shrink-0 px-8 py-4 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition-all ${
                    isSyncing
                      ? "bg-gray-100 text-gray-400 shadow-none cursor-wait"
                      : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-gray-200"
                  }`}
                >
                  <IonIcon
                    icon={syncOutline}
                    className={`text-lg ${isSyncing ? "animate-spin" : ""}`}
                  />
                  {isSyncing ? "Синхронізація..." : "Запустити зараз"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <IonIcon icon={timeOutline} className="text-xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Автоматична синхронізація
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex gap-12 px-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      Минулий запуск
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {formatDate(lastRun)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      Наступний запуск
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {isAutoSyncEnabled ? formatDate(nextRun) : "Вимкнено"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-base">
                      Статус фонової синхронізації
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Якщо увімкнено, сервер буде самостійно оновлювати дані за
                      розкладом.
                    </span>
                  </div>
                  <IonToggle
                    color="success"
                    checked={isAutoSyncEnabled}
                    onIonChange={handleToggle}
                    style={{ transform: "scale(1.1)" }}
                  />
                </div>

                <div
                  className={`transition-opacity duration-300 ${
                    !isAutoSyncEnabled
                      ? "opacity-50 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Інтервал оновлення (Розклад)
                  </label>
                  <div className="flex gap-4">
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      disabled={!isAutoSyncEnabled || isSavingSchedule}
                      className="bg-gray-50 border border-gray-200 text-gray-800 font-bold text-sm rounded-xl px-4 py-3 outline-none focus:border-black focus:bg-white transition-all w-64 cursor-pointer"
                    >
                      <option value="0.5">Кожні 30 хвилин</option>
                      <option value="1">Кожну годину</option>
                      <option value="3">Кожні 3 години</option>
                      <option value="6">Кожні 6 годин</option>
                      <option value="12">Кожні 12 годин</option>
                      <option value="24">Кожні 24 години</option>
                    </select>
                    <button
                      onClick={handleSaveSchedule}
                      disabled={!isAutoSyncEnabled || isSavingSchedule}
                      className="shrink-0 px-8 py-4 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition-all bg-black text-white hover:bg-gray-800 active:scale-95 shadow-gray-200"
                    >
                      Зберегти розклад
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SyncScreen;

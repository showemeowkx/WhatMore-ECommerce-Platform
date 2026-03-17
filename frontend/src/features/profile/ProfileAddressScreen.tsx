import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  useIonToast,
} from "@ionic/react";
import {
  chevronBackOutline,
  locationOutline,
  addOutline,
  pencilOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "../auth/auth.store";
import AddressModal from "./components/AddressModal";
import api from "../../config/api";

const ProfileAddressScreen: React.FC = () => {
  const history = useHistory();
  const { user, updateUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [presentToast] = useIonToast();

  const handleSaveAddress = async (data: {
    street: string;
    streetNumber: string;
    apartment: string;
  }) => {
    try {
      await api.patch("/auth", {
        deliveryAddress: data.street,
        streetNumber: data.streetNumber,
        apartment: data.apartment,
      });

      updateUser({
        deliveryAddress: data.street,
        streetNumber: data.streetNumber,
        apartment: data.apartment,
      });

      presentToast({
        message: "Адресу успішно збережено",
        duration: 1500,
        color: "success",
      });
    } catch (error) {
      console.error("Не вдалося зберегти адресу:", error);

      presentToast({
        message: "Помилка при збереженні адреси",
        duration: 2000,
        color: "danger",
      });
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white md:hidden pt-safe">
        <IonToolbar style={{ "--background": "white" }}>
          <div className="flex items-center px-2 relative h-full">
            <IonButton
              color="medium"
              fill="clear"
              onClick={() => history.goBack()}
              className="text-gray-800 z-10"
            >
              <IonIcon icon={chevronBackOutline} className="text-2xl" /> Назад
            </IonButton>
            <span className="absolute left-0 right-0 text-center font-bold text-gray-800 text-lg pointer-events-none">
              Моя адреса
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-4 py-6 md:py-12 md:mt-20 max-w-2xl animate-fade-in pb-32">
          <div className="flex items-center gap-4 mb-8 hidden md:flex">
            <button
              onClick={() => history.goBack()}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <IonIcon icon={chevronBackOutline} className="text-3xl" />
            </button>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              Моя адреса
            </h1>
          </div>

          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-800 mb-2 pl-1">
              Адреса доставки
            </h2>
            <p className="text-sm text-gray-500 mb-5 pl-1">
              Сюди ми будемо доставляти Ваші замовлення за замовчуванням.
            </p>

            {user?.deliveryAddress ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 md:p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 border-green-300 border-[1px] flex items-center justify-center text-green-500 border border-green-100 shrink-0 mt-1">
                    <IonIcon icon={locationOutline} className="text-xl" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-0.5">
                      Поточна адреса
                    </span>
                    <span className="font-bold text-gray-800 text-[17px] leading-tight mb-1.5">
                      {user.deliveryAddress}
                      {user.streetNumber ? `, буд. ${user.streetNumber}` : ""}
                    </span>
                    {user.apartment && (
                      <span className="text-[15px] font-medium text-gray-500">
                        Квартира: {user.apartment}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 mb-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex border-[1px] border-gray-300 items-center justify-center mx-auto mb-4">
                  <IonIcon
                    icon={locationOutline}
                    className="text-3xl text-gray-500"
                  />
                </div>
                <span className="font-bold text-gray-800 text-lg mb-1">
                  Адресу не встановлено
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  Додайте адресу для швидшого оформлення замовлень
                </span>
              </div>
            )}

            <button
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="w-full py-4 mt-4 bg-black text-white rounded-2xl font-bold text-base hover:bg-gray-800 active:scale-95 shadow-md shadow-gray-200 transition-all flex justify-center items-center gap-2 outline-none select-none"
            >
              <IonIcon
                icon={user?.deliveryAddress ? pencilOutline : addOutline}
                className="text-xl"
              />
              {user?.deliveryAddress ? "Змінити адресу" : "Додати адресу"}
            </button>
          </div>
        </div>
      </IonContent>

      <AddressModal
        isOpen={isModalOpen}
        onDidDismiss={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
      />
    </IonPage>
  );
};

export default ProfileAddressScreen;

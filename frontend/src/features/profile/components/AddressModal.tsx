import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
} from "@ionic/react";
import { closeOutline, locationOutline } from "ionicons/icons";

interface AddressModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onDidDismiss,
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderModalContent = () => (
    <IonContent className="bg-white hide-scrollbar">
      <div className={`p-6 ${isDesktop ? "pt-4 pb-8" : "pt-8"}`}>
        {!isDesktop && (
          <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">
            Введіть адресу
          </h2>
        )}

        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex border-[1px] border-gray-300 items-center justify-center mx-auto mb-4">
              <IonIcon
                icon={locationOutline}
                className="text-3xl text-gray-500"
              />
            </div>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Введіть зручну для Вас адресу доставки
            </p>
          </div>

          <div className="space-y-6 animate-fade-in">
            <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner">
              <IonItem
                lines="none"
                className="bg-transparent"
                style={{ "--background": "transparent" }}
              >
                <div className="w-full">
                  <IonLabel
                    position="stacked"
                    className="text-purple-600 font-bold ml-1 mb-1"
                  >
                    Вулиця (м. Фастів)
                  </IonLabel>
                  <div className="flex items-center">
                    <IonInput
                      type="text"
                      color="medium"
                      className="font-medium text-gray-800"
                      placeholder="Назва вулиці, номер будинку..."
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
                    className="text-purple-600 font-bold ml-1 mb-1"
                  >
                    Квартира
                  </IonLabel>
                  <div className="flex items-center">
                    <IonInput
                      type="text"
                      color="medium"
                      className="font-medium text-gray-800"
                      placeholder="Номер квартири..."
                    />
                  </div>
                </div>
              </IonItem>
            </div>

            <p className="text-gray-500 text-xs font-medium leading-relaxed mt-2 align-middle text-center">
              Не вказуйте номер квартири, якщо будинок приватний
            </p>

            <IonButton
              expand="block"
              onClick={() => {
                onDidDismiss();
              }}
              className="h-14 mt-4 font-black text-lg"
              style={{
                "--border-radius": "30px",
                "--box-shadow": "0 12px 24px -6px rgba(60, 60, 60, 0.4)",
              }}
              color="dark"
            >
              ЗБЕРЕГТИ
            </IonButton>
          </div>
        </div>
      </div>
    </IonContent>
  );

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      breakpoints={isDesktop ? undefined : [0, 0.65, 0.9]}
      initialBreakpoint={isDesktop ? undefined : 0.65}
      style={
        isDesktop
          ? {
              "--width": "500px",
              "--height": "540px",
              "--border-radius": "24px",
            }
          : undefined
      }
    >
      {isDesktop && (
        <IonHeader className="ion-no-border bg-white rounded-t-[24px]">
          <IonToolbar className="bg-white px-2 rounded-t-[24px]">
            <h2 className="text-xl font-black text-gray-800 ml-2">
              Введіть адресу
            </h2>
            <IonButton
              slot="end"
              fill="clear"
              color="medium"
              onClick={onDidDismiss}
            >
              <IonIcon icon={closeOutline} className="text-2xl" />
            </IonButton>
          </IonToolbar>
        </IonHeader>
      )}
      {renderModalContent()}
    </IonModal>
  );
};

export default AddressModal;

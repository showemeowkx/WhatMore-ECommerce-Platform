import React, { useState, useEffect, useRef } from "react";
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
import api from "../../../config/api";

interface AddressModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onDidDismiss,
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [apartment, setApartment] = useState("");

  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isStreetSelected, setIsStreetSelected] = useState(false);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStreet("");
      setStreetNumber("");
      setApartment("");
      setSearchResults([]);
      setShowDropdown(false);
      setIsStreetSelected(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (!street.trim() || street.trim().length < 2) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const { data } = await api.get("/delivery/streets", {
          params: { search: street },
        });

        const results = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setSearchResults(results);
      } catch (error) {
        console.error("Помилка пошуку вулиць:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [street]);

  const handleSelectStreet = (selectedStreet: string) => {
    isSelectingRef.current = true;
    setStreet(selectedStreet);
    setIsStreetSelected(true);
    setShowDropdown(false);
  };

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
            <div className="relative">
              <div className="bg-gray-100/50 rounded-[30px] px-4 py-1 border border-gray-200/30 shadow-inner relative z-10">
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
                        value={street}
                        onIonInput={(e) => {
                          setStreet((e.detail.value as string) || "");
                          setIsStreetSelected(false);
                        }}
                        color="medium"
                        className="font-medium text-gray-800"
                        placeholder="Назва вулиці..."
                      />
                    </div>
                  </div>
                </IonItem>
              </div>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-xl border border-gray-100 z-50 max-h-48 overflow-y-auto overflow-x-hidden animate-fade-in-up">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-400 font-bold animate-pulse">
                      Пошук...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((option, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectStreet(option)}
                        className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer text-sm font-bold text-gray-700"
                      >
                        {option}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-400 font-bold">
                      Вулицю не знайдено
                    </div>
                  )}
                </div>
              )}
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
                    Будинок
                  </IonLabel>
                  <div className="flex items-center">
                    <IonInput
                      type="text"
                      value={streetNumber}
                      onIonInput={(e) =>
                        setStreetNumber((e.detail.value as string) || "")
                      }
                      color="medium"
                      className="font-medium text-gray-800"
                      placeholder="Номер будинку..."
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
                      value={apartment}
                      onIonInput={(e) =>
                        setApartment((e.detail.value as string) || "")
                      }
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
              disabled={!isStreetSelected || !streetNumber.trim()}
              onClick={() => {}}
              className={`h-14 mt-4 font-black text-lg ${
                !isStreetSelected || !streetNumber.trim() ? "opacity-50" : ""
              }`}
              style={{
                "--border-radius": "30px",
                "--box-shadow":
                  isStreetSelected && streetNumber.trim()
                    ? "0 12px 24px -6px rgba(60, 60, 60, 0.4)"
                    : "none",
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
      breakpoints={isDesktop ? undefined : [0, 0.95, 0.9]}
      initialBreakpoint={isDesktop ? undefined : 0.95}
      style={
        isDesktop
          ? {
              "--width": "500px",
              "--height": "640px",
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

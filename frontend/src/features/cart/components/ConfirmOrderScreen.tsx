import React, { useState, useRef, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonFooter,
  isPlatform,
} from "@ionic/react";
import {
  chevronBackOutline,
  locationOutline,
  walletOutline,
  chatbubbleOutline,
  chevronDownOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "../../auth/auth.store";

const ConfirmOrderScreen: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthStore();

  const isDesktop = isPlatform("desktop");

  const hasDefaultAddress = !!user?.deliveryAddress;
  const [useDefaultAddress, setUseDefaultAddress] = useState(hasDefaultAddress);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [comment, setComment] = useState("");

  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        paymentRef.current &&
        !paymentRef.current.contains(event.target as Node)
      ) {
        setIsPaymentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedAddress = user?.deliveryAddress
    ? `м. Фастів, вул. ${user.deliveryAddress}${user.streetNumber ? `, буд. ${user.streetNumber}` : ""}${user.apartment ? `, кв. ${user.apartment}` : ""}`
    : "Адресу не встановлено";

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white md:hidden pt-safe">
        <IonToolbar style={{ "--background": "white" }}>
          <div className="flex items-center px-2 h-full">
            <IonButton
              color="medium"
              fill="clear"
              onClick={() => history.goBack()}
              className="text-gray-800 m-0"
            >
              <IonIcon icon={chevronBackOutline} className="text-2xl" /> Назад
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        scrollY={isDesktop}
        className="bg-gray-50 text-gray-900"
        fullscreen
      >
        <div className="container mx-auto px-4 py-4 md:py-12 md:mt-20 max-w-2xl h-full flex flex-col md:block animate-fade-in md:pb-32">
          <div className="flex items-center gap-4 mb-8 hidden md:flex shrink-0">
            <button
              onClick={() => history.goBack()}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <IonIcon icon={chevronBackOutline} className="text-3xl" />
            </button>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              Оформлення замовлення
            </h1>
          </div>

          <div className="flex flex-col flex-1 gap-6 md:block md:space-y-8">
            <div className="shrink-0">
              <h2 className="text-lg font-black text-gray-800 mb-3 md:mb-4 pl-1 flex items-center gap-2">
                <IonIcon
                  icon={locationOutline}
                  className="text-xl text-gray-500"
                />
                Адреса доставки
              </h2>

              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 md:p-5">
                {hasDefaultAddress ? (
                  <>
                    <label className="flex items-start gap-3 cursor-pointer mb-4">
                      <div className="relative flex items-center justify-center w-6 h-6 mt-0.5">
                        <input
                          type="radio"
                          name="addressOption"
                          checked={useDefaultAddress}
                          onChange={() => setUseDefaultAddress(true)}
                          className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:border-black transition-colors outline-none"
                        />
                        <div className="absolute w-3 h-3 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-gray-800 text-base mb-1">
                          Моя адреса
                        </span>
                        <span className="text-sm font-medium text-gray-500 leading-snug">
                          {formattedAddress}
                        </span>
                      </div>
                    </label>

                    <hr className="border-gray-100 my-4" />

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <input
                          type="radio"
                          name="addressOption"
                          checked={!useDefaultAddress}
                          onChange={() => setUseDefaultAddress(false)}
                          className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:border-black transition-colors outline-none"
                        />
                        <div className="absolute w-3 h-3 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="font-bold text-gray-800 text-base">
                        Доставити за іншою адресою
                      </span>
                    </label>

                    <div className="mt-4 md:mt-5 pl-9">
                      <button
                        disabled={useDefaultAddress}
                        onClick={() => {}}
                        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all border-2 outline-none select-none ${
                          useDefaultAddress
                            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-black border-black text-white hover:bg-gray-800 active:scale-95"
                        }`}
                      >
                        Ввести іншу адресу
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-gray-500 text-sm mb-4">
                      Ви ще не додали адресу доставки
                    </p>
                    <button
                      onClick={() => {}}
                      className="w-full py-3 rounded-2xl font-bold text-sm transition-all border-2 border-black outline-none select-none bg-black text-white hover:bg-gray-800 active:scale-95"
                    >
                      Ввести адресу
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 relative z-20">
              <h2 className="text-lg font-black text-gray-800 mb-3 md:mb-4 pl-1 flex items-center gap-2">
                <IonIcon
                  icon={walletOutline}
                  className="text-xl text-gray-500"
                />
                Спосіб оплати
              </h2>

              <div className="relative w-full" ref={paymentRef}>
                <button
                  onClick={() =>
                    setIsPaymentDropdownOpen(!isPaymentDropdownOpen)
                  }
                  className={`w-full flex items-center justify-between px-4 py-2.5 h-12 rounded-xl border transition-all ${
                    isPaymentDropdownOpen
                      ? "bg-white border-gray-300 shadow-sm"
                      : "bg-gray-50 border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-sm font-bold text-gray-700 truncate">
                      {paymentMethod === "cash" ? "Готівкою" : "Карткою"}
                    </span>
                  </div>
                  <IonIcon
                    icon={chevronDownOutline}
                    className={`text-xs transition-transform duration-200 shrink-0 ${
                      isPaymentDropdownOpen
                        ? "rotate-180 text-black"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                {isPaymentDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fade-in-down">
                    {[
                      { value: "cash", label: "Готівкою" },
                      { value: "card", label: "Карткою" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPaymentMethod(option.value);
                          setIsPaymentDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors mb-1 ${
                          paymentMethod === option.value
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold truncate pr-2 ${
                            paymentMethod === option.value
                              ? "text-black"
                              : "text-gray-700"
                          }`}
                        >
                          {option.label}
                        </span>
                        {paymentMethod === option.value && (
                          <IonIcon
                            icon={checkmarkOutline}
                            className="text-black shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 pb-4 md:pb-0 md:block relative z-10">
              <h2 className="text-lg font-black text-gray-800 mb-3 md:mb-4 pl-1 flex items-center gap-2 shrink-0">
                <IonIcon
                  icon={chatbubbleOutline}
                  className="text-xl text-gray-500"
                />
                Коментар до замовлення
              </h2>

              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-1 flex-1 flex flex-col min-h-[100px] md:block md:h-auto">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Напишіть коментар (не обов'язково)..."
                  className="w-full h-full md:h-28 bg-transparent px-4 py-4 font-medium text-gray-800 outline-none resize-none flex-1 md:flex-none"
                />
              </div>
            </div>

            {isDesktop && (
              <div className="pt-2 pb-8">
                <button
                  disabled={!hasDefaultAddress}
                  onClick={() => {}}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all outline-none select-none ${
                    !hasDefaultAddress
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-md shadow-gray-200"
                  }`}
                >
                  Підтвердити замовлення
                </button>
              </div>
            )}
          </div>
        </div>
      </IonContent>

      {!isDesktop && (
        <IonFooter className="ion-no-border bg-white md:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-safe">
          <div className="px-4 py-3">
            <button
              disabled={!hasDefaultAddress}
              onClick={() => {}}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all outline-none select-none ${
                !hasDefaultAddress
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-md shadow-gray-200"
              }`}
            >
              Підтвердити замовлення
            </button>
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default ConfirmOrderScreen;

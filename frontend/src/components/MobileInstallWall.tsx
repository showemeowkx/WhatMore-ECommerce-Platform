import React from "react";
import { IonIcon } from "@ionic/react";
import { logoAndroid } from "ionicons/icons";

const MobileInstallWall: React.FC = () => {
  const playStoreUrl =
    import.meta.env.VITE_GOOGLE_PLAY_URL || "https://play.google.com/store/";

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-48 h-48 md:w-56 md:h-56 mb-4 flex items-center justify-center drop-shadow-sm">
        <img
          src="/logo.png"
          alt="WhatMore"
          className="w-full h-full object-contain"
        />
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-5">
        Встановіть додаток
      </h1>

      <p className="text-gray-500 mb-10 max-w-[320px] text-base">
        Для найкращого досвіду, швидкості та зручності, ми працюємо тільки як
        додаток на мобільних пристроях. Доступний в Google Play.
      </p>

      <a
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black text-white hover:bg-gray-800 active:scale-95 transition-all px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-xl shadow-gray-200/50 w-full max-w-[320px] justify-center no-underline"
      >
        <IonIcon icon={logoAndroid} className="text-2xl" />
        Завантажити додаток
      </a>
    </div>
  );
};

export default MobileInstallWall;

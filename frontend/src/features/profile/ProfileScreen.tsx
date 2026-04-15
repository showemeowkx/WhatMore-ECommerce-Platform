import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  useIonAlert,
} from "@ionic/react";
import {
  chevronBackOutline,
  personOutline,
  lockClosedOutline,
  chatbubblesOutline,
  documentTextOutline,
  logOutOutline,
  chevronForwardOutline,
  alertCircleOutline,
  locationOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import api from "../../config/api";
import { useAuthStore } from "../auth/auth.store";

const ProfileScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [presentAlert] = useIonAlert();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get("/auth");
        if (setUser) {
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (logout) {
        logout();
      }

      history.replace("/login");
    }
  };

  const confirmLogout = () => {
    presentAlert({
      header: "Вихід",
      message: "Ви дійсно хочете вийти з акаунта?",
      buttons: [
        {
          text: "Скасувати",
          role: "cancel",
          cssClass: "text-gray-500 font-medium",
        },
        {
          text: "Вийти",
          role: "destructive",
          cssClass: "text-red-500 font-bold",
          handler: () => {
            handleLogout();
          },
        },
      ],
    });
  };

  const menuItems = [
    {
      title: "Редагувати профіль",
      icon: personOutline,
      path: `${basePath}/profile/edit`,
    },
    {
      title: "Моя адреса",
      icon: locationOutline,
      path: `${basePath}/profile/address`,
    },
    {
      title: "Безпека",
      icon: lockClosedOutline,
      path: `${basePath}/profile/security`,
    },
    {
      title: "Підтримка",
      icon: chatbubblesOutline,
      path: `${basePath}/profile/support`,
    },
    {
      title: "Політика конфіденційності",
      icon: documentTextOutline,
      path: `/policy`,
    },
  ];

  const hasNameOrSurname = Boolean(user?.name || user?.surname);
  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ");

  const getInitials = () => {
    if (user?.name && user?.surname) {
      return `${user.name[0]}${user.surname[0]}`.toUpperCase();
    }
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.surname) return user.surname[0].toUpperCase();
    return "👤";
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
              Кабінет
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-4 py-6 md:py-12 md:mt-20 max-w-3xl animate-fade-in pb-32">
          <h1 className="hidden md:block text-3xl font-black text-gray-800 mb-8">
            Особистий кабінет
          </h1>

          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5 mb-6 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <IonSpinner
                  name="crescent"
                  style={{ "--spinner-color": "black" }}
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-3xl overflow-hidden shadow-sm">
                {user?.imagePath ? (
                  <img
                    src={user.imagePath}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>

              {user?.isAdmin && (
                <span className="hidden md:flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-300 text-yellow-600 uppercase tracking-wider border border-gray-200">
                  Admin
                </span>
              )}
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
              {hasNameOrSurname ? (
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {displayName}
                </h2>
              ) : (
                <h2 className="text-lg font-bold text-gray-400">
                  Ім'я не вказано
                </h2>
              )}

              {!hasNameOrSurname && (
                <button
                  onClick={() => history.push(`${basePath}/profile/edit`)}
                  className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all w-max mt-2"
                >
                  <IonIcon icon={alertCircleOutline} className="text-lg" />
                  Додати дані
                </button>
              )}

              {user?.phone && (
                <p className="text-gray-500 font-medium mt-1.5">{user.phone}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 mb-6 flex flex-col">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => history.push(item.path)}
                className={`flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors active:bg-gray-100 first:rounded-t-[24px] last:rounded-b-[24px] ${
                  index !== menuItems.length - 1
                    ? "border-b border-gray-50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                    <IonIcon icon={item.icon} className="text-xl" />
                  </div>
                  <span className="font-bold text-gray-800 text-[15px]">
                    {item.title}
                  </span>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  className="text-gray-300 text-xl"
                />
              </button>
            ))}
          </div>

          <button
            onClick={confirmLogout}
            className="w-full bg-white rounded-[24px] p-4 md:p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-red-50 transition-colors active:bg-red-100 text-red-500 group overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors border border-red-100">
                <IonIcon icon={logOutOutline} className="text-xl pl-1" />
              </div>
              <span className="font-bold text-[15px]">Вийти з акаунту</span>
            </div>
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfileScreen;

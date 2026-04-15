import React from "react";
import { useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./index.css";

import { useAuthStore } from "./features/auth/auth.store";
import LoginScreen from "./features/auth/LoginScreen";
import RegisterScreen from "./features/auth/RegisterScreen";
import ForgotPasswordScreen from "./features/auth/RestorePasswordScreen";
import ShopLayout from "./features/shop/ShopLayout";
import SelectStoreScreen from "./features/auth/SelectStoreScreen";
import { useAdminSSE } from "./hooks/useAdminSSE";

setupIonicReact();

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  useAdminSSE();

  const getHomeRoute = () => {
    if (user?.isAdmin) return "/admin";
    if (user?.selectedStoreId) return "/app";
    return "/select-store";
  };

  useEffect(() => {
    const setRealHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setRealHeight();
    window.addEventListener("resize", setRealHeight);

    return () => window.removeEventListener("resize", setRealHeight);
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            {isAuthenticated ? (
              <Redirect to={getHomeRoute()} />
            ) : (
              <LoginScreen />
            )}
          </Route>

          <Route exact path="/register">
            {isAuthenticated ? (
              <Redirect to={getHomeRoute()} />
            ) : (
              <RegisterScreen />
            )}
          </Route>

          <Route exact path="/select-store">
            {isAuthenticated ? <SelectStoreScreen /> : <Redirect to="/login" />}
          </Route>

          <Route exact path="/forgot-password">
            {isAuthenticated ? <Redirect to="/" /> : <ForgotPasswordScreen />}
          </Route>

          <Route path="/admin">
            {isAuthenticated && user?.isAdmin ? (
              <ShopLayout />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          <Route path="/app">
            {isAuthenticated ? (
              user?.isAdmin ? (
                <Redirect to="/admin" />
              ) : user?.selectedStoreId ? (
                <ShopLayout />
              ) : (
                <Redirect to="/select-store" />
              )
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          <Route exact path="/">
            {isAuthenticated ? (
              <Redirect to={getHomeRoute()} />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          <Route render={() => <Redirect to="/" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;

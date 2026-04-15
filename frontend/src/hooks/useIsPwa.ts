import { useState, useEffect } from "react";

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as NavigatorStandalone).standalone === true
      );
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches || (window.navigator as NavigatorStandalone).standalone === true);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isPWA;
};

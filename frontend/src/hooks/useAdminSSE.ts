import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useAuthStore } from "../features/auth/auth.store";
import { useOrdersStore } from "../features/orders/orders.store";
import { API_URL } from "../config/api";

export const useAdminSSE = () => {
  const { user, token } = useAuthStore();
  const { setHasNewOrders } = useOrdersStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user?.isAdmin || !token) {
      abortControllerRef.current?.abort();
      return;
    }

    abortControllerRef.current = new AbortController();

    const connect = async () => {
      await fetchEventSource(`${API_URL}/notifications/admin-events`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: abortControllerRef.current?.signal,
        onmessage(event) {
          const parsedData = JSON.parse(event.data);

          if (parsedData.type === "NEW_ORDER") {
            setHasNewOrders(true);
          }
        },
        onclose() {},
        onerror(err) {
          console.error("SSE Error:", err);
          throw err;
        },
      });
    };

    connect();

    return () => abortControllerRef.current?.abort();
  }, [user, token, setHasNewOrders]);
};

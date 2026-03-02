import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter,
} from "@ionic/react";
import { bagHandleOutline, searchOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import OrderCard from "./components/OrderCard";
import api from "../../config/api";

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
}

const PurchasesScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const formatDate = (isoString: string) => {
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

  const fetchOrders = async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);

      const { data } = await api.get(`/orders?limit=10&page=${pageNum}`);
      const fetchedOrders = data.data || [];

      if (isInitial) {
        setOrders(fetchedOrders);
      } else {
        setOrders((prev) => [...prev, ...fetchedOrders]);
      }

      setHasMore(pageNum < (data.metadata?.totalPages || 1));
      setPage(pageNum);
    } catch (error) {
      console.error("Помилка при завантаженні покупок:", error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  useIonViewWillEnter(() => {
    fetchOrders(1, true);
  });

  const loadMore = async (e: CustomEvent<void>) => {
    await fetchOrders(page + 1);
    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white hidden md:block pt-safe">
        <IonToolbar style={{ "--background": "white" }}>
          <div className="flex items-center px-2 relative h-full">
            <span className="absolute left-0 right-0 text-center font-bold text-gray-800 text-lg pointer-events-none">
              Історія покупок
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-12 max-w-3xl pb-32 animate-fade-in">
          {(isLoading || orders.length > 0) && (
            <>
              <div className="flex items-center gap-4 mb-6 md:hidden">
                <h1 className="text-3xl font-black text-gray-800 pl-1">
                  Історія покупок
                </h1>
              </div>

              <div className="hidden md:flex items-center gap-4 mb-8">
                <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                  Історія покупок
                </h1>
              </div>
            </>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <IonSpinner name="crescent" className="text-black w-8 h-8" />
              <span className="text-gray-500 font-bold text-sm">
                Завантаження замовлень...
              </span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-40 md:-mt-8 px-6 text-center animate-fade-in-up">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm border-[2px] border-gray-300 mb-6">
                <IonIcon
                  icon={bagHandleOutline}
                  className="text-6xl text-gray-600"
                />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-3">
                У вас ще немає покупок
              </h2>
              <p className="text-gray-500 mb-10 max-w-[280px]">
                Ви ще нічого не купували. Перейдіть до каталогу та оформіть своє
                перше замовлення!
              </p>
              <button
                onClick={() => history.push(`${basePath}/shop`)}
                className="bg-black hover:bg-gray-800 active:scale-95 transition-all text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-md shadow-gray-200 flex items-center gap-2"
              >
                <IonIcon icon={searchOutline} className="text-xl" />
                Перейти до магазину
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  orderNumber={order.orderNumber || order.id}
                  date={formatDate(order.createdAt)}
                  amount={Number(order.totalAmount)}
                  status={order.status}
                  onClick={() =>
                    history.push(`${basePath}/purchase/${order.id}`)
                  }
                />
              ))}
            </div>
          )}

          <IonInfiniteScroll
            onIonInfinite={loadMore}
            disabled={!hasMore || isLoading}
          >
            <IonInfiniteScrollContent
              loadingSpinner="crescent"
              loadingText="Завантаження..."
            />
          </IonInfiniteScroll>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PurchasesScreen;

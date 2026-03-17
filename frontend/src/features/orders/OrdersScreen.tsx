import React, { useState, useRef, useEffect, useCallback } from "react";
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
import {
  searchOutline,
  receiptOutline,
  storefrontOutline,
  funnelOutline,
  chevronDownOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import OrderCard from "./components/OrderCard";
import api from "../../config/api";
import { useOrdersStore } from "./orders.store";

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
}

interface Store {
  id: number;
  address: string;
}

const STATUS_OPTIONS = [
  { value: "IN PROCESS", label: "У процесі обробки" },
  { value: "IN DELIVERY", label: "Доставляється" },
  { value: "COMPLETED", label: "Виконано" },
  { value: "CANCELLED", label: "Скасовано" },
];

const OrdersScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const storeRef = useRef<HTMLDivElement>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const { markAsViewed } = useOrdersStore();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data } = await api.get("/store?limit=0&showInactive=1");
        setStores(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Failed to fetch stores", error);
      }
    };
    fetchStores();
  }, []);

  const fetchOrders = useCallback(
    async (pageNum: number, isInitial = false) => {
      try {
        if (isInitial) setIsLoading(true);

        const params = new URLSearchParams({
          limit: "10",
          page: pageNum.toString(),
        });

        if (selectedStore) params.append("storeId", selectedStore.toString());
        if (selectedStatus) params.append("status", selectedStatus);
        if (searchQuery) params.append("search", searchQuery);

        const { data } = await api.get(`/orders/all?${params.toString()}`);
        const fetchedOrders = data.data || [];

        if (isInitial) {
          setOrders(fetchedOrders);
        } else {
          setOrders((prev) => [...prev, ...fetchedOrders]);
        }

        setHasMore(pageNum < (data.metadata?.totalPages || 1));
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [selectedStore, selectedStatus, searchQuery],
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders(1, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchOrders]);

  useIonViewWillEnter(() => {
    markAsViewed();
    fetchOrders(1, true);
  });

  const loadMore = async (e: CustomEvent<void>) => {
    await fetchOrders(page + 1);
    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        storeRef.current &&
        !storeRef.current.contains(event.target as Node)
      ) {
        setIsStoreOpen(false);
      }
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const currentStoreLabel = selectedStore
    ? stores.find((s) => s.id === selectedStore)?.address
    : "Всі магазини";

  const currentStatusLabel = selectedStatus
    ? STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label
    : "Всі статуси";

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white pt-safe">
        <IonToolbar style={{ "--background": "white" }}>
          <div className="flex items-center px-6 relative h-full">
            <span className="font-bold text-gray-800 text-lg">
              Управління замовленнями
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-10 max-w-5xl pb-32 animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              Всі замовлення
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative z-20">
            <div className="bg-gray-50 rounded-xl px-4 py-2.5 w-full md:flex-1 flex items-center h-12 relative border border-gray-100 focus-within:border-gray-300 transition-colors">
              <IonIcon
                icon={searchOutline}
                className="text-xl text-gray-400 mr-3 shrink-0"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за номером..."
                className="w-full bg-transparent outline-none text-gray-700 text-sm font-bold placeholder:text-gray-400"
              />
            </div>

            <div className="relative w-full md:w-64" ref={storeRef}>
              <button
                onClick={() => {
                  setIsStoreOpen(!isStoreOpen);
                  setIsStatusOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 h-12 rounded-xl border transition-all ${
                  isStoreOpen
                    ? "bg-white border-gray-300 shadow-sm"
                    : "bg-gray-50 border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <IonIcon
                    icon={storefrontOutline}
                    className={`text-xl shrink-0 ${isStoreOpen ? "text-black" : "text-gray-400"}`}
                  />
                  <span className="text-sm font-bold text-gray-700 truncate">
                    {currentStoreLabel}
                  </span>
                </div>
                <IonIcon
                  icon={chevronDownOutline}
                  className={`text-xs transition-transform duration-200 shrink-0 ${isStoreOpen ? "rotate-180 text-black" : "text-gray-400"}`}
                />
              </button>

              {isStoreOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fade-in-down">
                  <div className="max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <button
                      onClick={() => {
                        setSelectedStore(null);
                        setIsStoreOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors mb-1 ${
                        selectedStore === null
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${selectedStore === null ? "text-black" : "text-gray-700"}`}
                      >
                        Всі магазини
                      </span>
                      {selectedStore === null && (
                        <IonIcon
                          icon={checkmarkOutline}
                          className="text-black"
                        />
                      )}
                    </button>

                    {stores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedStore(store.id);
                          setIsStoreOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors mb-1 ${
                          selectedStore === store.id
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold truncate pr-2 ${selectedStore === store.id ? "text-black" : "text-gray-700"}`}
                        >
                          {store.address}
                        </span>
                        {selectedStore === store.id && (
                          <IonIcon
                            icon={checkmarkOutline}
                            className="text-black shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full md:w-56" ref={statusRef}>
              <button
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsStoreOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 h-12 rounded-xl border transition-all ${
                  isStatusOpen
                    ? "bg-white border-gray-300 shadow-sm"
                    : "bg-gray-50 border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <IonIcon
                    icon={funnelOutline}
                    className={`text-xl shrink-0 ${isStatusOpen ? "text-black" : "text-gray-400"}`}
                  />
                  <span className="text-sm font-bold text-gray-700 truncate">
                    {currentStatusLabel}
                  </span>
                </div>
                <IonIcon
                  icon={chevronDownOutline}
                  className={`text-xs transition-transform duration-200 shrink-0 ${isStatusOpen ? "rotate-180 text-black" : "text-gray-400"}`}
                />
              </button>

              {isStatusOpen && (
                <div className="absolute top-full right-0 md:left-0 mt-2 md:w-full min-w-[200px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fade-in-down">
                  <button
                    onClick={() => {
                      setSelectedStatus(null);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors mb-1 ${
                      selectedStatus === null
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${selectedStatus === null ? "text-black" : "text-gray-700"}`}
                    >
                      Всі статуси
                    </span>
                    {selectedStatus === null && (
                      <IonIcon icon={checkmarkOutline} className="text-black" />
                    )}
                  </button>

                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setSelectedStatus(status.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors mb-1 ${
                        selectedStatus === status.value
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold truncate pr-2 ${selectedStatus === status.value ? "text-black" : "text-gray-700"}`}
                      >
                        {status.label}
                      </span>
                      {selectedStatus === status.value && (
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

          <div className="relative z-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <IonSpinner name="crescent" className="text-black w-8 h-8" />
                <span className="text-gray-500 font-bold text-sm">
                  Завантаження замовлень...
                </span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 px-6 text-center animate-fade-in-up">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm border-[2px] border-gray-300 mb-6">
                  <IonIcon
                    icon={receiptOutline}
                    className="text-6xl text-gray-600"
                  />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">
                  Замовлень не знайдено
                </h2>
                <p className="text-gray-500 max-w-[280px]">
                  Спробуйте змінити параметри пошуку або фільтрації.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    orderNumber={order.orderNumber}
                    date={formatDate(order.createdAt)}
                    amount={Number(order.totalAmount)}
                    status={order.status}
                    onClick={() =>
                      history.push(`${basePath}/order/${order.id}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>

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

export default OrdersScreen;

import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonToast,
} from "@ionic/react";
import {
  chevronBackOutline,
  receiptOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { useCartStore } from "../../cart/cart.store";
import SmallProductCard from "../../shop/components/SmallProductCard";
import api from "../../../config/api";

interface Product {
  id: number;
  isActive: boolean;
}

interface OrderItem {
  id: number;
  productImagePath: string;
  productName: string;
  productCode: string;
  productUnitsOfMeasurments: string;
  priceAtPurchase: number;
  quantity: number;
  product: Product | null;
}

interface Store {
  id: number;
  address: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  store?: Store;
  deliveryAddress?: string;
  streetNumber?: string;
  apartment?: string;
  items: OrderItem[];
}

const PurchaseScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [presentToast] = useIonToast();
  const { addToCart } = useCartStore();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const dateString = date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeString = date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateString}, ${timeString}`;
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case "COMPLETED":
        return "text-green-600 bg-green-50 border-green-100";
      case "READY":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "IN PROCESS":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-100";
      default:
        return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  const translateStatus = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case "COMPLETED":
        return "Виконано";
      case "READY":
        return "Готово до отримання";
      case "IN PROCESS":
        return "У процесі обробки";
      case "CANCELLED":
        return "Скасовано";
      default:
        return currentStatus;
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (error) {
        console.error("Помилка при завантаженні покупки:", error);
        presentToast({
          message: "Не вдалося завантажити деталі покупки",
          duration: 3000,
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, presentToast]);

  const handleAddToCart = async (productId: number | undefined) => {
    if (!productId) return;
    try {
      await addToCart(productId, 1, false);
      presentToast({
        message: "Товар додано до кошика",
        duration: 2000,
        color: "success",
        mode: "ios",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      presentToast({
        message: "Помилка при додаванні товару",
        duration: 2000,
        color: "danger",
        mode: "ios",
      });
    }
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
              {order ? `#${order.orderNumber || order.id}` : "Покупка"}
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 text-gray-900" fullscreen>
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-12 max-w-3xl md:mt-8 pb-32 animate-fade-in">
          <div className="hidden md:flex items-center gap-4 mb-8">
            <button
              onClick={() => history.goBack()}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <IonIcon icon={chevronBackOutline} className="text-3xl" />
            </button>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              {order
                ? `Покупка #${order.orderNumber || order.id}`
                : "Деталі покупки"}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <IonSpinner name="crescent" className="text-black w-8 h-8" />
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <IonIcon
                icon={receiptOutline}
                className="text-6xl text-gray-300 mb-4"
              />
              <h2 className="text-xl font-bold text-gray-800">
                Покупку не знайдено
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Можливо вона була видалена або сталася помилка.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {order.updatedAt && (
                <div className="text-center w-full -mb-3 mt-0 md:-mt-4">
                  <span className="text-[12px] text-gray-400 tracking-widest">
                    Останнє оновлення: {formatDate(order.updatedAt)}
                  </span>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border w-fit leading-none ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {translateStatus(order.status)}
                  </span>

                  <div className="flex flex-col mt-2 gap-1.5">
                    {order.store?.address && (
                      <span className="text-sm font-medium text-gray-500">
                        <span className="font-bold text-gray-700">
                          Магазин:{" "}
                        </span>
                        {order.store.address}
                      </span>
                    )}
                    {order.deliveryAddress && (
                      <span className="text-sm font-medium text-gray-500 leading-snug">
                        <span className="font-bold text-gray-700">
                          Адреса доставки:{" "}
                        </span>
                        {order.deliveryAddress}
                        {order.streetNumber
                          ? `, буд. ${order.streetNumber}`
                          : ""}
                        {order.apartment ? `, кв. ${order.apartment}` : ""}
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-500 mt-0.5">
                      Оформлено: {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Сума покупки
                  </span>
                  <span className="text-3xl font-black text-gray-900 leading-none">
                    {Number(order.totalAmount)}{" "}
                    <span className="text-lg font-normal text-gray-400">₴</span>
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 pl-1">
                  Ваші товари
                </h2>

                <div className="flex flex-col gap-3">
                  {order.items?.map((item) => {
                    const isProductActive = item.product
                      ? item.product.isActive
                      : false;

                    return (
                      <div
                        key={item.id}
                        className="relative cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                          <span className="bg-black/80 backdrop-blur-md text-white text-[11px] font-black px-2 py-1 rounded-lg shadow-sm">
                            x{item.quantity}
                          </span>
                        </div>

                        <SmallProductCard
                          name={item.productName}
                          price={Number(
                            (
                              Math.round(
                                item.priceAtPurchase *
                                  Number(item.quantity) *
                                  100,
                              ) / 100
                            ).toFixed(2),
                          )}
                          unit=""
                          image={item.productImagePath}
                          isActive={isProductActive}
                          isCartItem={false}
                          onAddToCart={() => handleAddToCart(item.product?.id)}
                          onClick={() => {
                            if (item.product?.id) {
                              history.push(
                                `${basePath}/product/${item.product.id}`,
                              );
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-6">
                  <div className="flex items-end justify-between px-1">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider pb-1">
                      Всього до сплати
                    </span>
                    <span className="text-3xl font-black text-gray-900 leading-none">
                      {Number(order.totalAmount)}{" "}
                      <span className="text-xl font-normal text-gray-400">
                        ₴
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={() => history.push(`${basePath}/profile/support`)}
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <IonIcon
                      icon={helpCircleOutline}
                      className="text-xl text-gray-500"
                    />
                    Зв'язатися з підтримкою
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PurchaseScreen;

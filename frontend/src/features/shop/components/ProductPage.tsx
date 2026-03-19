/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  useIonViewWillEnter,
  useIonViewWillLeave,
  IonSpinner,
  IonModal,
  IonToggle,
  IonAlert,
  useIonToast,
  IonBadge,
} from "@ionic/react";
import {
  chevronBackOutline,
  basketOutline,
  chevronForwardOutline,
  addOutline,
  alertCircleOutline,
  createOutline,
  closeOutline,
} from "ionicons/icons";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "../../auth/auth.store";
import api from "../../../config/api";
import ProductCard from "./ProductCard";
import { getDefaultAddQuantity, useCartStore } from "../../cart/cart.store";
import { useIsDesktop } from "../../../hooks/useIsDesktop";

interface Stock {
  id: number;
  productId: number;
  storeId: number;
  available: number;
}

interface Product {
  id: number;
  ukrskladId: number;
  code?: string;
  name: string;
  lastSyncedName?: string;
  description?: string;
  categoryId: number | null;

  category?: {
    id: number;
    name: string;
    isActive: boolean;
  };

  price: number;
  pricePromo: number | null;
  unitsOfMeasurments: string;
  imagePath: string;
  isActive: boolean;
  isPromo: boolean;
  stocks: Stock[];
  [key: string]: unknown;
}

const ProductScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { cartItemsCount, addToCart } = useCartStore();
  const alikeSliderRef = useRef<HTMLDivElement>(null);
  const [presentToast] = useIonToast();

  const isDesktop = useIsDesktop();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";
  const isAdminOnDesktop = (user?.isAdmin || isAdminRoute) && isDesktop;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [alikeProducts, setAlikeProducts] = useState<Product[]>([]);
  const [alikePage, setAlikePage] = useState(1);
  const [hasMoreAlike, setHasMoreAlike] = useState(false);
  const [isLoadingAlike, setIsLoadingAlike] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  const fetchProduct = useCallback(
    async (showSpinner = false) => {
      if (!id) return;
      try {
        if (showSpinner) setIsLoading(true);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchProduct(true);
  }, [fetchProduct]);

  useEffect(() => {
    const fetchAlikeProducts = async () => {
      if (!product || !user?.selectedStoreId) return;
      setIsLoadingAlike(true);
      try {
        const snippet = product.name.split(" ")[0];
        const categoryParam = product.categoryId
          ? `&categoryIds=${product.categoryId}`
          : "";

        const { data } = await api.get(
          `/products?search=${encodeURIComponent(snippet)}${categoryParam}&showAll=0&showDeleted=0&showInactive=0&storeId=${user.selectedStoreId}&limit=12`,
        );

        const items = (data.data || []).filter(
          (p: Product) => p.id !== product.id,
        );

        setAlikeProducts(items);
        setAlikePage(1);
        setHasMoreAlike(
          data.metadata ? 1 < data.metadata.totalPages : items.length >= 11,
        );
      } catch (error) {
        console.error("Failed to fetch alike products:", error);
      } finally {
        setIsLoadingAlike(false);
      }
    };

    if (product) {
      fetchAlikeProducts();
    }
  }, [product, user?.selectedStoreId]);

  const loadMoreAlike = async () => {
    if (!product || !user?.selectedStoreId || isLoadingAlike || !hasMoreAlike)
      return;
    setIsLoadingAlike(true);
    try {
      const nextPage = alikePage + 1;
      const snippet = product.name.split(" ")[0];
      const categoryParam = product.categoryId
        ? `&categoryIds=${product.categoryId}`
        : "";

      const { data } = await api.get(
        `/products?search=${encodeURIComponent(snippet)}${categoryParam}&showAll=0&showDeleted=0&showInactive=0&storeId=${user.selectedStoreId}&limit=12&page=${nextPage}`,
      );

      const items = (data.data || []).filter(
        (p: Product) => p.id !== product.id,
      );

      setAlikeProducts((prev) => [...prev, ...items]);
      setAlikePage(nextPage);
      setHasMoreAlike(
        data.metadata
          ? nextPage < data.metadata.totalPages
          : items.length >= 11,
      );
    } catch (error) {
      console.error("Failed to load more alike products:", error);
    } finally {
      setIsLoadingAlike(false);
    }
  };

  const handleAlikeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 150) {
      loadMoreAlike();
    }
  };

  useIonViewWillEnter(() => {
    fetchProduct(false);
    if (!isDesktop) {
      const tabBar = document.querySelector("ion-tab-bar");
      if (tabBar) tabBar.style.display = "none";
    }
  });

  useIonViewWillLeave(() => {
    if (!isDesktop) {
      const tabBar = document.querySelector("ion-tab-bar");
      if (tabBar) tabBar.style.display = "";
    }
  });

  const scrollAlike = (direction: "left" | "right") => {
    if (alikeSliderRef.current) {
      const scrollAmount = 300;
      alikeSliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleOpenEditModal = () => {
    if (product) {
      setEditName(product.name);
      setEditDesc(product.description || "");
      setEditIsActive(product.isActive);
      setEditImageFile(null);
      setEditImagePreview(null);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProduct = async () => {
    if (!product) return;
    if (!editName.trim()) {
      presentToast({
        message: "Назва не може бути порожньою",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("description", editDesc);
      formData.append("isActive", String(editIsActive));

      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const { data } = await api.patch(`/products/${product.id}`, formData);

      (window as any).psaForceUpdateId = product.id;
      (window as any).psaForceUpdateData = {
        isActive: editIsActive,
        name: editName,
        imagePath: data?.imagePath || product.imagePath,
      };

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              name: editName,
              description: editDesc,
              isActive: editIsActive,
              imagePath: data?.imagePath || prev.imagePath,
            }
          : null,
      );

      presentToast({
        message: "Товар успішно оновлено!",
        duration: 2000,
        color: "success",
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update product:", error);
      presentToast({
        message: "Не вдалося оновити товар",
        duration: 2000,
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmAlert(false);
    }
  };

  const handleAddToCart = async (productId: number, quantity: number) => {
    try {
      await addToCart(productId, quantity);
      presentToast({
        message: "Товар додано до кошика",
        duration: 1500,
        color: "success",
        position: "bottom",
        mode: "ios",
      });
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Не вдалося додати товар до кошика";

      presentToast({
        message: errorMessage,
        duration: 2000,
        color: "danger",
        position: "bottom",
        mode: "ios",
      });
    }
  };

  const onAddToCartClick = (targetProduct: Product) => {
    if (!targetProduct || !user?.selectedStoreId) return;

    const amount = getDefaultAddQuantity(
      targetProduct as any,
      user.selectedStoreId,
    );

    if (amount > 0) {
      handleAddToCart(targetProduct.id, amount);
    } else {
      presentToast({
        message: "Ви вже додали весь доступний залишок",
        duration: 2000,
        color: "warning",
        position: "bottom",
        mode: "ios",
      });
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="bg-gray-50">
          <div className="flex h-full items-center justify-center">
            <IonSpinner color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!product) {
    return (
      <IonPage>
        <IonContent className="bg-gray-50">
          <div className="flex flex-col h-full items-center justify-center gap-4 text-gray-400">
            <IonIcon icon={alertCircleOutline} className="text-6xl" />
            <h2 className="text-xl font-bold text-gray-700">
              Товар не знайдено
            </h2>
            <button
              onClick={() => history.goBack()}
              className="text-gray-500 font-bold"
            >
              Повернутися назад
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const displayPrice = product.isPromo ? product.pricePromo! : product.price;
  const oldPrice = product.isPromo ? product.price : undefined;

  const currentStock = user?.selectedStoreId
    ? product.stocks?.find((s) => s.storeId === user.selectedStoreId)
        ?.available || 0
    : 0;

  const isCategoryActive = product.category ? product.category.isActive : true;

  const isUnavailable =
    !product.isActive || currentStock <= 0 || !isCategoryActive;

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white md:hidden">
        <IonToolbar style={{ "--background": "white" }}>
          <div className="flex items-center justify-between px-2">
            <IonButton
              color="medium"
              fill="clear"
              onClick={() => history.goBack()}
              className="text-gray-800"
            >
              <IonIcon icon={chevronBackOutline} className="text-2xl" /> Назад
            </IonButton>
            <div className="w-12"></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-white md:bg-gray-50 text-gray-900" fullscreen>
        <div className="hidden md:block container mx-auto px-8 py-12 max-w-6xl mt-16">
          <button
            onClick={() => history.goBack()}
            className="mb-8 text-gray-500 hover:text-black flex items-center gap-1 font-bold transition-colors"
          >
            <IonIcon icon={chevronBackOutline} className="text-xl" />
            Назад
          </button>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex gap-12">
            <div className="w-1/2 bg-gray-50 rounded-[24px] flex items-center justify-center p-8 min-h-[500px] relative overflow-hidden">
              {product.imagePath ? (
                <img
                  src={product.imagePath}
                  alt={product.name}
                  loading="lazy"
                  className={`max-w-full max-h-[400px] object-contain mix-blend-multiply ${isUnavailable ? "opacity-50 grayscale" : ""}`}
                />
              ) : (
                <span className="text-6xl opacity-10">📷</span>
              )}
            </div>

            <div className="w-1/2 flex flex-col pt-4">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-3xl font-black text-gray-800 leading-tight">
                  {product.name}
                </h1>

                {isAdminOnDesktop && (
                  <button
                    onClick={handleOpenEditModal}
                    className="flex-shrink-0 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-200 transition-colors z-10"
                  >
                    <IonIcon icon={createOutline} className="text-xl" />
                  </button>
                )}
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isUnavailable ? "bg-red-500" : "bg-green-500"}`}
                ></div>
                <span
                  className={`text-sm font-bold ${isUnavailable ? "text-red-500" : "text-green-600"}`}
                >
                  {currentStock <= 0
                    ? "Немає в наявності"
                    : `В наявності: ${currentStock} ${product.unitsOfMeasurments}`}
                </span>

                {product.category?.name && (
                  <>
                    <span className="text-gray-300 mx-1 font-bold">•</span>
                    <span className="text-sm font-bold text-gray-400">
                      {product.category.name}
                    </span>
                  </>
                )}

                {!product.isActive && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">
                    Неактивний
                  </span>
                )}
                {!isCategoryActive && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">
                    Категорія неактивна
                  </span>
                )}

                {user?.isAdmin && isDesktop && product.code && (
                  <span className="ml-1 text-xs bg-gray-800 text-white px-2.5 py-1 rounded-lg font-mono font-bold shadow-sm">
                    {`Код: ${product.code}`}
                  </span>
                )}
              </div>

              <div className="prose prose-sm text-gray-500 mb-8 leading-relaxed">
                <p>{product.description || "Опис відсутній."}</p>
              </div>

              <div className="mt-auto border-t border-gray-100 pt-8 flex items-center justify-between">
                <div className="flex flex-col">
                  {oldPrice && (
                    <span className="text-sm text-gray-400 line-through decoration-red-400/50 mb-1">
                      {oldPrice} ₴
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-400 mb-1">
                    Ціна за {product.unitsOfMeasurments}
                  </span>
                  <span
                    className={`text-4xl font-black ${oldPrice ? "text-red-500" : "text-gray-900"} ${isUnavailable ? "text-gray-400" : ""}`}
                  >
                    {displayPrice}{" "}
                    <span className="text-xl font-medium text-gray-400">₴</span>
                  </span>
                </div>

                <button
                  onClick={() => onAddToCartClick(product)}
                  disabled={isUnavailable}
                  className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-md flex items-center gap-2 transition-all
                    ${
                      isUnavailable
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-black active:scale-95 text-white shadow-gray-200"
                    }`}
                >
                  <IonIcon icon={addOutline} className="text-2xl" />
                  Додати у кошик
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden flex flex-col">
          <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-8 relative">
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                loading="lazy"
                className={`w-full h-full object-contain mix-blend-multiply ${isUnavailable ? "opacity-50 grayscale" : ""}`}
              />
            ) : (
              <span className="text-5xl opacity-20">📷</span>
            )}
          </div>

          <div className="px-5 pt-6 bg-white rounded-t-3xl -mt-6 relative z-10">
            <h1 className="text-2xl font-black text-gray-800 leading-tight mb-3">
              {product.name}
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isUnavailable ? "bg-red-500" : "bg-green-500"}`}
              ></div>
              <span
                className={`text-xs font-bold ${isUnavailable ? "text-red-500" : "text-green-600"}`}
              >
                {isUnavailable
                  ? "Немає в наявності"
                  : `В наявності: ${currentStock} ${product.unitsOfMeasurments}`}
              </span>

              {product.category?.name && (
                <>
                  <span className="text-gray-300 mx-1 font-bold">•</span>
                  <span className="text-xs font-bold text-gray-400">
                    {product.category.name}
                  </span>
                </>
              )}

              {user?.isAdmin && isDesktop && product.code && (
                <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-md font-mono font-bold shadow-sm">
                  {product.code ? `Код: ${product.code}` : ""}
                </span>
              )}
            </div>

            <h3 className="font-bold text-lg text-gray-800 mb-2 mt-4">
              Опис товару
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {product.description || "Опис відсутній."}
            </p>
          </div>
        </div>

        <div className="px-5 md:px-0 md:container md:mx-auto md:max-w-6xl mt-2 pb-32 md:pb-12">
          {alikeProducts.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 pl-1 md:pl-0">
                  Схожі товари
                </h2>

                <div className="hidden md:flex gap-2">
                  <button
                    onClick={() => scrollAlike("left")}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-black active:scale-95 transition-all"
                  >
                    <IonIcon icon={chevronBackOutline} />
                  </button>
                  <button
                    onClick={() => scrollAlike("right")}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-black active:scale-95 transition-all"
                  >
                    <IonIcon icon={chevronForwardOutline} />
                  </button>
                </div>
              </div>

              <div
                ref={alikeSliderRef}
                onScroll={handleAlikeScroll}
                className="flex overflow-x-auto pb-6 hide-scrollbar gap-4 snap-x md:snap-none"
              >
                {alikeProducts.map((alikeProduct) => {
                  const currentStockAlike = user?.selectedStoreId
                    ? alikeProduct.stocks?.find(
                        (s) => s.storeId === user.selectedStoreId,
                      )?.available || 0
                    : 0;
                  const isCatActiveAlike = alikeProduct.category
                    ? alikeProduct.category.isActive
                    : true;

                  return (
                    <div
                      key={alikeProduct.id}
                      className="w-[160px] min-w-[160px] md:w-[220px] md:min-w-[220px] flex-none snap-start"
                    >
                      <ProductCard
                        name={alikeProduct.name}
                        price={
                          alikeProduct.isPromo
                            ? alikeProduct.pricePromo!
                            : alikeProduct.price
                        }
                        oldPrice={
                          alikeProduct.isPromo ? alikeProduct.price : undefined
                        }
                        unit={alikeProduct.unitsOfMeasurments}
                        image={alikeProduct.imagePath}
                        isActive={alikeProduct.isActive}
                        isOutOfStock={currentStockAlike <= 0}
                        isCategoryActive={isCatActiveAlike}
                        code={alikeProduct.code || ""}
                        isAdmin={user?.isAdmin}
                        onClick={() =>
                          history.push(`${basePath}/product/${alikeProduct.id}`)
                        }
                        onAddToCart={() => onAddToCartClick(alikeProduct)}
                      />
                    </div>
                  );
                })}
                {isLoadingAlike && (
                  <div className="w-[160px] min-w-[160px] md:w-[220px] md:min-w-[220px] flex-none flex items-center justify-center">
                    <IonSpinner color="primary" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!isDesktop && (
          <>
            <div className="fixed bottom-32 right-5 z-50 animate-fade-in-up">
              <button
                onClick={() => history.push(`${basePath}/cart`)}
                className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl border border-gray-100 active:scale-95 transition-all relative"
              >
                <IonIcon icon={basketOutline} className="text-2xl" />

                {cartItemsCount > 0 && (
                  <IonBadge
                    color="light"
                    className="absolute -top-1 -right-1 text-[11px] px-1.5 py-1 border-[1.5px] border-white rounded-full leading-none"
                  >
                    {cartItemsCount > 99 ? "99+" : cartItemsCount}
                  </IonBadge>
                )}
              </button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex items-center justify-between z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col pl-2">
                {oldPrice && (
                  <span className="text-[10px] text-gray-400 line-through decoration-red-400/50 mb-0.5">
                    {oldPrice} ₴
                  </span>
                )}
                <span
                  className={`text-2xl font-black leading-none mb-1 ${oldPrice ? "text-red-500" : "text-gray-900"} ${isUnavailable ? "text-gray-400" : ""}`}
                >
                  {displayPrice}{" "}
                  <span className="text-sm font-normal text-gray-400">₴</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Ціна за {product.unitsOfMeasurments}
                </span>
              </div>

              <button
                onClick={() => onAddToCartClick(product)}
                disabled={isUnavailable}
                className={`px-8 py-3.5 rounded-2xl font-bold shadow-md flex items-center gap-2 transition-all
                  ${
                    isUnavailable
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                      : "bg-black active:scale-95 text-white shadow-gray-200"
                  }`}
              >
                <IonIcon icon={addOutline} className="text-xl" />
                Додати у кошик
              </button>
            </div>
          </>
        )}

        <IonModal
          isOpen={isEditModalOpen}
          onDidDismiss={() => setIsEditModalOpen(false)}
          style={{
            "--width": "450px",
            "--height": "auto",
            "--border-radius": "24px",
          }}
        >
          <div className="bg-white flex flex-col w-full h-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-black text-lg text-gray-800">
                Редагувати товар
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-black transition-colors p-1"
              >
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Назва товару
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-black focus:bg-white transition-all"
                  placeholder="Введіть назву"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Опис
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-black focus:bg-white transition-all resize-none"
                  placeholder="Додайте опис товару"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Фото товару
                </label>
                <div className="flex gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-20 h-20 shrink-0 rounded-xl border-2 flex items-center justify-center p-2 transition-all ${
                      editImageFile
                        ? "border-black bg-gray-100 shadow-sm"
                        : "border-gray-200 border-dashed bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {editImagePreview ? (
                      <img
                        src={editImagePreview}
                        alt="preview"
                        className="w-full h-full object-contain"
                      />
                    ) : product?.imagePath ? (
                      <img
                        src={product.imagePath}
                        alt="current"
                        className="w-full h-full object-contain opacity-50"
                      />
                    ) : (
                      <IonIcon
                        icon={addOutline}
                        className="text-2xl text-gray-400"
                      />
                    )}
                  </button>
                  <div className="flex flex-col justify-center text-xs text-gray-500">
                    <span>Натисніть, щоб</span>
                    <span>завантажити нове фото</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">
                    Статус товару
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {editIsActive ? "Активний" : "Неактивний"}
                  </span>
                </div>
                <IonToggle
                  color="dark"
                  checked={editIsActive}
                  onIonChange={(e) => setEditIsActive(e.detail.checked)}
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={() => setShowConfirmAlert(true)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-md shadow-gray-200 disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </IonModal>

        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Підтвердження"
          message="Зберегти зміни для цього товару?"
          buttons={[
            { text: "Скасувати", role: "cancel" },
            {
              text: "Так, зберегти",
              role: "confirm",
              handler: handleSaveProduct,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductScreen;

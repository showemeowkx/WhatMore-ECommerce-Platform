/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter,
  useIonViewWillLeave,
  IonModal,
  IonAlert,
  IonToggle,
  useIonToast,
  IonBadge,
  useIonViewDidEnter,
} from "@ionic/react";
import {
  searchOutline,
  personCircleOutline,
  filterOutline,
  chevronBackOutline,
  chevronForwardOutline,
  storefrontOutline,
  chevronDownOutline,
  closeCircleOutline,
  basketOutline,
  closeOutline,
  addOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import CategoryCard from "./components/CategoryCard";
import ProductCard from "./components/ProductCard";
import { useAuthStore } from "../auth/auth.store";
import StoreSelectorModal, {
  type Store,
} from "./components/StoreSelectorModal";
import api from "../../config/api";
import SmallProductCard from "./components/SmallProductCard";
import type { FilterState } from "./components/FilterMenu";
import FilterMenu from "./components/FilterMenu";
import { getDefaultAddQuantity, useCartStore } from "../cart/cart.store";
import { useIsDesktop } from "../../hooks/useIsDesktop";

const MAX_PRICE_LIMIT = Number(import.meta.env.VITE_MAX_PRICE_LIMIT) || 2500;

interface Product {
  id: number;
  ukrskladId: number;
  code?: string;
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  pricePromo: number | null;
  unitsOfMeasurments: string;
  imagePath: string;
  isActive: boolean;
  isPromo: boolean;
  stocks: Stock[];
  [key: string]: unknown;
}

interface Stock {
  id: number;
  productId: number;
  storeId: number;
  available: number;
}

interface Category {
  id: number;
  name: string;
  iconPath: string;
  isActive: boolean;
}

const ShopScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, token } = useAuthStore();
  const { cartItemsCount, addToCart } = useCartStore();
  const [presentToast] = useIonToast();
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIsActive, setEditCatIsActive] = useState(true);
  const [editCatIcon, setEditCatIcon] = useState("");

  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [customIconPreview, setCustomIconPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [showCatConfirmAlert, setShowCatConfirmAlert] = useState(false);

  const AVAILABLE_ICONS = (
    (import.meta.env.VITE_CATEGORY_ICON_PATHS as string) || ""
  )
    .split(",")
    .filter(Boolean);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    categories: [],
    sort: "PROMO",
    priceMin: 0,
    priceMax: MAX_PRICE_LIMIT,
    showAll: false,
    showInactive: false,
    code: "",
  });

  const hasActiveFilters =
    activeFilters.sort !== "PROMO" ||
    activeFilters.categories.length > 0 ||
    activeFilters.priceMin > 0 ||
    activeFilters.priceMax < MAX_PRICE_LIMIT ||
    activeFilters.showAll ||
    activeFilters.showInactive ||
    activeFilters.code !== "";

  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/app";

  const categoriesRef = useRef<HTMLDivElement>(null);

  const isDesktop = useIsDesktop();

  const fetchStores = useCallback(async () => {
    try {
      const isAdminOnDesktop = (user?.isAdmin || isAdminRoute) && isDesktop;
      const showInactive = isAdminOnDesktop ? 1 : 0;

      const { data } = await api.get(
        `/store?limit=0&showInactive=${showInactive}&showDeleted=0`,
      );
      setStores(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error("Failed to fetch stores", e);
    }
  }, [user, isAdminRoute, isDesktop]);

  const fetchCategories = useCallback(async () => {
    try {
      const isAdminOnDesktop = (user?.isAdmin || isAdminRoute) && isDesktop;
      const showInactive = isAdminOnDesktop ? 1 : 0;
      const { data } = await api.get(
        `/categories?limit=0&showInactive=${showInactive}&showDeleted=0`,
      );
      setCategories(data.data || []);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  }, [user?.isAdmin, isAdminRoute, isDesktop]);

  const fetchProducts = useCallback(
    async (storeId: number, pageNum: number, isLoadMore: boolean = false) => {
      try {
        const { data } = await api.get(
          `/products?limit=24&page=${pageNum}&showAll=0&showDeleted=0&showInactive=0&storeId=${storeId}`,
        );

        const newProducts = data.data || [];

        if (isLoadMore) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueNewProducts = newProducts.filter(
              (p: Product) => !existingIds.has(p.id),
            );
            return [...prev, ...uniqueNewProducts];
          });
        } else {
          setProducts(newProducts);
        }

        setHasMore(newProducts.length >= 24);
      } catch (e) {
        console.error("Failed to fetch products", e);
        setHasMore(false);
      }
    },
    [],
  );

  const fetchSearchResults = useCallback(
    async (query: string, pageNum: number, isLoadMore: boolean = false) => {
      if (!user?.selectedStoreId) return;

      try {
        const filterParams = new URLSearchParams();

        if (activeFilters.sort !== null) {
          filterParams.append("sortMethod", activeFilters.sort);
        }

        if (activeFilters.priceMin > 0) {
          filterParams.append("minPrice", activeFilters.priceMin.toString());
        }
        if (activeFilters.priceMax < MAX_PRICE_LIMIT) {
          filterParams.append("maxPrice", activeFilters.priceMax.toString());
        }

        if (activeFilters.categories.length > 0) {
          filterParams.append(
            "categoryIds",
            activeFilters.categories.join(","),
          );
        }

        if (activeFilters.code) {
          filterParams.append("code", activeFilters.code);
        }

        const showAllParam = user?.isAdmin && activeFilters.showAll ? "1" : "0";
        const showInactiveParam =
          user?.isAdmin && activeFilters.showInactive ? "1" : "0";

        const { data } = await api.get(
          `/products?limit=24&page=${pageNum}&search=${encodeURIComponent(
            query,
          )}&showAll=${showAllParam}&showInactive=${showInactiveParam}&showDeleted=0&storeId=${
            user.selectedStoreId
          }&${filterParams.toString()}`,
        );

        const newProducts = data.data || [];
        const meta = data.metadata;

        if (isLoadMore) {
          setSearchProducts((prev) => [...prev, ...newProducts]);
        } else {
          setSearchProducts(newProducts);
        }

        setSearchTotal(meta?.total || 0);
        setSearchHasMore(
          meta ? pageNum < meta.totalPages : newProducts.length >= 24,
        );
      } catch (e) {
        console.error("Failed to fetch search results", e);
        setSearchHasMore(false);
      } finally {
        setIsSearching(false);
      }
    },
    [user?.selectedStoreId, user?.isAdmin, activeFilters],
  );

  useEffect(() => {
    if (token) {
      fetchStores();
      fetchCategories();
    }
  }, [token, fetchStores, fetchCategories]);

  useEffect(() => {
    if (user?.selectedStoreId && token) {
      fetchProducts(user.selectedStoreId, 1, false);
    }
  }, [user?.selectedStoreId, token, fetchProducts]);

  useEffect(() => {
    if (isDesktop) return;

    const tabBar = document.querySelector("ion-tab-bar");
    if (tabBar) {
      tabBar.style.display = isSearchActive ? "none" : "";
    }

    return () => {
      if (tabBar && !isDesktop) {
        tabBar.style.display = "";
      }
    };
  }, [isSearchActive, isDesktop]);

  useEffect(() => {
    if (
      !isSearchActive ||
      (searchQuery.trim().length === 0 && !hasActiveFilters)
    ) {
      setSearchProducts([]);
      setSearchPage(1);
      setSearchHasMore(false);
      setSearchTotal(0);
      return;
    }

    setIsSearching(true);

    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults(searchQuery, 1, false);
      setSearchPage(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchActive, fetchSearchResults, hasActiveFilters]);

  useIonViewWillLeave(() => {
    if (!isDesktop) {
      const tabBar = document.querySelector("ion-tab-bar");
      if (tabBar) tabBar.style.display = "";
    }
  });

  useIonViewWillEnter(() => {
    if (!isDesktop && isSearchActive) {
      const tabBar = document.querySelector("ion-tab-bar");
      if (tabBar) tabBar.style.display = "none";
    }
  });

  useIonViewDidEnter(() => {
    const updateId = (window as any).psaForceUpdateId;
    const updateData = (window as any).psaForceUpdateData;

    if (updateId && updateData) {
      const updateFn = (p: Product) =>
        Number(p.id) === Number(updateId) ? { ...p, ...updateData } : p;

      setProducts((prev) => [...prev.map(updateFn)]);
      setSearchProducts((prev) => [...prev.map(updateFn)]);

      (window as any).psaForceUpdateId = null;
      (window as any).psaForceUpdateData = null;
    }
  });

  const handleRefresh = async (e: CustomEvent) => {
    setPage(1);
    setHasMore(true);

    const promises = [fetchStores(), fetchCategories()];

    if (user?.selectedStoreId) {
      promises.push(fetchProducts(user.selectedStoreId, 1, false));
    }

    await Promise.all(promises);
    e.detail.complete();
  };

  const handleInfinite = async (ev: CustomEvent<void>) => {
    if (!user?.selectedStoreId) {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    if (isSearchActive && (searchQuery.trim().length > 0 || hasActiveFilters)) {
      const nextPage = searchPage + 1;
      setSearchPage(nextPage);
      await fetchSearchResults(searchQuery, nextPage, true);
    } else if (!isSearchActive) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchProducts(user.selectedStoreId, nextPage, true);
    }

    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const currentStore = stores.find((s) => s.id === user?.selectedStoreId) || {
    address: "Неактивний магазин",
  };

  const handleCategoryClick = (categoryId: number) => {
    setSearchQuery("");

    setActiveFilters((prev) => ({
      ...prev,
      categories: [categoryId],
    }));

    setIsSearchActive(true);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 300;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleExitSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");

    setActiveFilters({
      categories: [],
      sort: "PROMO",
      priceMin: 0,
      priceMax: MAX_PRICE_LIMIT,
      showAll: false,
      showInactive: false,
      code: "",
    });
  };

  const checkIsOutOfStock = (product: Product) => {
    if (!product.stocks || !user?.selectedStoreId) return true;
    const storeStock = product.stocks.find(
      (s) => s.storeId === user?.selectedStoreId,
    );
    return !storeStock || storeStock.available <= 0;
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      presentToast({
        message: "Назва не може бути порожньою",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    setIsSubmittingCat(true);
    try {
      const formData = new FormData();
      formData.append("name", editCatName);
      formData.append("isActive", String(editCatIsActive));

      if (customIconFile) {
        formData.append("icon", customIconFile);
      } else if (editCatIcon !== editingCategory.iconPath) {
        formData.append("iconPath", editCatIcon);
      }

      const { data } = await api.patch(
        `/categories/${editingCategory.id}`,
        formData,
      );

      const updatedIcon = data?.iconPath || customIconPreview || editCatIcon;

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: editCatName,
                iconPath: updatedIcon,
                isActive: editCatIsActive,
              }
            : c,
        ),
      );

      presentToast({
        message: "Категорію успішно оновлено!",
        duration: 2000,
        color: "success",
      });
      handleCloseCategoryModal();
    } catch (error) {
      console.error("Failed to update category:", error);
      presentToast({
        message: "Не вдалося оновити категорію",
        duration: 2000,
        color: "danger",
      });
    } finally {
      setIsSubmittingCat(false);
      setShowCatConfirmAlert(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setEditingCategory(null);
    setCustomIconFile(null);
    setCustomIconPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <IonPage>
      <StoreSelectorModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        stores={stores}
      />

      {!isDesktop && (
        <FilterMenu
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          categories={categories}
          currentFilters={activeFilters}
          isAdmin={user?.isAdmin}
          onApply={setActiveFilters}
        />
      )}

      <IonHeader className="ion-no-border shadow-sm z-40 bg-white md:hidden transition-all duration-300">
        <IonToolbar
          className="bg-white"
          style={{ "--background": "white", "--min-height": "auto" }}
        >
          <div className="flex flex-col pb-3 pt-2 px-4 gap-3">
            {!isSearchActive && (
              <div className="flex items-center justify-between animate-fade-in-down">
                <button
                  onClick={() => setIsStoreModalOpen(true)}
                  className="flex items-center gap-2 active:opacity-70 group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-black group-active:scale-90 transition-transform">
                    <IonIcon icon={storefrontOutline} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                      Магазин
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-gray-800 leading-none truncate max-w-[180px]">
                        {currentStore.address.split(",")[0]}
                      </span>
                      <IonIcon
                        icon={chevronDownOutline}
                        className="text-black text-[10px]"
                      />
                    </div>
                  </div>
                </button>

                <IonButton
                  fill="clear"
                  onClick={() => history.push(`${basePath}/profile`)}
                  className="m-0 h-8"
                  color="dark"
                >
                  <IonIcon
                    icon={personCircleOutline}
                    className="text-3xl text-gray-600"
                  />
                </IonButton>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isSearchActive && (
                <button
                  onClick={handleExitSearch}
                  className="text-gray-600 p-1 -ml-2 animate-fade-in"
                >
                  <IonIcon icon={chevronBackOutline} className="text-3xl" />
                </button>
              )}
              <div className="bg-gray-100/80 rounded-xl p-2.5 flex items-center h-10 w-full transition-all duration-300">
                <IonIcon
                  icon={searchOutline}
                  className="text-lg text-gray-400 mr-2 ml-1"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchActive(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пошук товарів..."
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 active:text-black p-1"
                    >
                      <IonIcon icon={closeCircleOutline} className="text-xl" />
                    </button>
                  )}
                  {isSearchActive && (
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className={`relative p-1 transition-colors ${hasActiveFilters ? "text-black" : "text-gray-400 active:text-black"}`}
                    >
                      <IonIcon icon={filterOutline} className="text-xl" />
                      {hasActiveFilters && (
                        <span className="absolute top-0 right-0.5 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50" fullscreen>
        {!isSearchActive && (
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>
        )}

        <div className="pb-24 pt-4 md:pt-28 container mx-auto md:px-8">
          <div className="hidden md:flex mb-8 items-center justify-center">
            <div
              className={`transition-all duration-300 flex items-center gap-4 ${isSearchActive ? "w-full max-w-4xl" : "w-full max-w-xl"}`}
            >
              {isSearchActive && (
                <button
                  onClick={handleExitSearch}
                  className="text-gray-500 hover:text-black flex items-center gap-1 font-bold animate-fade-in-left"
                >
                  <IonIcon icon={chevronBackOutline} className="text-xl" />
                  Назад
                </button>
              )}

              <div className="bg-gray-100/80 rounded-xl px-4 py-2.5 w-full flex items-center h-12 relative">
                <IonIcon
                  icon={searchOutline}
                  className="text-xl text-gray-400 mr-3"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchActive(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пошук товарів..."
                  className="w-full bg-transparent outline-none text-gray-700 text-base placeholder:text-gray-400"
                />

                <div className="flex items-center gap-2 shrink-0">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-black transition-colors p-1"
                    >
                      <IonIcon icon={closeCircleOutline} className="text-xl" />
                    </button>
                  )}
                  {isSearchActive && (
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className={`relative p-1 transition-colors ${hasActiveFilters ? "text-black" : "text-gray-400 hover:text-black"}`}
                    >
                      <IonIcon icon={filterOutline} className="text-xl" />
                      {hasActiveFilters && (
                        <span className="absolute top-0 right-0.5 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  )}
                </div>

                {isDesktop && (
                  <FilterMenu
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    categories={categories}
                    currentFilters={activeFilters}
                    isAdmin={user?.isAdmin}
                    onApply={setActiveFilters}
                  />
                )}
              </div>
            </div>
          </div>

          {!isSearchActive ? (
            <div className="animate-fade-in">
              <div className="pl-4 md:pl-0 mb-8 relative group">
                <div className="flex items-center justify-between pr-4 mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">
                    Категорії
                  </h2>

                  <div className="hidden md:flex gap-2">
                    <button
                      onClick={() => scrollCategories("left")}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-black active:scale-95 transition-all"
                    >
                      <IonIcon icon={chevronBackOutline} />
                    </button>
                    <button
                      onClick={() => scrollCategories("right")}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-black active:scale-95 transition-all"
                    >
                      <IonIcon icon={chevronForwardOutline} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-4 z-10 w-8 bg-gradient-to-r from-gray-50 to-transparent md:hidden flex items-center justify-start pointer-events-none opacity-50">
                    <IonIcon
                      icon={chevronBackOutline}
                      className="text-gray-400 text-lg"
                    />
                  </div>

                  <div
                    ref={categoriesRef}
                    className="flex overflow-x-auto pb-4 hide-scrollbar pr-4 gap-3 md:gap-5 scroll-smooth py-2 relative z-0"
                  >
                    {categories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        name={cat.name}
                        image={cat.iconPath}
                        isAdminOnDesktop={isAdminRoute && isDesktop}
                        isActive={cat.isActive}
                        onClick={() => handleCategoryClick(cat.id)}
                        onEdit={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setEditCatName(cat.name);
                          setEditCatIsActive(cat.isActive);
                          setEditCatIcon(cat.iconPath);
                          setCustomIconFile(null);
                          setCustomIconPreview(null);
                        }}
                      />
                    ))}
                  </div>

                  <div className="absolute right-0 top-0 bottom-4 z-10 w-12 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent md:hidden flex items-center justify-end pr-1 pointer-events-none">
                    <IonIcon
                      icon={chevronForwardOutline}
                      className="text-gray-800 text-2xl animate-pulse drop-shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="px-3 md:px-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pl-1">
                  Товари
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      price={
                        product.isPromo ? product.pricePromo! : product.price
                      }
                      oldPrice={product.isPromo ? product.price : undefined}
                      unit={product.unitsOfMeasurments}
                      image={product.imagePath}
                      isActive={product.isActive}
                      isOutOfStock={checkIsOutOfStock(product)}
                      isCategoryActive={
                        product.categoryId
                          ? categories.find((c) => c.id === product.categoryId)
                              ?.isActive
                          : true
                      }
                      code={product.code}
                      isAdmin={user?.isAdmin}
                      onClick={() =>
                        history.push(`${basePath}/product/${product.id}`)
                      }
                      onAddToCart={() =>
                        handleAddToCart(
                          product.id,
                          getDefaultAddQuantity(product, user?.selectedStoreId),
                        )
                      }
                    />
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
                      Товарів не знайдено
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 md:px-0 animate-fade-in-up">
              {searchQuery.length === 0 && !hasActiveFilters ? (
                <div className="flex flex-col items-center justify-center text-center py-24 md:py-32">
                  <IonIcon
                    icon={searchOutline}
                    className="text-6xl text-gray-200 mb-4"
                  />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    Що будемо шукати?
                  </h3>
                  <p className="text-sm text-gray-400">
                    Почніть вводити назву товару
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6 pl-1 border-b border-gray-200 pb-3">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                      {searchQuery ? (
                        <>
                          Результати:{" "}
                          <span className="text-black font-medium ml-1">
                            "{searchQuery}"
                          </span>
                        </>
                      ) : (
                        "Результати:"
                      )}
                    </h2>
                    <span className="text-xs font-bold text-gray-400 bg-gray-200/50 px-2 py-1 rounded-md">
                      {isSearching ? "Шукаємо..." : `${searchTotal} знайдено`}
                    </span>
                  </div>

                  {isSearching && searchProducts.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <span className="text-gray-400 font-medium animate-pulse">
                        Завантаження...
                      </span>
                    </div>
                  ) : searchProducts.length === 0 ? (
                    <div className="flex justify-center py-10 text-gray-400">
                      Нічого не знайдено
                    </div>
                  ) : (
                    <div className="md:grid md:grid-cols-4 md:gap-6 flex flex-col">
                      {searchProducts.map((product) =>
                        isDesktop ? (
                          <ProductCard
                            key={product.id}
                            name={product.name}
                            price={
                              product.isPromo
                                ? product.pricePromo!
                                : product.price
                            }
                            oldPrice={
                              product.isPromo ? product.price : undefined
                            }
                            unit={product.unitsOfMeasurments}
                            image={product.imagePath}
                            isActive={product.isActive}
                            isOutOfStock={checkIsOutOfStock(product)}
                            isCategoryActive={
                              product.categoryId
                                ? categories.find(
                                    (c) => c.id === product.categoryId,
                                  )?.isActive
                                : true
                            }
                            code={product.code}
                            isAdmin={user?.isAdmin}
                            onClick={() =>
                              history.push(`${basePath}/product/${product.id}`)
                            }
                            onAddToCart={() =>
                              handleAddToCart(
                                product.id,
                                getDefaultAddQuantity(
                                  product,
                                  user?.selectedStoreId,
                                ),
                              )
                            }
                          />
                        ) : (
                          <SmallProductCard
                            key={product.id}
                            name={product.name}
                            price={
                              product.isPromo
                                ? product.pricePromo!
                                : product.price
                            }
                            oldPrice={
                              product.isPromo ? product.price : undefined
                            }
                            unit={product.unitsOfMeasurments}
                            image={product.imagePath}
                            isActive={product.isActive}
                            isOutOfStock={checkIsOutOfStock(product)}
                            onClick={() =>
                              history.push(`${basePath}/product/${product.id}`)
                            }
                            onAddToCart={() =>
                              handleAddToCart(
                                product.id,
                                getDefaultAddQuantity(
                                  product,
                                  user?.selectedStoreId,
                                ),
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <IonInfiniteScroll
          onIonInfinite={handleInfinite}
          threshold="100px"
          disabled={isSearchActive ? !searchHasMore : !hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Завантаження товарів..."
          />
        </IonInfiniteScroll>

        {isSearchActive && !isDesktop && (
          <div
            slot="fixed"
            className="bottom-6 right-6 z-50 animate-fade-in-up"
          >
            <button
              onClick={() => {
                history.push(`${basePath}/cart`);
                setTimeout(() => {
                  setIsSearchActive(false);
                  setSearchQuery("");
                  setActiveFilters({
                    categories: [],
                    sort: "PROMO",
                    priceMin: 0,
                    priceMax: MAX_PRICE_LIMIT,
                    showAll: false,
                    showInactive: false,
                    code: "",
                  });
                }, 400);
              }}
              className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-4 border-gray-50 active:bg-gray-800 active:scale-95 transition-all relative"
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
        )}
      </IonContent>

      <IonModal
        isOpen={!!editingCategory}
        onDidDismiss={() => setEditingCategory(null)}
        style={{
          "--width": "450px",
          "--height": "auto",
          "--border-radius": "24px",
        }}
      >
        <div className="bg-white flex flex-col w-full h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-black text-lg text-gray-800">
              Редагувати категорію
            </h3>
            <button
              onClick={() => setEditingCategory(null)}
              className="text-gray-400 hover:text-black transition-colors p-1"
            >
              <IonIcon icon={closeOutline} className="text-2xl" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Назва категорії
              </label>
              <input
                type="text"
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-black focus:bg-white transition-all"
                placeholder="Введіть назву"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Іконка
              </label>

              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCustomIconFile(file);
                      setCustomIconPreview(URL.createObjectURL(file));
                      setEditCatIcon("");
                    }
                  }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-14 h-14 shrink-0 rounded-xl border-2 flex items-center justify-center p-2 transition-all ${
                    customIconFile
                      ? "border-black bg-gray-100 shadow-sm"
                      : "border-gray-200 border-dashed bg-gray-50 hover:border-gray-400 hover:bg-gray-200/50"
                  }`}
                >
                  {customIconPreview ? (
                    <img
                      src={customIconPreview}
                      alt="custom"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <IonIcon
                      icon={addOutline}
                      className="text-2xl text-gray-400"
                    />
                  )}
                </button>

                {AVAILABLE_ICONS.map((iconUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setEditCatIcon(iconUrl);
                      setCustomIconFile(null);
                      setCustomIconPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className={`w-14 h-14 shrink-0 rounded-xl border-2 flex items-center justify-center p-2 transition-all ${
                      !customIconFile && editCatIcon === iconUrl
                        ? "border-black bg-gray-100 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={iconUrl}
                      alt={`icon-${idx}`}
                      className="w-full h-full object-contain brightness-0 opacity-80"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">
                  Статус категорії
                </span>
                <span className="text-[10px] text-gray-500">
                  {editCatIsActive ? "Активна" : "Неактивна"}
                </span>
              </div>
              <IonToggle
                color="dark"
                checked={editCatIsActive}
                onIonChange={(e) => setEditCatIsActive(e.detail.checked)}
              />
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            <button
              onClick={() => setEditingCategory(null)}
              disabled={isSubmittingCat}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              Скасувати
            </button>
            <button
              onClick={() => setShowCatConfirmAlert(true)}
              disabled={isSubmittingCat}
              className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-md shadow-gray-200 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmittingCat ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </div>
      </IonModal>

      <IonAlert
        isOpen={showCatConfirmAlert}
        onDidDismiss={() => setShowCatConfirmAlert(false)}
        header="Підтвердження"
        message="Зберегти зміни для цієї категорії?"
        buttons={[
          { text: "Скасувати", role: "cancel" },
          {
            text: "Так, зберегти",
            role: "confirm",
            handler: handleSaveCategory,
          },
        ]}
      />
    </IonPage>
  );
};

export default ShopScreen;

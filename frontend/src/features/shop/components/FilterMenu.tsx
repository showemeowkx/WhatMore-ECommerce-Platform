import React, { useState, useEffect, useRef } from "react";
import {
  IonModal,
  IonContent,
  IonIcon,
  IonRange,
  IonToggle,
} from "@ionic/react";
import { closeOutline, checkmarkOutline } from "ionicons/icons";
import { useIsDesktop } from "../../../hooks/useIsDesktop";

export interface FilterState {
  categories: number[];
  sort: "ASC" | "DESC" | "PROMO" | null;
  priceMin: number;
  priceMax: number;
  showAll: boolean;
  showInactive: boolean;
  code: string;
}

interface Category {
  id: number;
  name: string;
}

interface FilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  isAdmin?: boolean;
}

const SORT_OPTIONS = [
  { value: "PROMO", label: "Спочатку акційні" },
  { value: "ASC", label: "Від дешевих до дорогих" },
  { value: "DESC", label: "Від дорогих до дешевих" },
] as const;

const MAX_PRICE_LIMIT = Number(import.meta.env.VITE_MAX_PRICE_LIMIT) || 2500;

const FilterMenu: React.FC<FilterMenuProps> = ({
  isOpen,
  onClose,
  categories,
  currentFilters,
  onApply,
  isAdmin = false,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const isDesktop = useIsDesktop();

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const localFiltersRef = useRef(localFilters);
  useEffect(() => {
    localFiltersRef.current = localFilters;
  }, [localFilters]);

  const toggleCategory = (categoryId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleApply = () => {
    if (isDesktop) {
      onApply(localFilters);
    }
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      categories: [],
      sort: "PROMO",
      priceMin: 0,
      priceMax: MAX_PRICE_LIMIT,
      showAll: false,
      showInactive: false,
      code: "",
    });
  };

  const headerContent = (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
      <h2 className="text-xl font-black text-gray-800 tracking-tight">
        Фільтри
      </h2>
      <div className="flex items-center gap-3">
        <button
          onClick={handleClear}
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
        >
          Очистити
        </button>
        {!isDesktop && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 active:text-gray-800 rounded-full bg-gray-50"
          >
            <IonIcon icon={closeOutline} className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );

  const bodyContent = (
    <div className="p-4 space-y-6 pb-6">
      {isAdmin && isDesktop && (
        <section className="flex flex-col gap-4 pb-2 border-b border-gray-100/50">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Адмін-фільтри
          </h3>

          <div className="flex flex-col mb-1">
            <span className="text-sm font-bold text-gray-700 tracking-wide mb-2">
              Пошук за кодом
            </span>
            <input
              type="text"
              value={localFilters.code}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, code: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-black transition-colors"
              placeholder="Введіть код товару"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 tracking-wide">
              Показувати без наявності
            </span>
            <IonToggle
              color="dark"
              checked={localFilters.showAll}
              onIonChange={(e) =>
                setLocalFilters({ ...localFilters, showAll: e.detail.checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 tracking-wide">
              Показувати неактивні
            </span>
            <IonToggle
              color="dark"
              checked={localFilters.showInactive}
              onIonChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  showInactive: e.detail.checked,
                })
              }
            />
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Сортування
        </h3>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setLocalFilters({ ...localFilters, sort: option.value })
              }
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                localFilters.sort === option.value
                  ? "bg-black border-gray-200 text-white"
                  : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
              }`}
            >
              <span className="text-sm font-bold">{option.label}</span>
              {localFilters.sort === option.value && (
                <IonIcon icon={checkmarkOutline} className="text-lg" />
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Ціна (₴)
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <input
            type="number"
            value={localFilters.priceMin === 0 ? "" : localFilters.priceMin}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                priceMin: Number(e.target.value),
              })
            }
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-black transition-colors"
            placeholder="0"
          />
          <span className="text-gray-300 font-medium">-</span>
          <input
            type="number"
            value={
              localFilters.priceMax === MAX_PRICE_LIMIT
                ? ""
                : localFilters.priceMax
            }
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                priceMax: Number(e.target.value) || MAX_PRICE_LIMIT,
              })
            }
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-black transition-colors"
            placeholder={MAX_PRICE_LIMIT.toString()}
          />
        </div>
        <div className="px-2 pt-1">
          <IonRange
            dualKnobs={true}
            color="dark"
            min={0}
            max={MAX_PRICE_LIMIT}
            step={10}
            value={{
              lower: localFilters.priceMin,
              upper: localFilters.priceMax,
            }}
            onIonChange={(e) => {
              const val = e.detail.value as { lower: number; upper: number };
              setLocalFilters({
                ...localFilters,
                priceMin: val.lower,
                priceMax: val.upper,
              });
            }}
            style={{
              "--bar-background-active": "#ea580c",
              "--knob-background": "#ea580c",
            }}
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Категорії
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = localFilters.categories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-black border-black text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  const footerContent = isDesktop ? (
    <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        onClick={handleApply}
        className="w-full bg-black text-white rounded-xl py-3.5 font-black text-sm active:scale-95 transition-all shadow-md"
      >
        Застосувати
      </button>
    </div>
  ) : null;

  if (isDesktop) {
    if (!isOpen) return null;
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full right-0 mt-3 w-[380px] max-h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-fade-in-down">
          <div className="shrink-0">{headerContent}</div>
          <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full">
            {bodyContent}
          </div>
          <div className="shrink-0">{footerContent}</div>
        </div>
      </>
    );
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={() => {
        onApply(localFiltersRef.current);
        onClose();
      }}
      breakpoints={[0, 0.6, 0.9]}
      initialBreakpoint={0.6}
      className="custom-bottom-sheet"
    >
      <IonContent className="bg-white">
        <div className="flex flex-col min-h-full">
          <div className="shrink-0 sticky top-0 z-50">{headerContent}</div>
          <div className="flex-1">{bodyContent}</div>
          <div className="shrink-0 sticky bottom-0 z-50">{footerContent}</div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FilterMenu;

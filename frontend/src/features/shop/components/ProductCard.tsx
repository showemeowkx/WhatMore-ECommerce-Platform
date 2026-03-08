import React from "react";
import { IonIcon, isPlatform } from "@ionic/react";
import { add } from "ionicons/icons";

interface ProductCardProps {
  name: string;
  price: number;
  unit: string;
  image?: string;
  oldPrice?: number;
  isActive?: boolean;
  isOutOfStock?: boolean;
  isCategoryActive?: boolean;
  code?: string | number;
  isAdmin?: boolean;
  onClick?: () => void;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  unit,
  image,
  oldPrice,
  isActive,
  isOutOfStock,
  isCategoryActive,
  code,
  isAdmin,
  onClick,
  onAddToCart,
}) => {
  const discountPercentage = oldPrice
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const isUnavailable = !isActive || isOutOfStock || isCategoryActive === false;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden group transition-all ${
        isUnavailable ? "opacity-70 grayscale-[30%]" : ""
      }`}
    >
      <div className="aspect-[1/0.9] bg-gray-50 rounded-[18px] mb-2 overflow-hidden flex items-center justify-center relative">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-contain p-2 mix-blend-multiply"
          />
        ) : (
          <span className="text-3xl opacity-20">📷</span>
        )}

        {discountPercentage > 0 && !isUnavailable && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm z-10">
            -{discountPercentage}%
          </div>
        )}

        {isAdmin && isPlatform("desktop") && code && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-lg shadow-sm z-10">
            {code}
          </div>
        )}

        {!isActive ? (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1.5px]">
            <span className="bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
              Неактивний
            </span>
          </div>
        ) : isOutOfStock ? (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1.5px]">
            <span className="bg-gray-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
              Немає в наявності
            </span>
          </div>
        ) : isCategoryActive === false ? (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1.5px]">
            <span className="bg-gray-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
              Категорія неактивна
            </span>
          </div>
        ) : null}

        <button
          disabled={isUnavailable}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
          className={`absolute bottom-1 right-1 z-20 w-8 h-8 rounded-[10px] flex items-center justify-center transition-all shadow-md ${
            isUnavailable
              ? "bg-gray-100/80 text-gray-400 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-50 active:bg-gray-100 active:text-white active:scale-95"
          }`}
        >
          <IonIcon icon={add} className="text-lg" />
        </button>
      </div>

      <div className="flex flex-col flex-grow">
        <h3
          className={`font-bold text-gray-800 ${
            isPlatform("desktop") ? "text-sm" : "text-xs"
          } mb-0.5 leading-tight line-clamp-2`}
        >
          {name}
        </h3>

        <p className="text-[10px] text-gray-400 font-medium mb-2">{unit}</p>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {oldPrice && (
              <span className="text-[10px] text-gray-400 line-through decoration-red-400/50">
                {oldPrice} ₴
              </span>
            )}
            <span
              className={`font-black text-base ${oldPrice ? "text-red-500" : "text-gray-900"} ${isUnavailable ? "text-gray-500" : ""}`}
            >
              {price}{" "}
              <span className="text-xs font-normal text-gray-400">₴</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

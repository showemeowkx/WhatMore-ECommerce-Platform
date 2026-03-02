import React, { useState, useEffect, useRef } from "react";
import { IonIcon } from "@ionic/react";
import { add, remove, trashOutline } from "ionicons/icons";

interface SmallProductCardProps {
  name: string;
  price: number;
  unit: string;
  image?: string;
  oldPrice?: number;
  isActive?: boolean;
  isOutOfStock?: boolean;
  onClick?: () => void;
  isCartItem?: boolean;
  initialQuantity?: number;
  availableStock?: number;
  onRemove?: () => void;
  onDecrease?: () => void;
  onAddToCart?: () => void;
  onUpdateQuantity?: (qty: number) => void;
}

const SmallProductCard: React.FC<SmallProductCardProps> = ({
  name,
  price,
  unit,
  image,
  oldPrice,
  isActive = true,
  isOutOfStock,
  onClick,
  isCartItem = false,
  initialQuantity = 1,
  availableStock,
  onRemove,
  onDecrease,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const [quantity, setQuantity] = useState<number | string>(initialQuantity);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) onAddToCart?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valStr = e.target.value;
    const isPiece = unit.toLowerCase().includes("шт");
    valStr = isPiece
      ? valStr.replace(/[^0-9]/g, "")
      : valStr.replace(/[^0-9.]/g, "");
    setQuantity(valStr);
  };

  const handleInputBlur = () => {
    const val = Number(quantity);
    if (isNaN(val) || val <= 0) {
      setQuantity(initialQuantity);
      return;
    }
    const finalVal =
      availableStock !== undefined && val > availableStock
        ? availableStock
        : val;
    setQuantity(finalVal);

    if (finalVal !== initialQuantity) {
      onUpdateQuantity?.(finalVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") inputRef.current?.blur();
  };

  const isUnavailable = !isActive || isOutOfStock;
  const isDecreaseDisabled = Number(quantity) <= 1 || !isActive;

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm mb-2.5 gap-3 transition-all ${isUnavailable && !isCartItem ? "opacity-75 grayscale-[30%]" : ""}`}
    >
      <div className="w-14 h-14 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-contain p-1 mix-blend-multiply"
          />
        ) : (
          <span className="text-lg opacity-20">📷</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between w-full gap-2">
          <h3 className="font-bold text-sm text-gray-800 truncate leading-tight flex-1">
            {name}
          </h3>
          {isCartItem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className={`${isActive ? "text-black hover:text-red-600" : "text-red-600"} transition-colors shrink-0 ml-1`}
            >
              <IonIcon icon={trashOutline} className="text-[18px]" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 font-medium mb-1">{unit}</p>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black text-sm ${oldPrice && !isCartItem ? "text-red-500" : "text-gray-900"}`}
          >
            {price} ₴
          </span>
        </div>
      </div>

      {isCartItem ? (
        <div
          className={`flex items-center rounded-full border p-0.5 ${!isActive ? "bg-gray-100 border-gray-200 opacity-60" : "bg-gray-50 border-gray-100"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            disabled={isDecreaseDisabled}
            onClick={() => {
              if (isActive) onDecrease?.();
            }}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${isDecreaseDisabled ? "text-gray-300 cursor-not-allowed" : "text-black active:scale-95"}`}
          >
            <IonIcon icon={remove} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={quantity}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={!isActive}
            className={`w-8 text-center bg-transparent font-bold text-sm outline-none ${!isActive ? "text-gray-400 cursor-not-allowed pointer-events-none" : "text-gray-800"}`}
          />

          <button
            disabled={!isActive}
            onClick={handleIncrease}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${!isActive ? "text-gray-300 cursor-not-allowed" : "text-black active:scale-95"}`}
          >
            <IonIcon icon={add} />
          </button>
        </div>
      ) : (
        <button
          disabled={isUnavailable}
          onClick={handleIncrease}
          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
            isUnavailable
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-50 text-black hover:bg-gray-50 active:bg-gray-100 active:text-white active:scale-95"
          }`}
        >
          <IonIcon icon={add} className="text-lg" />
        </button>
      )}
    </div>
  );
};

export default SmallProductCard;

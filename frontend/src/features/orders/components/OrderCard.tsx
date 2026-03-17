import React from "react";

interface OrderCardProps {
  orderNumber: string | number;
  date: string;
  amount: number;
  status: string;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  orderNumber,
  date,
  amount,
  status,
  onClick,
}) => {
  const translateStatus = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case "COMPLETED":
        return "Виконано";
      case "IN DELIVERY":
        return "Доставляється";
      case "IN PROCESS":
        return "У процесі обробки";
      case "CANCELLED":
        return "Скасовано";
      default:
        return currentStatus;
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex justify-between items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-2.5 transition-all active:scale-[0.98] cursor-pointer hover:border-gray-200"
    >
      <div className="flex flex-col gap-2.5">
        <span className="font-black text-xl text-gray-800 leading-none">
          #{orderNumber}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border w-fit leading-none text-black bg-gray-50 border-gray-300">
          {translateStatus(status)}
        </span>
      </div>

      <div className="flex flex-col items-end gap-3 pt-0.5">
        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider leading-none">
          {date}
        </span>
        <span className="font-black text-lg text-gray-900 leading-none">
          {amount} <span className="text-xs font-medium text-gray-400">₴</span>
        </span>
      </div>
    </div>
  );
};

export default OrderCard;

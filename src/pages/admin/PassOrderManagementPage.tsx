import { useState, useMemo } from "react";
import { isSameMonth } from "date-fns";
import {
  useAllOrders,
  useSeasonPassOrder,
} from "../../hooks/useSeasonPassOrder";
import { useSeasonPasses } from "../../hooks/useSeasonPasses";
import { useActivePassStats } from "../../hooks/useActivePassStats";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { OrderStatus, SeasonPassOrder } from "../../types/order";
import OrderTypeTabs from "../../components/admin/OrderTypeTabs";
import { useToast } from "../../context/ToastContext";

// Stats KPI Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  bgColor: string;
}) => (
  <div className="w-full min-w-0 max-w-full bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#EFECE5] shadow-soft flex items-center justify-between overflow-hidden">
    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-2">
      <p className="text-[11px] sm:text-xs font-medium text-text-light truncate">{title}</p>
      <p className="text-lg sm:text-2xl font-serif font-bold text-gray-900 truncate">{value}</p>
      {subtitle && <p className="text-[9px] sm:text-[10px] text-text-light/80 truncate">{subtitle}</p>}
    </div>
    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${bgColor} ${color} shrink-0`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  </div>
);

const PassOrderManagementPage = () => {
  const { orders, loading: loadingOrders } = useAllOrders();
  const { updateOrderStatus } = useSeasonPassOrder();
  const { activatePass, passes: allPassDefinitions } = useSeasonPasses();
  const { stats: activePassStats } = useActivePassStats();
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Calculate Monthly Revenue
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return orders
      .filter((o) => {
        if (o.status !== "completed" || !o.createdAt) return false;
        const orderDate = new Date(o.createdAt.seconds * 1000);
        return isSameMonth(orderDate, now);
      })
      .reduce((sum, o) => sum + o.price, 0);
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter(o => o.status === "pending_payment").length;
  }, [orders]);

  const totalActivePasses = useMemo(() => {
    return Object.values(activePassStats).reduce((sum, count) => sum + count, 0);
  }, [activePassStats]);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.passName || '').includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  const handleConfirmPayment = async (order: SeasonPassOrder) => {
    if (
      !window.confirm(
        `確認收到款項，並為 ${order.userName} 開通「${order.passName} (${order.variantName})」嗎？`
      )
    )
      return;

    setProcessingId(order.id);
    try {
      // 1. Activate Pass for User
      await activatePass(order.userId, order.passId, order.variantName);

      // 2. Update Order Status
      await updateOrderStatus(order.id, "completed");

      showToast(`已成功開通 ${order.userName} 的季卡方案！`, "success");
    } catch (error) {
      console.error("季卡開通失敗:", error);
      showToast("開通處理失敗，請稍後再試", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("確定要取消此季卡購買訂單嗎？")) return;
    setProcessingId(orderId);
    try {
      await updateOrderStatus(orderId, "cancelled");
      showToast("訂單已取消", "success");
    } catch (error) {
      console.error(error);
      showToast("取消失敗", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            已完成開通
          </span>
        );
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            待收款審核
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            已取消
          </span>
        );
      default:
        return status;
    }
  };

  if (loadingOrders) return <div className="flex justify-center items-center h-full min-h-[50vh] bg-[#FAF9F6]"><LoadingSpinner text="載入季卡訂單中..." /></div>;

  return (
    <div className="min-h-full bg-[#FAF9F6] pb-24 md:pb-16 pt-2 md:pt-4 w-full max-w-full overflow-x-hidden text-text-main">
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 w-full min-w-0">
        
        {/* 1. Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <OrderTypeTabs />
        </div>

        {/* 2. KPI Statistics Ribbon */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="本月季卡營收"
            value={`$${monthlyRevenue.toLocaleString()}`}
            subtitle="本月已完成季卡銷售額"
            icon={BanknotesIcon}
            bgColor="bg-emerald-50"
            color="text-emerald-700"
          />
          <StatCard
            title="待審核收款"
            value={`${pendingCount} 筆`}
            subtitle="尚未開通之待付款訂單"
            icon={ClockIcon}
            bgColor={pendingCount > 0 ? "bg-amber-50" : "bg-gray-50"}
            color={pendingCount > 0 ? "text-amber-700" : "text-gray-500"}
          />
          <StatCard
            title="現行有效季卡總數"
            value={`${totalActivePasses} 張`}
            subtitle={`涵蓋 ${allPassDefinitions.length} 種方案項目`}
            icon={CreditCardIcon}
            bgColor="bg-[#9F9586]/10"
            color="text-[#9F9586]"
          />
        </section>

        {/* 3. Main Content Container */}
        <div className="bg-white rounded-3xl shadow-soft border border-[#EFECE5] overflow-hidden flex flex-col min-h-[60vh]">
          
          {/* Search & Status Tabs Bar */}
          <div className="p-4 sm:p-5 border-b border-[#EFECE5] bg-white space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="搜尋用戶姓名、Email 或方案名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#FAF9F6] rounded-2xl border border-[#EFECE5] text-xs sm:text-sm text-text-main placeholder:text-text-light/60 focus:outline-none focus:border-[#9F9586] focus:ring-1 focus:ring-[#9F9586] transition-all"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-2xl border border-[#EFECE5] shrink-0 self-start md:self-auto">
                {[
                  { key: "all", label: "全部訂單" },
                  { key: "pending_payment", label: "待付款" },
                  { key: "completed", label: "已完成" },
                  { key: "cancelled", label: "已取消" },
                ].map(status => (
                  <button
                    key={status.key}
                    onClick={() => setFilterStatus(status.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === status.key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Mobile Card View (md:hidden) */}
          <div className="p-4 bg-[#FAF9F6]/40 md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-text-light bg-white rounded-3xl border border-dashed border-[#EFECE5] p-6">
                無符合條件的季卡訂單
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 shadow-soft border border-[#EFECE5] space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-text-light font-mono">
                      {order.createdAt?.seconds
                        ? new Date(order.createdAt.seconds * 1000).toLocaleString("zh-TW", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "剛才"}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-3 border-b border-[#EFECE5] pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#9F9586]/10 text-[#9F9586] font-bold text-base flex items-center justify-center">
                      {order.userName?.charAt(0) || "客"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{order.userName}</div>
                      <div className="text-xs text-text-light">{order.userEmail}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-serif font-bold text-[#9F9586] text-base block">
                        {order.passName}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs bg-[#FAF9F6] border border-[#EFECE5] text-gray-600 mt-1">
                        {order.variantName}
                      </span>
                    </div>
                    <span className="font-serif font-bold text-gray-900 text-lg">
                      ${order.price.toLocaleString()}
                    </span>
                  </div>

                  {order.paymentNote && (
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#EFECE5] text-xs text-gray-700">
                      <span className="font-bold text-gray-400 block mb-0.5">付款備註</span>
                      {order.paymentNote}
                    </div>
                  )}

                  {order.status === "pending_payment" && (
                    <div className="flex gap-2 pt-2 border-t border-[#EFECE5]">
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={processingId === order.id}
                        className="flex-1 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        取消訂單
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(order)}
                        disabled={processingId === order.id}
                        className="flex-1 py-2.5 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>確認收款並開通</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF9F6] text-gray-700 font-bold text-xs border-b border-[#EFECE5]">
                <tr>
                  <th className="p-4 pl-6">訂單時間</th>
                  <th className="p-4">用戶資訊</th>
                  <th className="p-4">購買方案與規格</th>
                  <th className="p-4">金額</th>
                  <th className="p-4">備註</th>
                  <th className="p-4">狀態</th>
                  <th className="p-4 pr-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-800 divide-y divide-[#EFECE5]/70">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-text-light">
                      無符合條件的季卡訂單
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                      <td className="p-4 pl-6 text-text-light font-mono">
                        {order.createdAt?.seconds
                          ? new Date(order.createdAt.seconds * 1000).toLocaleString("zh-TW")
                          : "剛才"}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{order.userName}</div>
                        <div className="text-text-light text-[11px]">{order.userEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#9F9586]">{order.passName}</div>
                        <div className="text-text-light text-[11px]">{order.variantName}</div>
                      </td>
                      <td className="p-4 font-serif font-bold text-sm text-gray-900">
                        ${order.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-text-light max-w-[180px] truncate" title={order.paymentNote}>
                        {order.paymentNote || "-"}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {order.status === "pending_payment" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={processingId === order.id}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="取消訂單"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleConfirmPayment(order)}
                              disabled={processingId === order.id}
                              className="px-3 py-1.5 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="確認收款並開通"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>確認收款</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
};

export default PassOrderManagementPage;

import { useState } from 'react';

import { useAllOrders, useSeasonPassOrder } from '../../hooks/useSeasonPassOrder';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { OrderStatus, SeasonPassOrder } from '../../types/order';
import OrderTypeTabs from '../../components/admin/OrderTypeTabs';

const PassOrderManagementPage = () => {
  const { orders, loading: loadingOrders } = useAllOrders();
  const { updateOrderStatus} = useSeasonPassOrder();
  const { activatePass } = useSeasonPasses(); // Need to ensure expose this from hook
  
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesSearch = 
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.passName.includes(searchTerm);
        
      return matchesStatus && matchesSearch;
  });

  const handleConfirmPayment = async (order: SeasonPassOrder) => {
      if (!window.confirm(`確認收到款項，並開通 ${order.userName} 的 ${order.passName} 嗎？`)) return;
      
      try {
          // 1. Activate Pass for User
          await activatePass(order.userId, order.passId, order.variantName);
          
          // 2. Update Order Status
          await updateOrderStatus(order.id, 'completed');
          
          alert('訂單已完成，季卡已開通！');
      } catch (error) {
          console.error(error);
          alert('處理失敗，請查看控制台日誌');
      }
  };
  
  const handleCancelOrder = async (orderId: string) => {
      if (!window.confirm('確定要取消此訂單嗎？')) return;
       try {
          await updateOrderStatus(orderId, 'cancelled');
      } catch (error) {
          console.error(error);
          alert('取消失敗');
      }
  };

  if (loadingOrders) return <LoadingSpinner fullScreen />;

  if (loadingOrders) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">訂單管理</h1>
      </div>

      <div className="max-w-md mb-6">
        <OrderTypeTabs />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
           <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
           <input 
             type="text" 
             placeholder="搜尋用戶、Email 或方案名稱..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9F9586] focus:border-transparent"
           />
        </div>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {(['all', 'pending_payment', 'completed', 'cancelled'] as const).map(status => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 text-sm font-medium ${
                        filterStatus === status 
                        ? 'bg-[#9F9586] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-l first:border-l-0 border-gray-200'
                    }`}
                >
                    {status === 'all' ? '全部' : 
                     status === 'pending_payment' ? '待付款' :
                     status === 'completed' ? '已完成' : '已取消'}
                </button>
            ))}
        </div>
      </div>

      {/* Mobile Card View (md:hidden) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredOrders.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                  無符合條件的訂單
              </div>
          ) : (
              filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                      {/* Header: Date & Status */}
                      <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">
                              {order.createdAt?.seconds 
                                  ? new Date(order.createdAt.seconds * 1000).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                  : '刚刚'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                              {order.status === 'completed' ? '已完成' : 
                               order.status === 'pending_payment' ? '待付款' : '已取消'}
                          </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                           <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                              {order.userName.charAt(0)}
                           </div>
                           <div>
                               <div className="font-bold text-gray-900">{order.userName}</div>
                               <div className="text-xs text-gray-400">{order.userEmail}</div>
                           </div>
                      </div>

                      {/* Pass Details */}
                      <div>
                          <div className="flex justify-between items-baseline mb-1">
                              <span className="font-bold text-[#9F9586] text-lg">{order.passName}</span>
                              <span className="font-bold text-gray-900">${order.price.toLocaleString()}</span>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              {order.variantName}
                          </span>
                      </div>

                      {/* Payment Note */}
                      {order.paymentNote && (
                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                              <span className="font-bold text-xs text-gray-400 block mb-1">備註</span>
                              {order.paymentNote}
                          </div>
                      )}

                      {/* Actions */}
                      {order.status === 'pending_payment' && (
                          <div className="flex gap-3 mt-2 pt-3 border-t border-gray-100">
                              <button 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="flex-1 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                              >
                                  取消訂單
                              </button>
                              <button 
                                  onClick={() => handleConfirmPayment(order)}
                                  className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  確認收款
                              </button>
                          </div>
                      )}
                  </div>
              ))
          )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF9F6] text-gray-600 font-medium text-sm">
                <tr>
                    <th className="p-4 border-b">訂單時間</th>
                    <th className="p-4 border-b">用戶</th>
                    <th className="p-4 border-b">購買方案</th>
                    <th className="p-4 border-b">金額</th>
                    <th className="p-4 border-b">備註</th>
                    <th className="p-4 border-b">狀態</th>
                    <th className="p-4 border-b text-right">操作</th>
                </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                            無符合條件的訂單
                        </td>
                    </tr>
                ) : (
                    filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 group transition-colors">
                            <td className="p-4">
                                {order.createdAt?.seconds 
                                 ? new Date(order.createdAt.seconds * 1000).toLocaleString('zh-TW') 
                                 : '刚刚'}
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-gray-900">{order.userName}</div>
                                <div className="text-xs text-gray-500">{order.userEmail}</div>
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-[#9F9586]">{order.passName}</div>
                                <div className="text-xs text-gray-500">{order.variantName}</div>
                            </td>
                            <td className="p-4 text-base font-bold">
                                ${order.price.toLocaleString()}
                            </td>
                            <td className="p-4 text-gray-500 max-w-[200px] truncate" title={order.paymentNote}>
                                {order.paymentNote || '-'}
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                    order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                     {order.status === 'completed' ? '已完成' : 
                                      order.status === 'pending_payment' ? '待付款' : '已取消'}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                {order.status === 'pending_payment' && (
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="取消訂單"
                                        >
                                            <XCircleIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleConfirmPayment(order)}
                                            className="px-3 py-1 bg-[#1a1a1a] text-white text-xs rounded hover:bg-black flex items-center gap-1 shadow-sm"
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
  );
};

export default PassOrderManagementPage;

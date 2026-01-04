import { useState } from 'react';
import { useRedemptionItems, type RedemptionItem } from '../../hooks/useRedemptionItems';
import { useCoupons } from '../../hooks/useCoupons';
import { useGiftCards } from '../../hooks/useGiftCards';
import LoadingSpinner from '../common/LoadingSpinner';
import { GiftIcon, TrashIcon, PencilSquareIcon, PlusIcon, TicketIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';

type RedemptionType = 'coupon' | 'giftcard';

const RedemptionSettings = () => {
  const { items, isLoading, addItem, updateItem, deleteItem } = useRedemptionItems();
  const { coupons } = useCoupons();
  const { giftCards } = useGiftCards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RedemptionItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(500);
  const [colorTheme, setColorTheme] = useState<'orange' | 'blue' | 'green' | 'pink' | 'gray'>('orange');
  const [isActive, setIsActive] = useState(true);
  const [redemptionType, setRedemptionType] = useState<RedemptionType>('coupon');
  const [linkedCouponId, setLinkedCouponId] = useState('');
  const [linkedGiftCardId, setLinkedGiftCardId] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setPoints(500);
    setColorTheme('orange');
    setIsActive(true);
    setRedemptionType('coupon');
    setLinkedCouponId('');
    setLinkedGiftCardId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RedemptionItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setPoints(item.points);
    setColorTheme(item.colorTheme);
    setIsActive(item.isActive);
    setRedemptionType(item.redemptionType || 'coupon');
    setLinkedCouponId(item.linkedCouponId || '');
    setLinkedGiftCardId(item.linkedGiftCardId || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除此兌換項目嗎？')) {
      await deleteItem(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build itemData without undefined values (Firestore doesn't accept undefined)
      const itemData: Record<string, any> = {
        title,
        points,
        colorTheme,
        isActive,
        redemptionType,
      };

      // Only include linked IDs if they have values
      if (redemptionType === 'coupon' && linkedCouponId) {
        itemData.linkedCouponId = linkedCouponId;
      }
      if (redemptionType === 'giftcard' && linkedGiftCardId) {
        itemData.linkedGiftCardId = linkedGiftCardId;
      }

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData as Omit<RedemptionItem, 'id' | 'createdAt'>);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save failed", error);
      alert("儲存失敗，請重試");
    }
  };

  const themeColors = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">點數兌換項目管理</h3>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8A8173] transition-colors font-medium text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          新增兌換項目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className={`p-4 rounded-xl border-2 flex items-center gap-4 relative group ${item.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${themeColors[item.colorTheme].split(' ').filter(c => !c.startsWith('border')).join(' ')
              }`}>
              {item.redemptionType === 'giftcard' ? <CreditCardIcon className="w-6 h-6" /> : <GiftIcon className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.points} pt</span>
                {item.redemptionType === 'giftcard' ? (
                  <span className="text-[10px] flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                    <CreditCardIcon className="w-3 h-3" />
                    商品卡
                  </span>
                ) : item.linkedCouponId && (
                  <span className="text-[10px] flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <TicketIcon className="w-3 h-3" />
                    優惠券
                  </span>
                )}
                {!item.isActive && <span className="text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded">已停用</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-gray-400 hover:text-[#9F9586] hover:bg-gray-100 rounded-lg">
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            目前沒有設定任何兌換項目，請點擊上方按鈕新增。
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? '編輯兌換項目' : '新增兌換項目'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">項目名稱</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
              placeholder="例如：$100 折價券"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">所需點數</label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
            />
          </div>

          {/* Redemption Type Tabs */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">兌換類型</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => setRedemptionType('coupon')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${redemptionType === 'coupon'
                  ? 'bg-[#9F9586] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <TicketIcon className="w-4 h-4" />
                優惠券
              </button>
              <button
                type="button"
                onClick={() => setRedemptionType('giftcard')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${redemptionType === 'giftcard'
                  ? 'bg-[#9F9586] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <CreditCardIcon className="w-4 h-4" />
                商品卡
              </button>
            </div>
          </div>

          {/* Coupon Tab Content */}
          {redemptionType === 'coupon' && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <label className="block text-sm font-bold text-gray-700 mb-1">連結優惠券 (兌換後自動發送)</label>
              <select
                value={linkedCouponId}
                onChange={e => setLinkedCouponId(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
              >
                <option value="">無 (僅扣點)</option>
                {coupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.title} (代碼: {coupon.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">選取後，用戶兌換時將自動獲得一張效期 90 天的此優惠券。</p>
            </div>
          )}

          {/* Gift Card Tab Content */}
          {redemptionType === 'giftcard' && (
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <label className="block text-sm font-bold text-gray-700 mb-1">連結商品卡</label>
              <select
                value={linkedGiftCardId}
                onChange={e => setLinkedGiftCardId(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
              >
                <option value="">請選擇商品卡</option>
                {giftCards.filter(gc => gc.isActive).map(gc => (
                  <option key={gc.id} value={gc.id}>
                    {gc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">用戶兌換後將收到此商品卡，可憑此至店內領取。</p>
              {giftCards.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">尚未建立任何商品卡，請先至「商品卡管理」新增。</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">顏色主題</label>
            <div className="flex gap-3">
              {['orange', 'blue', 'green', 'pink', 'gray'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTheme(c as any)}
                  className={`w-8 h-8 rounded-full border-2 focus:outline-none flex items-center justify-center transition-transform ${colorTheme === c ? 'scale-110 ring-2 ring-offset-2 ring-[#9F9586]' : 'hover:scale-105'}`}
                  style={{ borderColor: 'transparent' }} // reset
                >
                  <div className={`w-full h-full rounded-full ${themeColors[c as keyof typeof themeColors].split(' ')[0]}`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded text-[#9F9586] focus:ring-[#9F9586]"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">啟用此兌換項目 (在前台顯示)</label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
            <button type="submit" className="px-6 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8A8173] font-bold shadow-sm">儲存</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RedemptionSettings;


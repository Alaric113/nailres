import { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  offset,
  flip,
  shift,
} from '@floating-ui/react';
import { useServices } from '../../hooks/useServices';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import type { Coupon, CouponDocument, CouponScope, CouponType } from '../../types/coupon';

interface CouponFormProps {
  coupon?: Coupon | null;
  onClose: () => void;
  onSave: () => void;
}

// Re-styled DatePickerInput for consistency
const DatePickerInput = ({
  selected,
  onChange,
  placeholder,
  disabledDays,
}: {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  disabledDays?: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift()],
    placement: 'bottom-start',
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const handleDayClick = (selectedDay: Date | undefined) => {
    onChange(selectedDay); // onChange now accepts Date | undefined
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input 
        type="text" 
        value={selected ? format(selected, 'yyyy-MM-dd') : ''} 
        readOnly 
        {...getReferenceProps({ ref: refs.setReference })} 
        placeholder={placeholder} 
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm cursor-pointer" 
      />
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div 
            ref={refs.setFloating} 
            style={floatingStyles} 
            {...getFloatingProps()} 
            className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2"
          >
            <style>{`
                .rdp { --rdp-accent-color: #9F9586; margin: 0; }
                .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #F5F5F4; }
            `}</style>
            <DayPicker mode="single" selected={selected} onSelect={handleDayClick} locale={zhTW} disabled={disabledDays} required={false} />
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
};

const CouponForm = ({ coupon, onClose, onSave }: CouponFormProps) => {
  const [formData, setFormData] = useState({
    code: '', title: '', details: '', rules: '', type: 'fixed' as CouponType,
    value: 0, minSpend: 0, scopeType: 'all' as CouponScope, scopeIds: [] as string[],
    usageLimit: 1, isActive: true, isNewUserCoupon: false,
  });
  const [validFrom, setValidFrom] = useState<Date | undefined>();
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { services } = useServices();
  const { categories } = useServiceCategories();

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code, title: coupon.title, details: coupon.details, rules: coupon.rules,
        type: coupon.type, value: coupon.value, minSpend: coupon.minSpend,
        scopeType: coupon.scopeType, scopeIds: coupon.scopeIds, usageLimit: coupon.usageLimit, 
        isActive: coupon.isActive, isNewUserCoupon: !!coupon.isNewUserCoupon,
      });
      setValidFrom(coupon.validFrom.toDate());
      setValidUntil(coupon.validUntil.toDate());
      setIsUnlimited(coupon.usageLimit === -1);
    } else {
      // Reset form for new coupon
      setFormData({
        code: '', title: '', details: '', rules: '', type: 'fixed' as CouponType,
        value: 0, minSpend: 0, scopeType: 'all' as CouponScope, scopeIds: [] as string[],
        usageLimit: 1, isActive: true, isNewUserCoupon: false,
      });
      setValidFrom(undefined);
      setValidUntil(undefined);
      setIsUnlimited(false);
    }
  }, [coupon]);

  const handleScopeIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, scopeIds: selectedOptions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.code || !formData.title || !validFrom || !validUntil) {
      setError('代碼、標題、生效日期和過期日期為必填欄位。');
      return;
    }
    if (formData.type === 'percentage' && (formData.value < 1 || formData.value > 100)) {
        setError('折扣百分比必須介於 1 到 100 之間。');
        return;
    }
    if (formData.value <= 0) {
        setError('折扣數值必須大於 0。');
        return;
    }


    setIsSubmitting(true);
    try {
      const couponData: Omit<CouponDocument, 'createdAt' | 'usageCount'> = {
        ...formData,
        value: Number(formData.value),
        minSpend: Number(formData.minSpend),
        usageLimit: isUnlimited ? -1 : Number(formData.usageLimit),
        validFrom: Timestamp.fromDate(validFrom),
        validUntil: Timestamp.fromDate(validUntil),
      };

      if (coupon) {
        const couponRef = doc(db, 'coupons', coupon.id);
        await setDoc(couponRef, couponData, { merge: true });
      } else {
        const newCouponData: CouponDocument = {
          ...couponData,
          usageCount: 0,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'coupons'), newCouponData);
      }
      onSave();
    } catch (err) {
      console.error("Error saving coupon:", err);
      setError('儲存優惠券失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scopeOptions = useMemo(() => {
    if (formData.scopeType === 'category') return categories.map(c => ({ value: c.name, label: c.name }));
    if (formData.scopeType === 'service') return services.map(s => ({ value: s.id, label: s.name }));
    return [];
  }, [formData.scopeType, categories, services]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">優惠券標題 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            id="title" 
            value={formData.title} 
            onChange={e => setFormData(p => ({...p, title: e.target.value}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm" 
            placeholder="例如：新客體驗優惠" 
            required 
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">優惠碼 (英文大寫) <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            id="code" 
            value={formData.code} 
            onChange={e => setFormData(p => ({...p, code: e.target.value.toUpperCase()}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm" 
            placeholder="例如：NEWCUSTOMER20" 
            required 
          />
        </div>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">詳細說明</label>
        <textarea 
          id="details" 
          value={formData.details} 
          onChange={e => setFormData(p => ({...p, details: e.target.value}))} 
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm resize-y" 
          rows={2}
          placeholder="此優惠券的詳細使用說明..."
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">折扣類型</label>
          <select 
            id="type" 
            value={formData.type} 
            onChange={e => setFormData(p => ({...p, type: e.target.value as CouponType}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm"
          >
            <option value="fixed">固定金額</option>
            <option value="percentage">百分比</option>
          </select>
        </div>
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">折扣數值 ({formData.type === 'fixed' ? '元' : '%'}) <span className="text-red-500">*</span></label> 
          <input 
            type="number" 
            id="value" 
            value={formData.value} 
            onChange={e => setFormData(p => ({...p, value: Number(e.target.value)}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm" 
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="minSpend" className="block text-sm font-medium text-gray-700 mb-1">最低消費 (元)</label>
          <input 
            type="number" 
            id="minSpend" 
            value={formData.minSpend} 
            onChange={e => setFormData(p => ({...p, minSpend: Number(e.target.value)}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm" 
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="scopeType" className="block text-sm font-medium text-gray-700 mb-1">適用範圍</label>
          <select 
            id="scopeType" 
            value={formData.scopeType} 
            onChange={e => setFormData(p => ({...p, scopeType: e.target.value as CouponScope, scopeIds: []}))} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm"
          >
            <option value="all">全部服務</option>
            <option value="category">指定分類</option>
            <option value="service">指定服務</option>
          </select>
        </div>
        {formData.scopeType !== 'all' && (
          <div>
            <label htmlFor="scopeIds" className="block text-sm font-medium text-gray-700 mb-1">指定項目</label>
            <select 
              id="scopeIds" 
              multiple 
              value={formData.scopeIds} 
              onChange={handleScopeIdChange} 
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm h-32"
            >
              {scopeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 <span className="text-red-500">*</span></label>
          <DatePickerInput
            selected={validFrom}
            onChange={setValidFrom}
            placeholder="點擊選擇生效日期"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">過期日期 <span className="text-red-500">*</span></label>
          <DatePickerInput
            selected={validUntil}
            onChange={setValidUntil}
            placeholder="點擊選擇過期日期"
            disabledDays={{ before: validFrom || new Date() }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">總使用次數限制</label>
          <input 
            type="number" 
            id="usageLimit" 
            value={isUnlimited ? '' : formData.usageLimit} 
            onChange={e => setFormData(p => ({...p, usageLimit: Number(e.target.value)}))} 
            min="1" 
            disabled={isUnlimited} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-transparent transition-shadow sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
          />
          <div className="flex items-center mt-2">
            <input 
                id="isUnlimited" 
                type="checkbox" 
                checked={isUnlimited} 
                onChange={(e) => setIsUnlimited(e.target.checked)} 
                className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded cursor-pointer" 
            />
            <label htmlFor="isUnlimited" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">不限總使用次數</label>
          </div>
        </div>
        <div className="flex flex-col justify-end pb-1 gap-4">
            <div className="flex items-center">
              <input 
                id="isNewUserCoupon" 
                type="checkbox" 
                checked={formData.isNewUserCoupon} 
                onChange={e => setFormData(p => ({...p, isNewUserCoupon: e.target.checked}))} 
                className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded cursor-pointer" 
              />
              <label htmlFor="isNewUserCoupon" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">設為新人專屬券</label>
            </div>
            <div className="flex items-center">
              <input 
                id="isActive" 
                type="checkbox" 
                checked={formData.isActive} 
                onChange={e => setFormData(p => ({...p, isActive: e.target.checked}))} 
                className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded cursor-pointer" 
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">啟用此優惠券</label>
            </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            取消
        </button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#9F9586] text-white font-medium rounded-lg hover:bg-[#8a8175] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? '儲存中...' : '儲存優惠券'}
        </button>
      </div>
    </form>
  );
};

export default CouponForm;
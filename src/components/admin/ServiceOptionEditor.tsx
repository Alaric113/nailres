import React from 'react';
import type { ServiceOption, ServiceOptionItem } from '../../types/service';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

interface ServiceOptionEditorProps {
  options: ServiceOption[];
  onChange: (options: ServiceOption[]) => void;
}

const ServiceOptionEditor: React.FC<ServiceOptionEditorProps> = ({ options, onChange }) => {
  
  const handleAddOption = () => {
    const newOption: ServiceOption = {
      id: uuidv4(),
      name: '',
      required: false,
      multiSelect: false,
      items: []
    };
    onChange([...options, newOption]);
  };

  const handleRemoveOption = (optionId: string) => {
    if (window.confirm('確定要刪除此選項目分類嗎？')) {
      onChange(options.filter(o => o.id !== optionId));
    }
  };

  const handleOptionChange = (optionId: string, field: keyof ServiceOption, value: any) => {
    onChange(options.map(o => o.id === optionId ? { ...o, [field]: value } : o));
  };

  const handleAddItem = (optionId: string) => {
    const newItem: ServiceOptionItem = {
      id: uuidv4(),
      name: '',
      price: 0,
      duration: 0
    };
    onChange(options.map(o => {
      if (o.id === optionId) {
        return { ...o, items: [...o.items, newItem] };
      }
      return o;
    }));
  };

  const handleRemoveItem = (optionId: string, itemId: string) => {
    onChange(options.map(o => {
      if (o.id === optionId) {
        return { ...o, items: o.items.filter(i => i.id !== itemId) };
      }
      return o;
    }));
  };

  const handleItemChange = (optionId: string, itemId: string, field: keyof ServiceOptionItem, value: any) => {
    onChange(options.map(o => {
      if (o.id === optionId) {
        const updatedItems = o.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
        return { ...o, items: updatedItems };
      }
      return o;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-text-main">
          附加選項/客製化設定
        </label>
        <button
          type="button"
          onClick={handleAddOption}
          className="text-sm text-primary hover:text-primary-dark flex items-center font-medium"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          新增選項分類
        </button>
      </div>

      {options.length === 0 && (
        <div className="text-sm text-gray-400 italic text-center py-4 border border-dashed rounded-lg bg-gray-50">
          尚無設定任何附加選項
        </div>
      )}

      {options.map((option) => (
        <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {/* Option Header Section */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">分類名稱 (例如: 卸甲, 加購保養)</label>
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => handleOptionChange(option.id, 'name', e.target.value)}
                  placeholder="輸入分類名稱"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.required}
                    onChange={(e) => handleOptionChange(option.id, 'required', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>必選</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.multiSelect}
                    onChange={(e) => handleOptionChange(option.id, 'multiSelect', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>可複選</span>
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Items Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">選項內容列表</span>
              <button
                type="button"
                onClick={() => handleAddItem(option.id)}
                className="text-xs text-primary hover:text-primary-dark flex items-center"
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                新增項目
              </button>
            </div>
            
            {option.items.length === 0 && (
               <div className="text-xs text-gray-400 text-center py-2">主要選項內容</div>
            )}

            <div className="space-y-2">
              {option.items.map((item) => (
                <div key={item.id} className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(option.id, item.id, 'name', e.target.value)}
                      placeholder="項目名稱"
                      className="block w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(option.id, item.id, 'price', Number(e.target.value))}
                      placeholder="價格"
                      className="block w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                   <div className="w-24 relative">
                    <input
                      type="number"
                      value={item.duration || 0}
                      onChange={(e) => handleItemChange(option.id, item.id, 'duration', Number(e.target.value))}
                      placeholder="時長"
                      className="block w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">分</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(option.id, item.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceOptionEditor;

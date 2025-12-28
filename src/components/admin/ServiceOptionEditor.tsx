import React, { useState } from 'react';
import type { ServiceOption, ServiceOptionItem } from '../../types/service';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, BarsArrowUpIcon, BarsArrowDownIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

interface ServiceOptionEditorProps {
  options: ServiceOption[];
  onChange: (options: ServiceOption[]) => void;
}

const ServiceOptionEditor: React.FC<ServiceOptionEditorProps> = ({ options, onChange }) => {
  // Store expanded state for each option by ID. default all expanded? or empty?
  // Let's default to expanded when creating, but maybe keep persistent?
  // For now local state is fine.
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  const toggleExpand = (optionId: string) => {
    setExpandedOptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  };

  // Helper to ensure new options are expanded automatically
  const handleAddOption = () => {
    const newId = uuidv4();
    const newOption: ServiceOption = {
      id: newId,
      name: '',
      required: false,
      multiSelect: false,
      items: []
    };
    onChange([...options, newOption]);
    setExpandedOptions(prev => new Set(prev).add(newId));
  };

  const handleRemoveOption = (optionId: string) => {
    if (window.confirm('確定要刪除此選項目分類嗎？')) {
      onChange(options.filter(o => o.id !== optionId));
    }
  };

  const handleOptionChange = (optionId: string, field: keyof ServiceOption, value: any) => {
    onChange(options.map(o => o.id === optionId ? { ...o, [field]: value } : o));
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    if (direction === 'up' && index > 0) {
      [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
    } else if (direction === 'down' && index < newOptions.length - 1) {
      [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    }
    onChange(newOptions);
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

      {options.map((option, index) => {
        const isExpanded = expandedOptions.has(option.id);
        return (
          <div key={option.id} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden transition-all duration-200">
            {/* Header / Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-100/50 cursor-pointer" onClick={() => toggleExpand(option.id)}>
              <div className="flex items-center gap-3 flex-1">
                <button type="button" className="text-gray-500">
                  {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
                <div className="font-medium text-sm text-gray-700">
                  {option.name || <span className="text-gray-400 italic">未命名分類</span>}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {option.items.length} 個項目
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {/* Reorder Buttons */}
                <button
                  type="button"
                  onClick={() => handleMoveOption(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-400"
                  title="上移"
                >
                  <BarsArrowUpIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveOption(index, 'down')}
                  disabled={index === options.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-400"
                  title="下移"
                >
                  <BarsArrowDownIcon className="w-4 h-4" />
                </button>
                
                <div className="w-px h-4 bg-gray-300 mx-1"></div>

                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="刪除分類"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
                <div className="space-y-3">
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
                  <div className="flex gap-4 flex-wrap">
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

                <hr className="border-gray-100" />

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
                     <div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded border border-dashed border-gray-200">
                       尚無項目，請點擊新增項目
                     </div>
                  )}

                  <div className="space-y-2">
                    {option.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-gray-50 p-2 rounded shadow-sm border border-gray-200/50">
                        {/* Name */}
                        <div className="flex-1 min-w-[150px]">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(option.id, item.id, 'name', e.target.value)}
                            placeholder="項目名稱"
                            className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        
                        {/* Price */}
                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(option.id, item.id, 'price', Number(e.target.value))}
                            placeholder="價格"
                            className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary text-center"
                          />
                        </div>
                        
                        {/* Duration */}
                         <div className="w-20 shrink-0 relative">
                          <input
                            type="number"
                            value={item.duration || 0}
                            onChange={(e) => handleItemChange(option.id, item.id, 'duration', Number(e.target.value))}
                            placeholder="時長"
                            className="block w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary text-center pr-6"
                          />
                          <span className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">分</span>
                        </div>

                        {/* Quantity Config */}
                        <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-1">
                             <label className="flex items-center space-x-1 cursor-pointer" title="啟用數量選擇">
                                <input 
                                    type="checkbox" 
                                    checked={item.allowQuantity || false}
                                    onChange={(e) => handleItemChange(option.id, item.id, 'allowQuantity', e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="text-xs text-gray-500">數量</span>
                             </label>
                             {item.allowQuantity && (
                                <div className="w-16">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={item.maxQuantity || 10}
                                        onChange={(e) => handleItemChange(option.id, item.id, 'maxQuantity', Number(e.target.value))}
                                        placeholder="Max"
                                        title="最大數量"
                                        className="block w-full px-1 py-1 border border-gray-300 rounded text-xs focus:border-primary focus:ring-1 focus:ring-primary text-center"
                                    />
                                </div>
                             )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(option.id, item.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 shrink-0 ml-auto sm:ml-0"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ServiceOptionEditor;

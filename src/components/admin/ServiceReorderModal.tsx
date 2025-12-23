import React, { useState, useEffect } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../common/Modal';
import type { Service } from '../../types/service';
import type { ServiceCategory } from '../../hooks/useServiceCategories';
import { useToast } from '../../context/ToastContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline'; // Drag handle icon

// --- Sortable Item ---
interface SortableItemProps {
  id: string;
  service: Service;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, service }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm mb-2 ${isDragging ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mr-3 text-gray-400 hover:text-gray-600 cursor-move touch-none"
        type="button"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3">
          {service.imageUrl && (
            <img src={service.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-gray-100" />
          )}
          <span className="text-gray-800 font-medium">{service.name}</span>
      </div>
      <span className="ml-auto text-xs text-gray-500">
         ${service.price}
      </span>
    </li>
  );
};


// --- Main Component ---
interface ServiceReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  categories: ServiceCategory[];
  initialCategory?: string;
}

const ServiceReorderModal: React.FC<ServiceReorderModalProps> = ({
  isOpen,
  onClose,
  services,
  categories,
  initialCategory
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localServices, setLocalServices] = useState<Service[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected category
  useEffect(() => {
    if (isOpen) {
        if (initialCategory && initialCategory !== 'all') {
            setSelectedCategory(initialCategory);
        } else if (categories.length > 0) {
            setSelectedCategory(categories[0].name); // Default to first category if 'all' passed or needed
        }
    }
  }, [isOpen, initialCategory, categories]);

  // Filter and sort services when category changes
  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'all') return;
    
    const filtered = services
        .filter(s => s.category === selectedCategory)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
    
    setLocalServices(filtered);
  }, [selectedCategory, services]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalServices((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);

    try {
      localServices.forEach((service, index) => {
        const ref = doc(db, 'services', service.id);
        // We only update the order if it's different (optional optimization, but firestore writes are cheap enough here)
        batch.update(ref, { order: index });
      });

      await batch.commit();
      showToast('順序已更新', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="調整服務順序" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Category Selector */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">選擇分類</label>
           <select 
             value={selectedCategory} 
             onChange={(e) => setSelectedCategory(e.target.value)}
             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
           >
              {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
           </select>
        </div>

        {/* DnD List */}
        <div className="bg-gray-50 rounded-lg p-2 min-h-[300px] max-h-[50vh] overflow-y-auto border border-gray-200">
             {localServices.length === 0 ? (
                 <p className="text-center text-gray-400 py-10">此分類無服務項目</p>
             ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={localServices.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul>
                            {localServices.map(service => (
                                <SortableItem key={service.id} id={service.id} service={service} />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
             )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
           >
             取消
           </button>
           <button
             onClick={handleSave}
             disabled={isSaving || localServices.length === 0}
             className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
           >
             {isSaving ? '儲存中...' : '儲存排序'}
           </button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceReorderModal;

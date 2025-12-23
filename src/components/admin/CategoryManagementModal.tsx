import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../common/Modal';
import type { ServiceCategory } from '../../hooks/useServiceCategories';
import type { Service } from '../../types/service';
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
import { Bars3Icon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'; // Consistent icons

// --- Sortable Item Component ---
interface SortableItemProps {
  id: string;
  category: ServiceCategory;
  onEdit: (cat: ServiceCategory) => void;
  onDelete: (cat: ServiceCategory) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, category, onEdit, onDelete }) => {
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
    zIndex: isDragging ? 10 : 1, // Ensure dragging item is on top
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm ${isDragging ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 touch-none"
          type="button"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <span className="text-gray-800 font-medium">{category.name}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="編輯"
        >
           <PencilSquareIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="刪除"
        >
           <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
};

// --- Main Component ---
interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  services: Service[];
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose, categories, services }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Local state for sorting to avoid jitter while waiting for Firestore
  const [items, setItems] = useState<ServiceCategory[]>(categories);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setError(null);
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('分類名稱不能為空');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingCategory) {
        // Update
        if (editingCategory.name !== newCategoryName) {
           const batch = writeBatch(db);
           const categoryRef = doc(db, 'serviceCategories', editingCategory.id);
           batch.update(categoryRef, { name: newCategoryName });

           // Update all services
           const servicesRef = collection(db, 'services');
           const q = query(servicesRef, where('category', '==', editingCategory.name));
           const querySnapshot = await getDocs(q);

           querySnapshot.forEach((doc) => {
             batch.update(doc.ref, { category: newCategoryName });
           });

           await batch.commit();
           showToast(`分類已更新，同步更新了 ${querySnapshot.size} 個相關服務`, 'success');

        } else {
             const categoryRef = doc(db, 'serviceCategories', editingCategory.id);
             await updateDoc(categoryRef, { name: newCategoryName });
             showToast('分類名稱已更新', 'success');
        }
      } else {
        // Add
        // Calculate new order: max order + 1
        const maxOrder = items.reduce((max, item) => Math.max(max, item.order || 0), 0);
        await addDoc(collection(db, 'serviceCategories'), { 
            name: newCategoryName,
            order: maxOrder + 1 
        });
        showToast('分類新增成功', 'success');
      }
      resetForm();
    } catch (err) {
      setError('操作失敗，請稍後再試');
      console.error(err);
      showToast('操作失敗', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: ServiceCategory) => {
    const isCategoryInUse = services.some(service => service.category === category.name);
    if (isCategoryInUse) {
      showToast(`無法刪除分類 "${category.name}"，因為尚有服務項目使用中。`, 'error');
      return;
    }

    if (window.confirm(`確定要刪除分類 "${category.name}" 嗎？`)) {
      try {
        await deleteDoc(doc(db, 'serviceCategories', category.id));
        showToast('刪除成功', 'success');
      } catch (err) {
        showToast('刪除失敗', 'error');
        console.error(err);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
        setItems((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over?.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            
            // Re-assign order based on new index
            // We do this asynchronously to Firestore, but UI updates immediately
            const batch = writeBatch(db);
            newItems.forEach((item, index) => {
                const ref = doc(db, 'serviceCategories', item.id);
                batch.update(ref, { order: index });
            });
            batch.commit().catch(err => {
                console.error("Error updating order:", err);
                showToast("排序儲存失敗", "error");
            });

            return newItems;
        });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="管理服務分類" maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Add/Edit Form */}
        <form onSubmit={handleAddOrUpdate} className="flex items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={editingCategory ? '編輯分類名稱' : '新增分類名稱'}
            className="flex-grow block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:bg-gray-300 transition-colors whitespace-nowrap">
            {isSubmitting ? '...' : (editingCategory ? '更新' : '新增')}
          </button>
          {editingCategory && (
            <button type="button" onClick={resetForm} className="px-4 py-2.5 font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              取消
            </button>
          )}
        </form>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        {/* Sortable Category List */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">分類列表</h4>
              <span className="text-xs text-gray-400">拖曳可調整順序</span>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {items.map(cat => (
                        <SortableItem 
                            key={cat.id} 
                            id={cat.id} 
                            category={cat} 
                            onEdit={(c) => {
                                setEditingCategory(c);
                                setNewCategoryName(c.name);
                            }}
                            onDelete={handleDelete}
                        />
                    ))}
                </ul>
            </SortableContext>
          </DndContext>
          
          {items.length === 0 && (
             <p className="text-center text-gray-400 py-4 text-sm">尚無分類，請上方新增</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManagementModal;

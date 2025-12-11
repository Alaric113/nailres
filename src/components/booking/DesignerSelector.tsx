import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Designer } from '../../types/designer';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface DesignerSelectorProps {
  onDesignerSelect: (designer: Designer) => void;
  selectedDesigner: Designer | null;
}

const DesignerSelector: React.FC<DesignerSelectorProps> = ({ onDesignerSelect, selectedDesigner }) => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesigners = async () => {
      setLoading(true);
      try {
        const designersRef = collection(db, 'designers');
        // Only show active designers
        const q = query(designersRef, where('isActive', '==', true));
        const snap = await getDocs(q);
        const activeDesigners = snap.docs.map(d => ({ id: d.id, ...d.data() } as Designer))
                                        .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
        setDesigners(activeDesigners);
      } catch (err) {
        console.error("Error fetching designers:", err);
        setError("無法載入設計師列表。");
      } finally {
        setLoading(false);
      }
    };
    fetchDesigners();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center p-4">{error}</p>;
  if (designers.length === 0) return <p className="text-gray-500 text-center p-4">目前沒有可預約的設計師。</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-serif font-bold text-gray-900 text-xl text-center mb-6">選擇設計師</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {designers.map(designer => (
            <motion.div
              key={designer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => onDesignerSelect(designer)}
                className={`w-full p-4 rounded-xl shadow-sm border-2 transition-all duration-200 flex flex-col items-center text-center relative
                  ${selectedDesigner?.id === designer.id
                    ? 'border-primary-dark bg-primary/10 ring-2 ring-primary-dark'
                    : 'border-gray-200 bg-white hover:border-primary/50'
                  }
                `}
              >
                {selectedDesigner?.id === designer.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-primary-dark"
                  >
                    <CheckCircleIcon className="w-6 h-6" />
                  </motion.div>
                )}
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 mb-3">
                  {designer.avatarUrl ? (
                    <img src={designer.avatarUrl} alt={designer.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <h4 className="font-bold text-lg text-gray-900">{designer.name}</h4>
                {designer.title && <p className="text-sm text-gray-500">{designer.title}</p>}
                {designer.bio && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{designer.bio}</p>}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesignerSelector;
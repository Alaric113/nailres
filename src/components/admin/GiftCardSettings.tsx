import { useState } from 'react';
import { useGiftCards } from '../../hooks/useGiftCards';
import type { GiftCard } from '../../types/giftcard';
import LoadingSpinner from '../common/LoadingSpinner';
import { CreditCardIcon, TrashIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import ImageUploader from './ImageUploader';

const GiftCardSettings = () => {
    const { giftCards, isLoading, addGiftCard, updateGiftCard, deleteGiftCard } = useGiftCards();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<GiftCard | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isActive, setIsActive] = useState(true);

    const handleOpenAdd = () => {
        setEditingCard(null);
        setName('');
        setDescription('');
        setImageUrl('');
        setIsActive(true);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (card: GiftCard) => {
        setEditingCard(card);
        setName(card.name);
        setDescription(card.description);
        setImageUrl(card.imageUrl || '');
        setIsActive(card.isActive);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('確定要刪除此商品卡嗎？')) {
            await deleteGiftCard(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cardData = { name, description, imageUrl: imageUrl || undefined, isActive };
            if (editingCard) {
                await updateGiftCard(editingCard.id, cardData);
            } else {
                await addGiftCard(cardData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save failed", error);
            alert("儲存失敗，請重試");
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">商品卡管理</h3>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8A8173] transition-colors font-medium text-sm"
                >
                    <PlusIcon className="w-4 h-4" />
                    新增商品卡
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {giftCards.map(card => (
                    <div key={card.id} className={`rounded-xl border-2 overflow-hidden relative group ${card.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
                        {/* Image */}
                        {card.imageUrl ? (
                            <div className="aspect-video w-full bg-gray-100">
                                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                                <CreditCardIcon className="w-12 h-12 text-purple-300" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate">{card.name}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{card.description}</p>
                                </div>
                                {!card.isActive && (
                                    <span className="text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded shrink-0">已停用</span>
                                )}
                            </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpenEdit(card)}
                                className="p-2 bg-white/90 backdrop-blur text-gray-600 hover:text-[#9F9586] rounded-lg shadow-sm"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(card.id)}
                                className="p-2 bg-white/90 backdrop-blur text-gray-600 hover:text-red-500 rounded-lg shadow-sm"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {giftCards.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        目前沒有設定任何商品卡，請點擊上方按鈕新增。
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCard ? '編輯商品卡' : '新增商品卡'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">商品名稱</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
                            placeholder="例如：美甲護理套組"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">商品描述</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border-gray-300 focus:ring-[#9F9586] focus:border-[#9F9586]"
                            placeholder="輸入商品說明..."
                        />
                    </div>

                    <ImageUploader
                        label="商品圖片"
                        imageUrl={imageUrl}
                        onImageUrlChange={setImageUrl}
                        storagePath="giftcards"
                    />

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            className="rounded text-[#9F9586] focus:ring-[#9F9586]"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">啟用此商品卡</label>
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

export default GiftCardSettings;

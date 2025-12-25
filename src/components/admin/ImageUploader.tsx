
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Keep these for types and functions
import { storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT

interface ImageUploaderProps {
  label: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  storagePath: string;
}

import PortfolioImageSelector from './PortfolioImageSelector'; // NEW IMPORT
import { SparklesIcon } from '@heroicons/react/24/outline'; // NEW IMPORT

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, imageUrl, onImageUrlChange, storagePath }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); // NEW STATE
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... existing logic ...
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const oldImageUrl = imageUrl; // Keep track of the old image URL
    const imageRef = ref(storage, `${storagePath}/${uuidv4()}`);
    try {
      const snapshot = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      onImageUrlChange(url);

      // Delete old image only after the new one has been successfully uploaded and URL is updated.
      if (oldImageUrl) {
        // NOTE: If the old image was from portfolio (not uploaded specifically for this service),
        // we might NOT want to delete it from storage? 
        // Ideally we should distinguish, but for now assuming if it's replaced, it's replaced.
        // However, if the old URL is shared (portfolio), deleting it might break other refs?
        // Risk: Low for now as portfolio images are usually persistent. 
        // Refinement: Ideally check if URL contains `portfolio` path vs `services` path?
        // For now, let's keep deletion logic but maybe wrap in try-catch which is already there.
        // ACTUALLY: If the user selects a portfolio image, it has one URL. If they then upload a NEW image, the old portfolio image ref is passed here.
        // If we delete it, the original portfolio item loses its image.
        // FIX: We should ONLY delete if the old image path starts with `storagePath` (e.g. 'services/').
        const oldImageRef = ref(storage, oldImageUrl);
        // Only delete if it matches the current storage bucket/path roughly? 
        // Simplest safety: Don't delete if we switched TO a portfolio image?
        // No, the risk is deleting the OLD image which WAS a portfolio image.
        
        // We will skip explicit deletion automation for now to avoid deleting detailed portfolio assets.
        // Or render a warning? 
        // Let's comment out auto-deletion for safety if we are mixing sources, OR check the path.
        // Assuming service images are in `services/` and portfolio in `portfolio/`.
        if (oldImageUrl.includes(storagePath)) {
            await deleteObject(oldImageRef).catch(console.warn);
        }
      }
      showToast('圖片上傳成功！', 'success');
    } catch (error) {
      console.error("Upload failed:", error);
      showToast('圖片上傳失敗！', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePortfolioSelect = (url: string) => {
      // selecting existing URL, no upload needed
      onImageUrlChange(url);
      // We do NOT delete the old image here automatically because we are just swapping the reference.
      // If the old image was an "orphaned" upload, it stays. This is safer than deleting a shared portfolio image.
      setIsSelectorOpen(false);
  };

  const handleDelete = async () => {
    if (!imageUrl || !window.confirm('您確定要移除這張圖片嗎？')) return;
    // Just clear the reference
    onImageUrlChange('');
    
    // Only delete from storage if it looks like a service-specific upload (matches storagePath)
    if (imageUrl.includes(storagePath)) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            showToast('圖片檔案已刪除！', 'success');
        } catch (error) {
           console.warn("Delete failed or image shared:", error);
        }
    } else {
        showToast('圖片連結已移除 (保留原始檔案)', 'info');
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-500 mb-2 truncate">{label}</label>
      <div className="relative w-full group/container">
        
        <div className={`
          relative w-full h-36 rounded-xl border-2 border-dashed transition-all overflow-hidden bg-gray-50/50
          ${isUploading ? 'border-primary/50 opacity-70' : 'border-gray-200 hover:border-primary/50 hover:bg-white'}
        `}>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-gray-500">上傳中...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full group/image">
                <img src={imageUrl} alt={label} className="w-full h-full object-contain rounded-lg" />
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                   <label htmlFor={`file-replace-${label}`} className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-white cursor-pointer shadow-sm transition-transform active:scale-95" title="更換圖片">
                      <PhotoIcon className="w-4 h-4" />
                      <input id={`file-replace-${label}`} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                   </label>
                   <button onClick={handleDelete} className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-sm transition-transform active:scale-95" title="移除圖片">
                      <TrashIcon className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ) : (
              <div className="text-center w-full space-y-3">
                 <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-primary group-hover/container:scale-110 transition-transform">
                    <PhotoIcon className="w-5 h-5" />
                 </div>
                 
                 <div className="flex flex-col gap-2 w-full max-w-[180px] mx-auto">
                    <label 
                      htmlFor={`file-upload-${label}`} 
                      className="cursor-pointer py-1.5 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm hover:border-primary hover:text-primary transition-all active:scale-95"
                    >
                        選擇檔案
                        <input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>

                    <div className="flex items-center gap-2 text-[10px] text-gray-300 my-0.5">
                       <span className="h-px bg-gray-200 flex-1" />
                       <span className="font-medium">OR</span>
                       <span className="h-px bg-gray-200 flex-1" />
                    </div>

                    <button 
                      onClick={() => setIsSelectorOpen(true)}
                      type="button"
                      className="py-1.5 px-3 bg-[#FAF9F6] border border-[#EFECE5] rounded-lg text-xs font-bold text-[#9F9586] hover:bg-[#9F9586] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <SparklesIcon className="w-3 h-3" />
                      從作品集選取
                    </button>
                 </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Portfolio Selector Modal */}
      <PortfolioImageSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handlePortfolioSelect}
      />
    </div>
  );
};

export default ImageUploader;

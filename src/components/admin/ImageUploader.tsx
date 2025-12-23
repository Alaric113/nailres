
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
      <label className="block text-xs font-medium text-gray-500 mb-1 text-center truncate">{label}</label>
      <div className="mt-1 flex justify-center px-2 py-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors h-32 flex-col items-center justify-center bg-white relative overflow-hidden group/container">
        <div className="space-y-1 text-center w-full h-full flex flex-col items-center justify-center">
          {isUploading ? <p className="text-xs text-gray-500">上傳中...</p> : imageUrl ? (
            <div className="relative group w-full h-full">
              <img src={imageUrl} alt={label} className="w-full h-full object-contain rounded-sm" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleDelete} className="text-white p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <>
              <PhotoIcon className="mx-auto h-6 w-6 text-gray-300" />
              <div className="flex flex-col gap-2 mt-2 w-full px-4">
                  <label htmlFor={`file-upload-${label}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 cursor-pointer text-center bg-indigo-50 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                      <span>上傳新圖片</span>
                      <input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                  
                  {/* OR Divider */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-300">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span>OR</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  {/* Portfolio Button */}
                  <button 
                    onClick={() => setIsSelectorOpen(true)}
                    type="button"
                    className="text-xs font-bold text-[#9F9586] hover:text-white hover:bg-[#9F9586] cursor-pointer text-center bg-[#FAF9F6] py-1.5 rounded-lg border border-[#EFECE5] transition-all flex items-center justify-center gap-1"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    <span>從作品集選擇</span>
                  </button>
              </div>
            </>
          )}
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

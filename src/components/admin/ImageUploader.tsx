
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

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, imageUrl, onImageUrlChange, storagePath }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const oldImageRef = ref(storage, oldImageUrl);
        await deleteObject(oldImageRef).catch(error => {
          // Log error if deletion fails, but new image was uploaded successfully.
          console.warn("Failed to delete old image, but new image was uploaded successfully:", error);
          showToast('舊圖片刪除失敗，新圖片已上傳。', 'warning');
        });
      }
      showToast('圖片上傳成功！', 'success'); // Success toast
    } catch (error) {
      console.error("Upload failed:", error);
      showToast('圖片上傳失敗！', 'error'); // Error toast
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl || !window.confirm('您確定要刪除這張圖片嗎？')) return;
    try {
      const imageRef = ref(storage, imageUrl);
      onImageUrlChange('');
      await deleteObject(imageRef);
      showToast('圖片已成功刪除！', 'success'); // Success toast
    } catch (error) {
      console.error("Delete failed:", error);
      showToast('圖片刪除失敗！', 'error'); // Error toast
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-500 mb-1 text-center truncate">{label}</label>
      <div className="mt-1 flex justify-center px-2 py-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors h-32 flex-col items-center justify-center bg-white relative overflow-hidden">
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
              <div className="flex text-xs text-gray-600 justify-center">
                  <label htmlFor={`file-upload-${label}`} className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-0">
                      <span>上傳</span>
                      <input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;

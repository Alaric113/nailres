import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'; 
import LoadingSpinner from '../common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import PortfolioImageSelector from './PortfolioImageSelector';

interface ImageUploaderProps {
  label: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  storagePath: string;
  compact?: boolean; 
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, imageUrl, onImageUrlChange, storagePath, compact }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(imageUrl);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); 
  const { showToast } = useToast();

  const handleHandleUpload = async (file: File) => {
      setIsUploading(true);
      try {
        const imageRef = ref(storage, `${storagePath}/${uuidv4()}`);
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        const oldImageUrl = imageUrl;
        onImageUrlChange(url);
        setUrlInput(url);

        // Optional: clean up old image logic if needed, but risky if shared.
        // For now we skip auto-delete of old image unless we are sure.
        
        showToast('圖片上傳成功！', 'success');
      } catch (error) {
        console.error("Upload failed:", error);
        showToast('圖片上傳失敗！', 'error');
      } finally {
        setIsUploading(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleHandleUpload(file);
  };

  const handlePortfolioSelect = (url: string) => {
      onImageUrlChange(url);
      setUrlInput(url);
      setIsSelectorOpen(false);
  };

  const handleDelete = () => {
    onImageUrlChange('');
    setUrlInput('');
  };

  // Compact Render Logic
  if (compact) {
    return (
      <div className="w-full flex justify-center flex-col items-center gap-2">
         {/* Simple Upload/Change Button */}
        <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-sm font-semibold text-gray-700 shadow-sm hover:bg-white transition-all transform hover:scale-105 active:scale-95">
          {isUploading ? (
             <LoadingSpinner size="sm" />
          ) : (
            <>
              <PhotoIcon className="w-4 h-4 mr-1.5 text-primary"/>
              {imageUrl ? '更換圖片' : '上傳圖片'}
            </>
          )}
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
        </label>
        
        
        {/* Portfolio Select Link for Compact Mode */}
         <button 
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
            <SparklesIcon className="w-3 h-3 text-amber-500" />
            從作品集選取
        </button>

         <PortfolioImageSelector 
            isOpen={isSelectorOpen}
            onClose={() => setIsSelectorOpen(false)}
            onSelect={handlePortfolioSelect}
        />
      </div>
    );
  }

  // Standard Render Logic
  return (
    <div className="video-recorder p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {imageUrl && (
          <div className="relative shrink-0 group">
            <img src={imageUrl} alt="Uploaded" className="w-24 h-24 object-cover rounded-md border bg-white" />
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="移除圖片"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex-1 w-full">
          {!imageUrl && (
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                    <LoadingSpinner size="sm"/>
                    ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                            <CloudArrowUpIcon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-gray-700">點擊上傳</span> 或拖放</p>
                        <p className="text-xs text-gray-400">PNG, JPG (MAX. 2MB)</p>
                    </>
                    )}
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                </label>
            </div>
          )}
          
          <div className="mt-3 relative flex gap-2">
            <input
              type="text"
              className="flex-1 shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              placeholder="或是輸入圖片 URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={() => { if(urlInput) onImageUrlChange(urlInput) }}
            />
             <button 
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                title="從作品集選取"
            >
                <SparklesIcon className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">從作品集選取</span>
                <span className="sm:hidden">選取</span>
            </button>
          </div>
        </div>
      </div>

      <PortfolioImageSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handlePortfolioSelect}
      />
    </div>
  );
};

export default ImageUploader;

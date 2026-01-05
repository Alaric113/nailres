import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline'; 
import LoadingSpinner from '../common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); 
  const { showToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleHandleUpload = async (file: File) => {
      setIsUploading(true);
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.8,
        };

        const compressedFile = await imageCompression(file, options);
        
        const imageRef = ref(storage, `${storagePath}/${uuidv4()}`);
        const snapshot = await uploadBytes(imageRef, compressedFile);
        const url = await getDownloadURL(snapshot.ref);
        
        onImageUrlChange(url);
        
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
      setIsSelectorOpen(false);
  };

  const handleDelete = () => {
    onImageUrlChange('');
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
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

  // Standard Render Logic - New simplified version
  return (
    <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}
      
      {imageUrl ? (
          // Has Image State
          <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative group shrink-0">
                  <img 
                    src={imageUrl} 
                    alt="Uploaded" 
                    className="w-full sm:w-64 h-40 object-cover rounded-lg border bg-white shadow-sm transition-all group-hover:brightness-95" 
                  />
                  <button
                      onClick={handleDelete}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none shadow-md"
                      title="移除圖片"
                  >
                      <XMarkIcon className="h-4 w-4" />
                  </button>
              </div>
              
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button 
                      type="button"
                      onClick={handleTriggerUpload}
                      disabled={isUploading}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                      {isUploading ? <LoadingSpinner size="sm"/> : <PhotoIcon className="w-4 h-4 text-gray-500" />}
                      {isUploading ? '處理中...' : '更換圖片'}
                  </button>
                  
                  <button 
                      type="button"
                      onClick={() => setIsSelectorOpen(true)}
                      className="px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-lg text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                      <SparklesIcon className="w-4 h-4 text-amber-600" />
                      從作品集選取
                  </button>
              </div>
          </div>
      ) : (
          // No Image State - Big Upload Area
          <div className="flex flex-col gap-3">
            <div 
                onClick={handleTriggerUpload}
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-all group"
            >
                {isUploading ? (
                    <LoadingSpinner size="md"/>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <CloudArrowUpIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="mb-1 text-sm font-semibold text-gray-700">點擊上傳圖片</p>
                        <p className="text-xs text-gray-400">支援 JPG, PNG, WEBP (最大 2MB)</p>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-medium">或</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button 
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="w-full py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
                <SparklesIcon className="w-4 h-4 text-amber-600" />
                從作品集選取
            </button>
          </div>
      )}

      {/* Hidden File Input */}
      <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/*" 
          disabled={isUploading} 
      />

      <PortfolioImageSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handlePortfolioSelect}
      />
    </div>
  );
};

export default ImageUploader;

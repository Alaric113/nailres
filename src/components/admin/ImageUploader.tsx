
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Keep these for types and functions
import { storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import {  TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  label: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  storagePath: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, imageUrl, onImageUrlChange, storagePath }) => {
  const [isUploading, setIsUploading] = useState(false);
  

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Delete old image if it exists
    if (imageUrl) {
      try {
        const oldImageRef = ref(storage, imageUrl);
        await deleteObject(oldImageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Failed to delete old image:", error);
        }
      }
    }

    const imageRef = ref(storage, `${storagePath}/${uuidv4()}`);
    try {
      const snapshot = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      onImageUrlChange(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert('圖片上傳失敗！');
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
      
    } catch (error) {
      console.error("Delete failed:", error);
      alert('圖片刪除失敗！');
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex justify-center px-3 pt-2 pb-3 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {isUploading ? <p>上傳中...</p> : imageUrl ? (
            <div className="relative group">
              <img src={imageUrl} alt={label} className="mx-auto h-32 w-auto rounded-md" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleDelete} className="text-white p-2 bg-red-500 rounded-full"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </div>
          ) : (
            <>
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 justify-center"><label htmlFor={`file-upload-${label}`} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"><span>上傳圖片</span><input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" /></label></div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;

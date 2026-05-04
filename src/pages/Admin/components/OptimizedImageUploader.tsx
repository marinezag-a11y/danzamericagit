import React, { useState, useId } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '../../../lib/upload';

// Global Image Optimization Utility
const optimizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onerror = () => reject(new Error('Erro ao carregar imagem para otimização'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1600;
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

interface OptimizedImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  onAlert: (t: string, m: string, v: 'danger' | 'warning' | 'info') => void;
  label?: string;
  className?: string;
  folder?: string;
}

export function OptimizedImageUploader({ 
  onUploadSuccess, 
  onAlert, 
  label = "Subir Imagem (Otimizada)", 
  className = "", 
  folder = "content" 
}: OptimizedImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const optimizedBlob = await optimizeImage(file);
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const optimizedFile = new File([optimizedBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
      const result = await uploadImage(optimizedFile, folder);
      
      if (result.success && result.url) {
        onUploadSuccess(result.url);
      } else if (!result.success) {
        onAlert('Erro no Upload', result.error || 'Não foi possível subir a imagem.', 'danger');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      onAlert('Erro de Processamento', err.message || 'Erro ao preparar imagem para o servidor.', 'danger');
    }
    setUploading(false);
  };

  return (
    <div className={className}>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id={uploadId}
        disabled={uploading}
      />
      <label 
        htmlFor={uploadId}
        className={`flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border-2 border-dashed border-white/10 hover:border-brand-orange/40 hover:bg-brand-orange/5 text-white/40 hover:text-brand-orange cursor-pointer transition-all rounded-sm group ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Processando Imagem...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
          </>
        )}
      </label>
    </div>
  );
}

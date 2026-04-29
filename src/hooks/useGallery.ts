import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  display_order: number;
}

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, caption: string = '') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { data, error: dbError } = await supabase
        .from('gallery')
        .insert([{ url: publicUrl, caption, display_order: images.length }])
        .select();

      if (dbError) throw dbError;

      setImages(prev => [...prev, data[0]]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteImage = async (id: string, url: string) => {
    try {
      // Extract file path from URL
      const path = url.split('/').pop();
      if (!path) throw new Error('Invalid URL');

      // 1. Delete from Storage
      await supabase.storage.from('gallery').remove([`uploads/${path}`]);

      // 2. Delete from DB
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return { images, loading, error, uploadImage, deleteImage, refresh: fetchImages };
}

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
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
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

  const uploadImage = async (file: File) => {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addImage = async (url: string, caption: string = '') => {
    try {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data, error } = await supabase
        .from('gallery')
        .insert([{ url, caption, display_order: images.length }])
        .select();

      if (error) throw error;
      await fetchImages();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchImages();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return { images, loading, error, addImage, uploadImage, deleteImage, refresh: fetchImages };
}

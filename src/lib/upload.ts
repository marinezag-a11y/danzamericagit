import { supabase } from './supabase';

export async function uploadImage(file: File, folder: string = 'general', customPath?: string) {
  try {
    if (!supabase) throw new Error('Supabase not configured');

    const fileExt = file.name.split('.').pop();
    const fileName = customPath ? customPath : `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = customPath ? customPath : `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

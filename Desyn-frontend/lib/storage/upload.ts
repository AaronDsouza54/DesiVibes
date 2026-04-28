import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

import { supabase } from '@/lib/supabase/client';

export async function uploadImageToSupabase(params: {
  bucket: 'post-images' | 'profile-images';
  path: string; // e.g. `${userId}/${Date.now()}.jpg`
  localUri: string;
  contentType: string; // e.g. image/jpeg
}): Promise<{ publicUrl: string; storagePath: string }> {
  const base64 = await FileSystem.readAsStringAsync(params.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const { data, error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, arrayBuffer, { contentType: params.contentType, upsert: true });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(params.bucket).getPublicUrl(data.path);
  if (!pub.publicUrl) throw new Error('Failed to get public URL');

  return { publicUrl: pub.publicUrl, storagePath: data.path };
}


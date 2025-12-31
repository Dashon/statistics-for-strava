'use server';

import { createClient } from '@/lib/supabase/server';
import { auth } from '@/auth';

export async function uploadProfilePicture(formData: FormData) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  // Basic validation
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size must be less than 2MB');
  }

  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${session.userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-assets')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('Failed to upload image');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-assets')
    .getPublicUrl(filePath);

  return { url: publicUrl };
}

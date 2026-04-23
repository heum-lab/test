import { createClient } from '@/lib/supabase/client';

export const BLOG_BUCKET = 'blog-attachments';

export async function uploadBlogAttachment(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ''}`;

  const { error } = await supabase.storage.from(BLOG_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function getBlogAttachmentUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BLOG_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteBlogAttachment(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BLOG_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

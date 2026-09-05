const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rlawsubbcfphsmqbteby.supabase.co';

export function getStoragePublicUrl(bucket: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export function rewriteStorageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs or Blobs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Relative path starting with /storage/v1/
  if (trimmed.startsWith('/storage/v1/')) {
    return `${SUPABASE_PROJECT_URL}${trimmed}`;
  }

  // 3. Relative path starting with storage/v1/
  if (trimmed.startsWith('storage/v1/')) {
    return `${SUPABASE_PROJECT_URL}/${trimmed}`;
  }

  // 4. Relative path starting with object/public/
  if (trimmed.startsWith('object/public/')) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/${trimmed}`;
  }

  // 5. Replace domain before /storage/v1/ (e.g., api.educontest.uz or educontest.uz or localhost)
  if (trimmed.includes('/storage/v1/')) {
    const fixedUrl = trimmed.replace(/https?:\/\/[^\/]+\/storage\/v1\//, `${SUPABASE_PROJECT_URL}/storage/v1/`);
    return fixedUrl.replace(/\.supabase\.co\.\//g, '.supabase.co/');
  }

  // 6. Full HTTP/HTTPS URLs (Unsplash, external domains, or Supabase project URL)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\.supabase\.co\.\//g, '.supabase.co/');
  }

  // 7. Relative bucket paths (e.g. "/blog-images/xyz.jpg" or "blog-images/xyz.jpg")
  if (trimmed.startsWith('/')) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public${trimmed}`;
  }

  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${trimmed}`;
}

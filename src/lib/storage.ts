const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rlawsubbcfphsmqbteby.supabase.co';

const KNOWN_SUPABASE_BUCKETS = new Set([
  'resources',
  'question-images',
  'course-covers',
  'course-videos',
  'avatars',
  'materials',
  'mistake-images',
  'feedback_images',
  'subject_resources',
  'chat-media',
  'course_files'
]);

export function getStoragePublicUrl(bucket: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export function rewriteStorageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';

  // 1. Data URLs or Blobs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Full HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('/storage/v1/')) {
      const fixedUrl = trimmed.replace(/https?:\/\/[^\/]+\/storage\/v1\//, `${SUPABASE_PROJECT_URL}/storage/v1/`);
      return fixedUrl.replace(/\.supabase\.co\.\//g, '.supabase.co/');
    }
    return trimmed.replace(/\.supabase\.co\.\//g, '.supabase.co/');
  }

  // 3. Relative path starting with /storage/v1/ or storage/v1/
  if (trimmed.startsWith('/storage/v1/')) {
    return `${SUPABASE_PROJECT_URL}${trimmed}`;
  }
  if (trimmed.startsWith('storage/v1/')) {
    return `${SUPABASE_PROJECT_URL}/${trimmed}`;
  }

  // 4. Relative path starting with object/public/
  if (trimmed.startsWith('object/public/')) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/${trimmed}`;
  }
  if (trimmed.startsWith('/object/public/')) {
    return `${SUPABASE_PROJECT_URL}/storage/v1${trimmed}`;
  }

  // 5. Bucket vs Local Static Asset Check
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const firstSegment = cleanPath.split('/')[0]?.toLowerCase();

  if (firstSegment && KNOWN_SUPABASE_BUCKETS.has(firstSegment)) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${cleanPath}`;
  }

  // 6. Local static assets (e.g. "/1.png", "/5.png", "/mascot.png", "/logo.png")
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

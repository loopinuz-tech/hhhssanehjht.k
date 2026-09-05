import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to an SEO-friendly slug.
 * Supports Uzbek Latin characters.
 */
export function slugify(text: string): string {
  if (!text) return "";

  const cyrillicMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'yo', 'Ж': 'zh',
    'З': 'z', 'И': 'i', 'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n', 'О': 'o',
    'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ф': 'f', 'Х': 'kh', 'Ц': 'ts',
    'Ч': 'ch', 'Ш': 'sh', 'Щ': 'shch', 'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'ya'
  };

  const uzbekChars: Record<string, string> = {
    'o‘': 'o', 'o\'': 'o', 'g‘': 'g', 'g\'': 'g', 'oʻ': 'o', 'gʻ': 'g',
    'O‘': 'o', 'O\'': 'o', 'G‘': 'g', 'G\'': 'g', 'Oʻ': 'o', 'Gʻ': 'g'
  };

  let str = text.toString();
  Object.keys(uzbekChars).forEach(key => {
    str = str.replace(new RegExp(key, 'g'), uzbekChars[key]);
  });

  str = str.split('').map(char => cyrillicMap[char] || char).join('');

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generates SEO metadata for a page
 */
export function generateMetadata(title: string, description: string, path: string) {
  const baseUrl = "https://educontest.uz";
  const url = `${baseUrl}${path}`;
  
  return {
    title: `${title} | EduContest`,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      siteName: 'EduContest',
      locale: 'uz_UZ',
      type: 'website',
    }
  };
}

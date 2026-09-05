import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_PUBLIC_URL ||
  process.env.VITE_API_URL ||
  'https://rcxfryjvdkmtbqivbrjg.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGZyeWp2ZGttdGJxaXZicmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTYyMzEsImV4cCI6MjA5MDc5MjIzMX0.8Vs-WG4w4MSw6a3lq0THPR93nuL4TY9oQxadXJ4HqWc';

console.log('SUPABASE_URL:', !!SUPABASE_URL);
console.log('SUPABASE_KEY:', !!SUPABASE_KEY);

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const BASE_URL = 'https://educontest.uz';
const TEACHER_URL = 'https://teacher.educontest.uz';
const MOCK_URL = 'https://mock.educontest.uz';

const PUBLIC_PATH = path.join(process.cwd(), 'public');
const ROOT_PATH = process.cwd();

const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/[‘'’]/g, '')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateSitemap() {
  console.log('Starting full multi-subdomain sitemap generation...');
  const today = new Date().toISOString().split('T')[0];

  let tests = [];
  let courses = [];
  let posts = [];
  let resources = [];
  let subjects = [];
  let mockTests = [];

  try {
    if (supabase) {
      console.log('Fetching dynamic data from Supabase...');
      const [
        { data: tData, error: tErr },
        { data: cData, error: cErr },
        { data: bData, error: bErr },
        { data: rData, error: rErr },
        { data: sData, error: sErr },
        { data: mData, error: mErr }
      ] = await Promise.all([
        supabase.from('test_folders')
          .select('id, name, updated_at, category, subject')
          .eq('is_active', true)
          .limit(5000),

        supabase.from('courses')
          .select('id, title, updated_at, category')
          .limit(1000),

        supabase.from('blog_posts')
          .select('slug, title, excerpt, cover_image_url, updated_at')
          .eq('is_published', true)
          .limit(1000),

        supabase.from('subject_resources')
          .select('id, title, file_url, thumbnail_url, updated_at, subject_name')
          .eq('is_active', true)
          .limit(1000),

        supabase.from('subjects')
          .select('name, updated_at')
          .eq('is_active', true)
          .limit(200),

        supabase.from('mock_tests')
          .select('id, title, subject, slug, questions_count, updated_at')
          .eq('is_active', true)
          .limit(2000)
      ]);

      console.log('tests count:', tData?.length || 0, tErr ? `error: ${tErr.message}` : '');
      console.log('courses count:', cData?.length || 0, cErr ? `error: ${cErr.message}` : '');
      console.log('posts count:', bData?.length || 0, bErr ? `error: ${bErr.message}` : '');
      console.log('resources count:', rData?.length || 0, rErr ? `error: ${rErr.message}` : '');
      console.log('subjects count:', sData?.length || 0, sErr ? `error: ${sErr.message}` : '');
      console.log('mockTests count:', mData?.length || 0, mErr ? `error: ${mErr.message}` : '');

      if (!tErr) tests = tData || [];
      if (!cErr) courses = cData || [];
      if (!bErr) posts = bData || [];
      if (!rErr) resources = rData || [];
      if (!sErr) subjects = sData || [];
      if (!mErr) mockTests = mData || [];

    } else {
      console.warn('Supabase credentials missing. Skipping dynamic route generation.');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    // Static & Landing pages for Main Domain
    const mainStaticPages = [
      { loc: '/', prio: '1.0', freq: 'daily' },
      { loc: '/tests', prio: '0.9', freq: 'daily' },
      { loc: '/blog', prio: '0.9', freq: 'daily' },
      { loc: '/qollanmalar', prio: '0.8', freq: 'weekly' },
      { loc: '/courses', prio: '0.8', freq: 'weekly' },
      { loc: '/mock-tests', prio: '0.8', freq: 'weekly' },
      { loc: '/ball-hisob', prio: '0.7', freq: 'monthly' },
      { loc: '/ai', prio: '0.8', freq: 'weekly' },
      { loc: '/universitetlar', prio: '0.7', freq: 'weekly' },
      { loc: '/offerta', prio: '0.3', freq: 'yearly' },
      { loc: '/privacy', prio: '0.3', freq: 'yearly' },
      { loc: '/terms', prio: '0.3', freq: 'yearly' }
    ];

    mainStaticPages.forEach(p => {
      xml += `\n  <url><loc>${BASE_URL}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.prio}</priority></url>`;
    });

    // Subdomains Landing & Section URLs (mock.educontest.uz & teacher.educontest.uz)
    const subdomainPages = [
      { loc: MOCK_URL + '/', prio: '0.9', freq: 'daily' },
      { loc: MOCK_URL + '/attestatsiya', prio: '0.9', freq: 'daily' },
      { loc: MOCK_URL + '/milliy-sertifikat', prio: '0.9', freq: 'daily' },
      { loc: MOCK_URL + '/dtm', prio: '0.8', freq: 'weekly' },
      { loc: TEACHER_URL + '/', prio: '0.8', freq: 'daily' },
      { loc: TEACHER_URL + '/tests', prio: '0.8', freq: 'weekly' },
      { loc: TEACHER_URL + '/courses', prio: '0.8', freq: 'weekly' },
      { loc: TEACHER_URL + '/builder', prio: '0.7', freq: 'monthly' }
    ];

    subdomainPages.forEach(p => {
      xml += `\n  <url><loc>${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.prio}</priority></url>`;
    });

    // Subjects pages (/tests/:subjectSlug)
    const processedSubjects = new Set();
    subjects?.forEach(sub => {
      if (!sub.name) return;
      const subSlug = slugify(sub.name);
      if (!subSlug || processedSubjects.has(subSlug)) return;
      processedSubjects.add(subSlug);
      xml += `\n  <url><loc>${BASE_URL}/tests/${subSlug}</loc><lastmod>${sub.updated_at?.split('T')[0] || today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    });

    // Subject resources (Qollanmalar) with images
    resources?.forEach(r => {
      if (!r.title) return;
      xml += `\n  <url>`;
      xml += `\n    <loc>${BASE_URL}/qollanmalar</loc>`;
      xml += `\n    <lastmod>${r.updated_at?.split('T')[0] || today}</lastmod>`;
      xml += `\n    <changefreq>monthly</changefreq>`;
      xml += `\n    <priority>0.6</priority>`;
      const imgUrl = r.thumbnail_url || r.file_url;
      if (imgUrl) {
        xml += `\n    <image:image><image:loc>${escapeXml(imgUrl)}</image:loc><image:title>${escapeXml(r.title)}</image:title></image:image>`;
      }
      xml += `\n  </url>`;
    });

    // Blog posts (with cover images for Rich Snippets)
    posts?.forEach(post => {
      if (!post.slug) return;
      xml += `\n  <url>`;
      xml += `\n    <loc>${BASE_URL}/blog/${encodeURIComponent(post.slug)}</loc>`;
      xml += `\n    <lastmod>${post.updated_at?.split('T')[0] || today}</lastmod>`;
      xml += `\n    <changefreq>weekly</changefreq>`;
      xml += `\n    <priority>0.9</priority>`;
      if (post.cover_image_url) {
        xml += `\n    <image:image><image:loc>${escapeXml(post.cover_image_url)}</image:loc><image:title>${escapeXml(post.title)}</image:title></image:image>`;
      }
      xml += `\n  </url>`;
    });

    // Tests (All active folders - topic tests, mock tests, attestatsiya, pedagogik mahorat)
    const processedFolders = new Set();
    tests?.forEach(test => {
      if (!test.name) return;
      const fSlug = slugify(test.name);
      if (!fSlug || processedFolders.has(fSlug)) return;
      processedFolders.add(fSlug);

      const priority = test.category === 'attestatsiya' ? '0.8' : '0.7';
      const loc = `${BASE_URL}/tests/folder/${fSlug}`;
      xml += `\n  <url><loc>${loc}</loc><lastmod>${test.updated_at?.split('T')[0] || today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;

      // Also add details by UUID
      if (test.id) {
        xml += `\n  <url><loc>${BASE_URL}/tests/details/${test.id}</loc><lastmod>${test.updated_at?.split('T')[0] || today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }
    });

    // Courses
    courses?.forEach(course => {
      if (!course.id) return;
      const catSlug = slugify(course.category || 'all');
      xml += `\n  <url><loc>${BASE_URL}/courses/${catSlug}/${course.id}</loc><lastmod>${course.updated_at?.split('T')[0] || today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    });

    // Mock Tests (/mock-tests/:slug & /mock-tests/:slug/info)
    const buildMockTestSlug = (mockTest) => {
      if (mockTest.slug) return mockTest.slug;
      const subSlug = mockTest.subject ? slugify(mockTest.subject) : '';
      const titleSlug = slugify(mockTest.title || '');
      const countStr = mockTest.questions_count ? `${mockTest.questions_count}` : '';
      let parts = [];
      if (subSlug && !titleSlug.startsWith(subSlug)) {
        parts.push(subSlug);
      }
      parts.push(titleSlug);
      if (countStr && !titleSlug.endsWith(countStr)) {
        parts.push(countStr);
      }
      return parts.join('-').replace(/-+/g, '-');
    };

    const processedMockSlugs = new Set();
    mockTests?.forEach(mockTest => {
      if (!mockTest.title && !mockTest.slug) return;
      const mSlug = buildMockTestSlug(mockTest);
      if (!mSlug || processedMockSlugs.has(mSlug)) return;
      processedMockSlugs.add(mSlug);

      const lastMod = mockTest.updated_at?.split('T')[0] || today;

      xml += `\n  <url><loc>${BASE_URL}/mock-tests/${mSlug}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      xml += `\n  <url><loc>${BASE_URL}/mock-tests/${mSlug}/info</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      xml += `\n  <url><loc>${MOCK_URL}/mock-tests/${mSlug}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
      xml += `\n  <url><loc>${MOCK_URL}/mock-tests/${mSlug}/info</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
    });

    xml += '\n</urlset>';

    // Sitemap Index (sitemap_index.xml)
    let sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${MOCK_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${TEACHER_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

    await fs.mkdir(PUBLIC_PATH, { recursive: true });
    await fs.writeFile(path.join(PUBLIC_PATH, 'sitemap.xml'), xml);
    await fs.writeFile(path.join(ROOT_PATH, 'sitemap.xml'), xml);

    await fs.writeFile(path.join(PUBLIC_PATH, 'sitemap_index.xml'), sitemapIndexXml);
    await fs.writeFile(path.join(ROOT_PATH, 'sitemap_index.xml'), sitemapIndexXml);

    await generateRobots();

    console.log('Sitemap, sitemap_index.xml, and robots.txt generated successfully.');
  } catch (err) {
    console.error('Critical error generating sitemap:', err);
    process.exit(1);
  }
}

async function generateRobots() {
  const robots = `User-agent: *
Allow: /

Disallow: /login
Disallow: /register
Disallow: /dashboard
Disallow: /admin
Disallow: /profile
Disallow: /settings
Disallow: /student/

Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap_index.xml
Sitemap: ${MOCK_URL}/sitemap.xml
Sitemap: ${TEACHER_URL}/sitemap.xml`;

  await fs.writeFile(path.join(PUBLIC_PATH, 'robots.txt'), robots);
  await fs.writeFile(path.join(ROOT_PATH, 'robots.txt'), robots);
}

generateSitemap();



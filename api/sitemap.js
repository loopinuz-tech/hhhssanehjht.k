export default async function handler(req, res) {
  const baseUrl = 'https://educontest.uz';
  const today = new Date().toISOString().split('T')[0];

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rlawsubbcfphsmqbteby.supabase.co';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGZyeWp2ZGttdGJxaXZicmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTYyMzEsImV4cCI6MjA5MDc5MjIzMX0.8Vs-WG4w4MSw6a3lq0THPR93nuL4TY9oQxadXJ4HqWc';

  function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
      .replace(/[‘'’]/g, '')
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '').replace(/-+$/, '');
  }

  function escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/tests</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/blog</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/qollanmalar</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/courses</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/mock-tests</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/ball-hisob</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/ai</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/universitetlar</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/offerta</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${baseUrl}/privacy</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${baseUrl}/terms</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
`;

  try {
    const fetchJson = async (url) => {
      const resp = await fetch(url, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      });
      return resp.ok ? await resp.json() : [];
    };

    // Subjects (/tests/:subjectSlug)
    const subjects = await fetchJson(`${supabaseUrl}/rest/v1/subjects?is_active=eq.true&select=name,updated_at&limit=200`);
    const processedSubjects = new Set();
    subjects.forEach(sub => {
      if (!sub.name) return;
      const subSlug = slugify(sub.name);
      if (!subSlug || processedSubjects.has(subSlug)) return;
      processedSubjects.add(subSlug);
      xml += `  <url>
    <loc>${baseUrl}/tests/${subSlug}</loc>
    <lastmod>${sub.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Resources (Qollanmalar) with images
    const resources = await fetchJson(`${supabaseUrl}/rest/v1/subject_resources?is_active=eq.true&select=id,title,file_url,thumbnail_url,updated_at&limit=1000`);
    resources.forEach(r => {
      if (!r.title) return;
      xml += `  <url>
    <loc>${baseUrl}/qollanmalar</loc>
    <lastmod>${r.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>`;
      const imgUrl = r.thumbnail_url || r.file_url;
      if (imgUrl) {
        xml += `\n    <image:image><image:loc>${escapeXml(imgUrl)}</image:loc><image:title>${escapeXml(r.title)}</image:title></image:image>`;
      }
      xml += `\n  </url>\n`;
    });

    // ALL active test folders (Topic tests, Mock tests, Attestatsiya, Pedagogik mahorat)
    const tests = await fetchJson(`${supabaseUrl}/rest/v1/test_folders?is_active=eq.true&select=id,name,updated_at,category,subject&limit=5000`);
    const processedFolders = new Set();
    tests.forEach(test => {
      if (!test.name) return;
      const folderSlug = slugify(test.name);
      if (!folderSlug || processedFolders.has(folderSlug)) return;
      processedFolders.add(folderSlug);

      const lastmod = test.updated_at ? test.updated_at.split('T')[0] : today;
      const priority = test.category === 'attestatsiya' ? 0.8 : 0.7;
      const loc = `${baseUrl}/tests/folder/${folderSlug}`;
      xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>\n`;

      if (test.id) {
        xml += `  <url>
    <loc>${baseUrl}/tests/details/${test.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    });

    // Courses
    const courses = await fetchJson(`${supabaseUrl}/rest/v1/courses?select=id,title,updated_at,category&limit=1000`);
    courses.forEach(course => {
      if (!course.id) return;
      const lastmod = course.updated_at ? course.updated_at.split('T')[0] : today;
      const categorySlug = slugify(course.category || 'all');
      xml += `  <url>
    <loc>${baseUrl}/courses/${categorySlug}/${course.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Subdomains Landing & Section URLs (mock.educontest.uz & teacher.educontest.uz)
    const mockUrl = 'https://mock.educontest.uz';
    const teacherUrl = 'https://teacher.educontest.uz';
    const subdomainPages = [
      { loc: mockUrl + '/', prio: '0.9', freq: 'daily' },
      { loc: mockUrl + '/attestatsiya', prio: '0.9', freq: 'daily' },
      { loc: mockUrl + '/milliy-sertifikat', prio: '0.9', freq: 'daily' },
      { loc: mockUrl + '/dtm', prio: '0.8', freq: 'weekly' },
      { loc: teacherUrl + '/', prio: '0.8', freq: 'daily' },
      { loc: teacherUrl + '/tests', prio: '0.8', freq: 'weekly' },
      { loc: teacherUrl + '/courses', prio: '0.8', freq: 'weekly' },
      { loc: teacherUrl + '/builder', prio: '0.7', freq: 'monthly' }
    ];

    subdomainPages.forEach(p => {
      xml += `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.prio}</priority>
  </url>\n`;
    });

    // Blog posts (with cover images)
    const posts = await fetchJson(`${supabaseUrl}/rest/v1/blog_posts?is_published=eq.true&select=slug,title,cover_image_url,updated_at&limit=1000`);
    posts.forEach(post => {
      if (!post.slug) return;
      xml += `  <url>
    <loc>${baseUrl}/blog/${encodeURIComponent(post.slug)}</loc>
    <lastmod>${post.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
      if (post.cover_image_url) {
        xml += `\n    <image:image><image:loc>${escapeXml(post.cover_image_url)}</image:loc><image:title>${escapeXml(post.title)}</image:title></image:image>`;
      }
      xml += `\n  </url>\n`;
    });

    // Mock Tests (/mock-tests/:slug & /mock-tests/:slug/info)
    function buildMockTestSlug(m) {
      if (m.slug) return m.slug;
      const subSlug = m.subject ? slugify(m.subject) : '';
      const titleSlug = slugify(m.title || '');
      const countStr = m.questions_count ? `${m.questions_count}` : '';
      let parts = [];
      if (subSlug && !titleSlug.startsWith(subSlug)) {
        parts.push(subSlug);
      }
      parts.push(titleSlug);
      if (countStr && !titleSlug.endsWith(countStr)) {
        parts.push(countStr);
      }
      return parts.join('-').replace(/-+/g, '-');
    }

    const mockTests = await fetchJson(`${supabaseUrl}/rest/v1/mock_tests?is_active=eq.true&select=id,title,subject,slug,questions_count,updated_at&limit=2000`);
    const processedMockSlugs = new Set();
    mockTests.forEach(m => {
      if (!m.title && !m.slug) return;
      const mSlug = buildMockTestSlug(m);
      if (!mSlug || processedMockSlugs.has(mSlug)) return;
      processedMockSlugs.add(mSlug);

      const lastmod = m.updated_at ? m.updated_at.split('T')[0] : today;
      xml += `  <url>
    <loc>${baseUrl}/mock-tests/${mSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      xml += `  <url>
    <loc>${baseUrl}/mock-tests/${mSlug}/info</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      xml += `  <url>
    <loc>${mockUrl}/mock-tests/${mSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      xml += `  <url>
    <loc>${mockUrl}/mock-tests/${mSlug}/info</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });
  } catch (error) {
    console.error("Sitemap ishlashida xatolik:", error);
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}


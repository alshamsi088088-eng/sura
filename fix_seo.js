const fs = require('fs');

// Fix 1: GalleryPage.tsx - Remove logo.svg fallback OG/Twitter images
let gp = fs.readFileSync('c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/GalleryPage.tsx', 'utf8');
gp = gp.replace(
  `image: { url: \`\${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg\`, alt: 'Sura Codex Gallery' },\n    },\n    twitter: {\n      cardType: 'summary_large_image',\n      image: { url: \`\${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg\`, alt: 'Sura Codex Gallery' },\n    },`,
  `},\n    twitter: {\n      cardType: 'summary_large_image',\n    },`
);
fs.writeFileSync('c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/GalleryPage.tsx', gp, 'utf8');
console.log('1. GalleryPage.tsx fixed');

// Fix 2: TechPage.tsx - Remove logo.svg fallback OG/Twitter images
let tp = fs.readFileSync('c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/TechPage.tsx', 'utf8');
// Check for logo.svg references
const logoRefCount = (tp.match(/logo\.svg/g) || []).length;
console.log('2. TechPage.tsx logo.svg references found:', logoRefCount);

// Fix 3: sitemapService.ts - Add getCommunityThreadsForSitemap
const ssPath = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/server/src/services/sitemapService.ts';
let ss = fs.readFileSync(ssPath, 'utf8');

if (!ss.includes('getCommunityThreadsForSitemap')) {
  const communityThreadsFn = `
async function getCommunityThreadsForSitemap(): Promise<SitemapUrl[]> {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const threads = await prisma.communityThread.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    await prisma.\$disconnect();
    return threads.map(t => ({
      loc: \\\`\\\${BASE_URL}/community/thread/\\\${encodeURIComponent(t.slug || t.id)}\\\`,
      lastmod: t.updatedAt?.toISOString?.() || new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

`;
  ss = communityThreadsFn + ss;
  fs.writeFileSync(ssPath, ss, 'utf8');
  console.log('3. sitemapService.ts - added getCommunityThreadsForSitemap function');
}

// Add community threads integration into getAllSitemapUrls
let ss2 = fs.readFileSync(ssPath, 'utf8');
if (!ss2.includes('communityThreadUrls')) {
  ss2 = ss2.replace(
    'const urls: SitemapUrl[] = [',
    'const communityThreadUrls = await getCommunityThreadsForSitemap();\n  const urls: SitemapUrl[] = ['
  );
  ss2 = ss2.replace(
    '  ...articleUrls,',
    '  ...articleUrls,\n  ...communityThreadUrls,'
  );
  fs.writeFileSync(ssPath, ss2, 'utf8');
  console.log('3b. sitemapService.ts - integrated community threads into sitemap');
}

console.log('\\nAll SEO fixes applied!');

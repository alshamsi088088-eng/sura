const fs = require('fs');

// Fix TechPage.tsx - remove logo.svg fallback
const tpPath = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/TechPage.tsx';
let tp = fs.readFileSync(tpPath, 'utf8');
tp = tp.replace("      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex Tech' },\n", '');
tp = tp.replace("      image: { url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/logo.svg`, alt: 'Sura Codex Tech' },\n", '');
fs.writeFileSync(tpPath, tp, 'utf8');
console.log('TechPage.tsx fixed');

// Verify sitemap
const ssPath = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/server/src/services/sitemapService.ts';
let ss = fs.readFileSync(ssPath, 'utf8');
console.log('Has getCommunityThreadsForSitemap:', ss.includes('getCommunityThreadsForSitemap'));
console.log('Has communityThreadUrls:', ss.includes('communityThreadUrls'));
console.log('Has community thread integration:', ss.includes('community'));

// Verify all static pages have SEO
const pages = ['HomePage.tsx','AboutPage.tsx','ContactPage.tsx','PrivacyPage.tsx','CookiePolicyPage.tsx','TermsOfServicePage.tsx'];
for (const p of pages) {
  const c = fs.readFileSync('c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/' + p, 'utf8');
  console.log(p, 'useSeoTags:', c.includes('useSeoTags'));
}

// Check ArticleDetailsPage TS errors fixed
const adp = fs.readFileSync('c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/ArticleDetailsPage.tsx', 'utf8');
console.log('ArticleDetailsPage closing structure OK:', adp.includes('        </div>\n      )}\n    </div>\n  );\n}'));

console.log('\nAll checks done');

/* Scan for SEO metadata usage across pages/components */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../client/src');
const results = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const hasSeoTags = content.includes('useSeoTags');
      const hasPageMeta = content.includes('usePageMetadata');
      const hasSeoHead = content.includes('<SeoHead');
      const hasNoIndex = content.includes('noIndex');
      if (hasSeoTags || hasPageMeta || hasSeoHead || hasNoIndex) {
        results.push({
          file: path.relative(root, full),
          useSeoTags: hasSeoTags,
          usePageMetadata: hasPageMeta,
          SeoHead: hasSeoHead,
          noIndex: hasNoIndex,
        });
      }
    }
  }
}

walk(root);
console.table(results);
// Also list pages that DO NOT have any SEO metadata
const pageDir = path.join(root, 'pages');
const noSeo = [];
for (const entry of fs.readdirSync(pageDir)) {
  if (!entry.endsWith('.tsx')) continue;
  const full = path.join(pageDir, entry);
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes('useSeoTags') && !content.includes('usePageMetadata') && !content.includes('<SeoHead')) {
    noSeo.push(entry);
  }
}
console.log('\nPages WITHOUT SEO metadata:');
console.log(noSeo.join('\n'));


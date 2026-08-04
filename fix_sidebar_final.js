const fs = require('fs');
const path = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/components/layout/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find: "text-sura-ivory">{roleLabel(role)}</div>\n\n        <nav"
// Replace with proper closing tags
const target = 'text-sura-ivory/50">{roleLabel(role)}</div>\n          </div>\n\n        <nav className="flex-1 overflow-y-auto p-3">';
const replacement = 'text-sura-ivory/50">{roleLabel(role)}</div>\n            </div>\n          </div>\n        </div>\n\n        <nav className="flex-1 overflow-y-auto p-3">';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('FIXED: Closing tags added');
} else {
  console.log('Target not found. Debugging...');
  const idx = content.indexOf('text-sura-ivory/50"{roleLabel(role)}');
  if (idx < 0) {
    // Try different search
    const idx2 = content.indexOf('roleLabel(role)}');
    if (idx2 >= 0) {
      const ctx = content.substring(idx2, idx2 + 80);
      console.log('Context after roleLabel:', JSON.stringify(ctx));
    }
  }
}

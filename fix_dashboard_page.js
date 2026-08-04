const fs = require('fs');

// Fix DashboardPage.tsx - properly wrap with DashboardLayout
const dp = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/DashboardPage.tsx';
let dc = fs.readFileSync(dp, 'utf8');

// Fix 1: Remove the misplaced DashboardLayout close
dc = dc.replace('      </DashboardLayout>\n\n        <div className="rounded-2xl', '\n        <div className="rounded-2xl');

// Fix 2: Find the final </div> that ends the content area (before the last line with just "  );")
// The last </div> before "  );" is the closing of the main wrapper div
const lastContentDivEnd = dc.lastIndexOf('    </div>');
const afterLastDiv = dc.indexOf('\n  );', lastContentDivEnd);

if (lastContentDivEnd >= 0 && afterLastDiv >= 0) {
  const before = dc.substring(0, lastContentDivEnd);
  const after = dc.substring(lastContentDivEnd);
  
  // Insert DashboardLayout close before the final </div>
  dc = before + '      </DashboardLayout>\n' + after;
  console.log('Fixed DashboardLayout wrapping');
}

fs.writeFileSync(dp, dc, 'utf8');
console.log('DashboardPage.tsx fixed');

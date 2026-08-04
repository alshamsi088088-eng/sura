const fs = require('fs');
const path = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/components/layout/DashboardSidebar.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find the exact location of the corruption - missing closing tags in user profile card
// The issue is: after `<div className="text-xs capitalize text-sura-ivory/50">{roleLabel(role)}</div>`
// There's NO `</div>` (closing min-w-0 flex-1 div) and NO `</div>` (closing flex items-center gap-3 div)

// Strategy: replace the corrupted section between the user card and the nav

const oldSection = `            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sura-ivory">{user?.name || (isArabic ? '\u0645\u0633\u062A\u062E\u062F\u0645' : 'User')}</div>
              <div className="text-xs capitalize text-sura-ivory/50">{roleLabel(role)}</div>
        <nav className="flex-1 overflow-y-auto p-3">`;

const newSection = `            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sura-ivory">{user?.name || (isArabic ? '\u0645\u0633\u062A\u062E\u062F\u0645' : 'User')}</div>
              <div className="text-xs capitalize text-sura-ivory/50">{roleLabel(role)}</div>
          </div>
        <nav className="flex-1 overflow-y-auto p-3">`;

if (content.includes(oldSection)) {
  content = content.replace(oldSection, newSection);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: Fixed missing closing tags');
} else {
  console.log('WARNING: Could not find the exact pattern. Current file content:');
  console.log(content.substring(content.indexOf('min-w-0 flex-1') - 50, content.indexOf('min-w-0 flex-1') + 500));
}
</｜DSML｜parameter>
</｜DSML｜invoke>
</｜DSML｜tool_calls>

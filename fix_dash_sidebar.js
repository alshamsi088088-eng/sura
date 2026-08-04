const fs = require('fs');
const path = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/components/layout/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Replace the truncated end - "className=\"f" near the end
// Replace "          className=\"f" (truncated) with the full closing block
var searchStr = 'className=\"f';
var lastIndex = content.lastIndexOf(searchStr);
if (lastIndex >= 0) {
  var before = content.substring(0, lastIndex);
  var after = content.substring(lastIndex + searchStr.length);
  
  // Rebuild: the searchStr was "          className=\"f" 
  // We need to find the actual indentation. Let's use a regex
  var closingBlock = 'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs text-red-406\">\n          <svg className=\"h-5 w-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={1.8}>\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1\" />\n          </svg>\n        </button>\n      </nav>\n    </div>\n  );\n';
  
  content = before + 'className=\"' + closingBlock;
}

// Fix 2: Fix the user card section (complex)
// Find the pattern where the user card divs are missing the wrapping div and name span
var userCardIssue = 'flex h-10 w-10 items-center justify-center rounded-full bg-[#7F77DD]/20 text-sm font-bold text-[#7F77DD]';
var userCardIdx = content.indexOf(userCardIssue);
if (userCardIdx >= 0) {
  // Find the end of the avatar div and the subsequent text div
  var startSection = content.lastIndexOf('<div', userCardIdx);
  if (startSection >= 0) {
    var sectionEnd = content.indexOf('          </div>', userCardIdx);
    if (sectionEnd >= 0) {
      var beforeSection = content.substring(0, startSection);
      var afterSection = content.substring(sectionEnd + 20); // length of the closing </div> + spaces
      
      var fixedSection = '<div className=\"flex h-10 w-10 items-center justify-center rounded-full bg-[#7F77DD]/20 text-sm font-bold text-[#7F77DD]\">\n              {user?.name?.charAt(0)?.toUpperCase() || \'U\'}\n            </div>\n            <div className=\"min-w-0 flex-1\">\n              <div className=\"truncate text-sm font-semibold text-sura-ivory\">{user?.name || (isArabic ? \'\\u0645\\u0633\\u062A\\u062E\\u062F\\u0645\' : \'User\')}</div>\n              <div className=\"text-xs capitalize text-sura-ivory/50\">{roleLabel(role)}</div>\n            </div>\n          </div>';
      
      content = beforeSection + fixedSection + afterSection;
    }
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dashboard sidebar!');
</｜DSML｜parameter>
</invoke>
</skill>
</tool_call>

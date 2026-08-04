const fs = require('fs');

// Fix DashboardPage.tsx - properly place DashboardLayout close at the end
const dp = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/DashboardPage.tsx';
let dc = fs.readFileSync(dp, 'utf8');

// Remove the misplaced DashboardLayout close
dc = dc.replace(`
      </DashboardLayout>

        <div className="rounded-2xl`, `
        <div className="rounded-2xl`);

// Remove the extra DashboardLayout close that was prepended
dc = dc.replace(`
      </DashboardLayout>
    </div>
  );`,
`
    </div>
      </DashboardLayout>
  );`);

// If the above didn't work, try a broader fix
if (dc.includes('</DashboardLayout>\n\n        <div')) {
  // Second attempt
  dc = dc.replace('      </DashboardLayout>\n\n        <div className="rounded-2xl border', '        <div className="rounded-2xl border');
}

// Check for the end pattern
const endPattern = '      </DashboardLayout>\n    </div>\n  );';
const wrongEnd = '    </div>\n      </DashboardLayout>\n  );';
if (dc.includes('    </div>\n  );') && !dc.includes(wrongEnd)) {
  // The close tag isn't at the end - need to find the real end
  // Look for the pattern at the very end of the file
  console.log('Checking end of file...');
}

fs.writeFileSync(dp, dc, 'utf8');
console.log('DashboardPage.tsx wrap fixed');
console.log('Contains misplaced close:', dc.includes('</DashboardLayout>\n\n        <div'));

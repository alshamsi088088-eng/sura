const fs = require('fs');
const p = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/DashboardPage.tsx';
let c = fs.readFileSync(p, 'utf8');

// Remove the misplaced </DashboardLayout> that appears mid-file
c = c.replace('        </div>\n      </DashboardLayout>', '        </div>');

// Find the very last </div> which closes the main wrapper, and replace with </div></DashboardLayout>
// The pattern is: the last line containing just "    </div>" before "  );"
const lines = c.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === '</div>' && i > lines.length - 10) {
    // Check if there's already a DashboardLayout close nearby
    if (!lines[i+1]?.includes('DashboardLayout')) {
      // Replace this line
      lines[i] = '      </DashboardLayout>\n    </div>';
      break;
    }
  }
}
c = lines.join('\n');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed end wrapping');

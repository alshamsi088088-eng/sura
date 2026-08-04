const fs = require('fs');
const p = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/components/layout/DashboardLayout.tsx';
let c = fs.readFileSync(p, 'utf8');

// Add missing closing div tag
c = c.replace(
  '<DashboardSidebar activeSection={activeSection} onNavigate={onNavigate} />\n        </div>\n\n      {/* Mobile Sidebar Overlay */}',
  '<DashboardSidebar activeSection={activeSection} onNavigate={onNavigate} />\n        </div>\n      </div>\n\n      {/* Mobile Sidebar Overlay */}'
);

fs.writeFileSync(p, c, 'utf8');
console.log('DashboardLayout fixed');

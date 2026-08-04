const fs = require('fs');
const p = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/TODO.md';
let c = fs.readFileSync(p, 'utf8');

c = c.replace('- [ ] Extend', '- [x] Extend');
c = c.replace('- [ ] Update `normalizeRole`', '- [x] Update `normalizeRole`');
c = c.replace('- [ ] Create `client/src/components/layout/DashboardSidebar.tsx`', '- [x] Create `client/src/components/layout/DashboardSidebar.tsx`');
c = c.replace('- [ ] Both components: responsive', '- [x] Both components: responsive');

fs.writeFileSync(p, c, 'utf8');
console.log('TODO.md updated');

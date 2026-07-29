const fs = require('fs');

function fixFooter() {
  const filePath = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/components/layout/Footer.tsx';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the last </footer> tag
  const footerIdx = content.lastIndexOf('</footer>');
  if (footerIdx === -1) {
    console.log('ERROR: Could not find </footer> in Footer.tsx');
    return false;
  }
  
  // Count unclosed div tags inside the JSX return block
  const returnStart = content.indexOf('return (');
  const jsxContent = content.substring(returnStart, footerIdx);
  
  const openDivMatches = jsxContent.match(/<div[\s>]/g);
  const closeDivMatches = jsxContent.match(/<\/div>/g);
  
  const openCount = openDivMatches ? openDivMatches.length : 0;
  const closeCount = closeDivMatches ? closeDivMatches.length : 0;
  const missingCloses = openCount - closeCount;
  
  if (missingCloses <= 0) {
    console.log('Footer.tsx: No missing closing div tags found.');
    return true;
  }
  
  // Take content up to </footer> and add missing closing divs
  let fixed = content.substring(0, footerIdx);
  fixed = fixed.replace(/\s+$/, '');
  
  // Add missing closing div tags with proper indentation
  for (let i = 0; i < missingCloses; i++) {
    fixed += '\n      </div>';
  }
  fixed += '\n    </footer>\n  );\n}\n';

  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log('Footer.tsx fixed successfully (added ' + missingCloses + ' missing </div> tags)');
  return true;
}

function fixHomePage() {
  const filePath = 'c:/Users/ALSHAMSI/Documents/GitHub/sura/client/src/pages/HomePage.tsx';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the last export function closing brace
  const idx = content.lastIndexOf('}\n');
  if (idx === -1) {
    console.log('ERROR: Could not find closing } in HomePage.tsx');
    return false;
  }
  
  // Check if there's trailing content after the last closing brace
  const trailing = content.substring(idx + 2).trim();
  if (!trailing) {
    console.log('HomePage.tsx: No trailing content found, file is clean.');
    return true;
  }
  
  // Remove trailing content after the last valid closing brace
  let fixed = content.substring(0, idx + 2);
  fixed = fixed.replace(/\s+$/, '');
  fixed += '\n';
  
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log('HomePage.tsx fixed successfully (removed trailing content)');
  return true;
}

fixFooter();
fixHomePage();
console.log('Done');


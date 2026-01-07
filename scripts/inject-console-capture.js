const fs = require('fs');
const path = require('path');

function injectScript(htmlPath) {
  if (!fs.existsSync(htmlPath)) return;
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  if (html.includes('dashboard-console-capture.js')) return;
  
  const scriptTag = '<script src="/dashboard-console-capture.js"></script>';
  
  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${scriptTag}\n</head>`);
  } else if (html.includes('<body>')) {
    html = html.replace('<body>', `<body>\n  ${scriptTag}`);
  }
  
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`✓ Injected console capture script into ${htmlPath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.html')) {
      injectScript(filePath);
    }
  });
}

const outDir = path.join(process.cwd(), '.next', 'static');
if (fs.existsSync(outDir)) {
  walkDir(outDir);
}

console.log('Console capture script injection complete!');
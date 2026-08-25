const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/[ \t]*\{isAdmin && \(\s*<span className="admin-label">\{roleLabel\}<\/span>\s*\)\}\r?\n?/, '');
fs.writeFileSync(file, content, 'utf8');

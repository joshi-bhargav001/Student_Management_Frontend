const fs = require('fs');
let file = 'src/pages/teacher/Teacher.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<div className="dashboard-header mb-4">[\s\S]*?<\/div>/, '');
fs.writeFileSync(file, content, 'utf8');

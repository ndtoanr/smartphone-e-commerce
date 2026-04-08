const fs = require('fs');
const files = [
    'd:/Smartphone/frontend/src/index.css',
    'd:/Smartphone/frontend/src/components/Layout/Header.jsx',
    'd:/Smartphone/frontend/src/pages/HomePage.jsx'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/#ee0000/g, '#e31e24');
    content = content.replace(/#ea0b0b/g, '#e31e24');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});

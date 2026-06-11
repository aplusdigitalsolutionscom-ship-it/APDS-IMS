const fs = require('fs');
const path = require('path');
const componentsDir = path.join('src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const full = path.join(componentsDir, file);
    let content = fs.readFileSync(full, 'utf8');
    let orig = content;

    // Based on context, we can usually guess what goes there
    // If it's m => m.id === ), it's modelGuid
    content = content.replace(/m\.id === \)/g, 'm.guid === modelGuid)');
    // Sometimes it's without parens: m.id === ;
    content = content.replace(/m\.id === ;/g, 'm.guid === modelGuid;');
    
    // In Serials.jsx
    content = content.replace(/m\.guid === \)/g, 'm.guid === modelGuid)');
    content = content.replace(/m\.guid === ;/g, 'm.guid === modelGuid;');

    if (orig !== content) {
        fs.writeFileSync(full, content);
        console.log('Fixed syntax error in', file);
    }
});

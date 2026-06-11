const fs = require('fs');
const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace("`${selectedSerials.length} selected from ${modelSerials.length} available`", "{`${selectedSerials.length} selected from ${modelSerials.length} available`}");
fs.writeFileSync(file, code);
console.log("Patched line 798");

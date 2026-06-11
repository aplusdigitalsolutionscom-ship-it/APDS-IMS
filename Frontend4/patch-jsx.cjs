const fs = require('fs');

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `                            <div className="text-xs font-medium text-slate-500">
                              formData.modelId 
    ? \`\${selectedSerials.length} selected from \${modelSerials.length} available\`
    : \`\${modelSerials.length} total serials available across all models\`
                            </div>`;

const replacementStr = `                            <div className="text-xs font-medium text-slate-500">
                              {formData.modelId 
                                ? \`\${selectedSerials.length} selected from \${modelSerials.length} available\`
                                : \`\${modelSerials.length} total serials available across all models\`}
                            </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync(file, code);

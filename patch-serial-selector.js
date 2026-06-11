import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove the old Modal logic
const modalStartStr = '{showSerialSelector && (\\s*<Modal title="Select Serials" onClose={closeSerialSelector} size="lg">\\s*<div className="space-y-4">';
const modalEndStr = '</Modal>\\s*)}';
const fullRegex = new RegExp('\\{showSerialSelector && \\(\\s*<Modal title="Select Serials" onClose=\\{closeSerialSelector\\} size="lg">([\\s\\S]*?)</Modal>\\s*\\)\\}', 'm');

const match = code.match(fullRegex);
if (match) {
  const modalContent = match[1]; // The inner content of the modal
  
  // Remove the old modal
  code = code.replace(fullRegex, '');

  // 2. Insert the full-page view at the start of activeView === 'add_stock'
  const targetStr = `  if (activeView === 'add_stock') {\n    return (`;
  
  const fullPageSerialSelector = `  if (activeView === 'add_stock') {
    if (showSerialSelector) {
      return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Manage Serials</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Select and add serial numbers for the {activeTab} bucket.
              </p>
            </div>
            <button
              onClick={closeSerialSelector}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <CheckCircle2 size={18} />
              Done Selecting
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-6">
              \${modalContent}
            </div>
          </div>
        </div>
      );
    }
    return (`;

  // We need to slightly clean up modalContent because we took it directly, but it's safe.
  // We'll replace the last "Done" button inside modalContent since we have a header button now, but having two is fine or we can remove it.
  let cleanedModalContent = modalContent;
  
  // Optional: remove the bottom "Done" button since we added one to the header.
  cleanedModalContent = cleanedModalContent.replace(/<div className="flex justify-end pt-2">[\s\S]*?<\/div>/, '');

  code = code.replace(targetStr, fullPageSerialSelector.replace('${modalContent}', cleanedModalContent));

  fs.writeFileSync(file, code);
  console.log("Patched successfully.");
} else {
  console.log("Could not find the showSerialSelector modal block.");
}

import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state variable
code = code.replace(/const \[serialSearchTerm, setSerialSearchTerm\] = useState\(''\);/, 
  "const [serialSearchTerm, setSerialSearchTerm] = useState('');\n  const [serialModelFilter, setSerialModelFilter] = useState('');");

// 2. Add to resetAddForm
code = code.replace(/setSerialSearchTerm\(''\);/g, 
  "setSerialSearchTerm('');\n    setSerialModelFilter('');");

// 3. Update modelSerials useMemo
const oldModelSerials = `  const modelSerials = useMemo(() => {
    if (stockCategory !== 'serialized') return [];
    return serials
      .filter((serial) => !hiddenSerialStatuses.has(serial.status))
      .filter((serial) => !formData.modelId || Number(serial.modelId) === Number(formData.modelId))
      .sort((a, b) => String(a.value || a.serialNumber).localeCompare(String(b.value || b.serialNumber)));
  }, [formData.modelId, serials, stockCategory]);`;

const newModelSerials = `  const modelSerials = useMemo(() => {
    if (stockCategory !== 'serialized') return [];
    return serials
      .filter((serial) => !hiddenSerialStatuses.has(serial.status))
      .filter((serial) => !formData.modelId || Number(serial.modelId) === Number(formData.modelId))
      .filter((serial) => !serialModelFilter || Number(serial.modelId) === Number(serialModelFilter))
      .sort((a, b) => String(a.value || a.serialNumber).localeCompare(String(b.value || b.serialNumber)));
  }, [formData.modelId, serials, stockCategory, serialModelFilter]);`;

code = code.replace(oldModelSerials, newModelSerials);

// 4. Update the "Search Available" block in Select Serials
const oldSearchBlock = `<div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs font-bold uppercase text-slate-500">Search Available</div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search by serial..."
                      value={serialSearchTerm}
                      onChange={(e) => setSerialSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>`;

const newSearchBlock = `<div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs font-bold uppercase text-slate-500">Filter & Search</div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={serialModelFilter}
                      onChange={(e) => setSerialModelFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-1/3 bg-slate-50 font-medium"
                    >
                      <option value="">All Models</option>
                      {models.filter(m => isSerializedModel(m.isSerialized)).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by serial..."
                        value={serialSearchTerm}
                        onChange={(e) => setSerialSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>`;

code = code.replace(oldSearchBlock, newSearchBlock);

fs.writeFileSync(file, code);
console.log("Patched filter successfully!");

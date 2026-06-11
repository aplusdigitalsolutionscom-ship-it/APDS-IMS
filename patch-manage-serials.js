import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove openSerialSelector block validation
code = code.replace(/const openSerialSelector = \(\) => \{\s*if \(\!formData\.modelId\) \{\s*Swal\.fire\('Select model', 'Please select a model first\.', 'warning'\);\s*return;\s*\}\s*setShowSerialSelector\(true\);\s*\};/g, 
`const openSerialSelector = () => {
    setShowSerialSelector(true);
  };`);

// 2. Update modelSerials to not filter by modelId if it's empty
const oldModelSerials = `  const modelSerials = useMemo(() => {
    if (stockCategory !== 'serialized' || !formData.modelId) return [];
    return serials
      .filter((serial) => Number(serial.modelId) === Number(formData.modelId))
      .filter((serial) => !hiddenSerialStatuses.has(serial.status))
      .sort((a, b) => String(a.value || a.serialNumber).localeCompare(String(b.value || b.serialNumber)));
  }, [formData.modelId, serials, stockCategory]);`;

const newModelSerials = `  const modelSerials = useMemo(() => {
    if (stockCategory !== 'serialized') return [];
    return serials
      .filter((serial) => !hiddenSerialStatuses.has(serial.status))
      .filter((serial) => !formData.modelId || Number(serial.modelId) === Number(formData.modelId))
      .sort((a, b) => String(a.value || a.serialNumber).localeCompare(String(b.value || b.serialNumber)));
  }, [formData.modelId, serials, stockCategory]);`;

code = code.replace(oldModelSerials, newModelSerials);

// 3. Update addSelectedSerial to auto-set the model
const oldAddSelectedSerial = `  const addSelectedSerial = (serial) => {
    const serialValue = serial?.value || serial?.serialNumber;
    if (!serialValue) return;

    if (selectedSerialValues.includes(serialValue)) {
      Swal.fire('Already selected', \`\${serialValue} is already in the selected list.\`, 'info');
      return;
    }

    syncSelectedSerials([...selectedSerials, serial]);
  };`;

const newAddSelectedSerial = `  const addSelectedSerial = (serial) => {
    const serialValue = serial?.value || serial?.serialNumber;
    if (!serialValue) return;

    if (selectedSerialValues.includes(serialValue)) {
      Swal.fire('Already selected', \`\${serialValue} is already in the selected list.\`, 'info');
      return;
    }

    if (!formData.modelId) {
      const matchedModel = models.find(m => Number(m.id) === Number(serial.modelId));
      if (matchedModel) {
        setFormData(prev => ({
          ...prev,
          modelId: matchedModel.id,
          modelGuid: matchedModel.guid || ''
        }));
        setPickerQuery(matchedModel.name);
      }
    }

    syncSelectedSerials([...selectedSerials, serial]);
  };`;

code = code.replace(oldAddSelectedSerial, newAddSelectedSerial);

// 4. Update the "Manage Serials" button disabled state
code = code.replace(/disabled=\{\!formData\.modelId\}\s*className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600/g, 
  `disabled={stockCategory !== 'serialized'}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600`);

// 5. Update the text showing available serials
code = code.replace(/\{formData\.modelId\s*\?\s*`\$\{selectedSerials\.length\} selected from \$\{modelSerials\.length\} available`\s*:\s*'Select a model first\.'\}/g, 
  `formData.modelId 
    ? \`\${selectedSerials.length} selected from \${modelSerials.length} available\`
    : \`\${modelSerials.length} total serials available across all models\``);

// 6. Update the "Manage Serials" table header and body to include the Model Name
code = code.replace(/<th className="p-3">Serial Number<\/th>\s*<th className="p-3">Current Status<\/th>/g, 
`<th className="p-3">Model Name</th>
                        <th className="p-3">Serial Number</th>
                        <th className="p-3">Current Status</th>`);

code = code.replace(/<td className="p-3 font-mono font-bold text-slate-800">\{val\}<\/td>\s*<td className="p-3"><StatusBadge status=\{s\.status\} \/><\/td>/g, 
`<td className="p-3 font-medium text-slate-600">
                              {models.find(m => Number(m.id) === Number(s.modelId))?.name || 'Unknown'}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{val}</td>
                            <td className="p-3"><StatusBadge status={s.status} /></td>`);

fs.writeFileSync(file, code);
console.log('Patched FbfFbaManagement.jsx successfully');

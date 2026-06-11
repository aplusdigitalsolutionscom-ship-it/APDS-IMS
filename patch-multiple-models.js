import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. In addSelectedSerial, remove the auto-set modelId logic
code = code.replace(/if \(\!formData\.modelId\) \{\s*const matchedModel = models\.find\([^}]+\}\s*\}/, '');

// 2. Hide SearchablePicker if stockCategory === 'serialized'
code = code.replace(/<SearchablePicker\s*key=\{stockCategory\}/, `{stockCategory === 'nonSerialized' && (\n                  <SearchablePicker\n                    key={stockCategory}`);
code = code.replace(/emptyText=\{stockCategory === 'nonSerialized' \? 'No stationery items found' : 'No serialized models found'\}\s*\/>/, `emptyText={'No stationery items found'}\n                  />\n                  )}`);

// 3. Update the text in the "Manage Serials" section (since modelId is no longer used)
const textBlock = `{formData.modelId 
                                ? \`\${selectedSerials.length} selected from \${modelSerials.length} available\`
                                : \`\${modelSerials.length} total serials available across all models\`}`;
code = code.replace(textBlock, `\`\${selectedSerials.length} selected from \${modelSerials.length} available\``);

// 4. Update the submit button disabled condition
code = code.replace(/disabled=\{saving \|\| \!formData\.warehouseGuid \|\| \!stockCategory \|\| \(\!formData\.modelId && \!formData\.itemId\) \|\| \(stockCategory === 'serialized' && selectedSerials\.length === 0\)\}/, 
  `disabled={saving || !formData.warehouseGuid || !stockCategory || (stockCategory === 'nonSerialized' && !formData.itemId) || (stockCategory === 'serialized' && selectedSerials.length === 0)}`);

// 5. Update handleAddStock
const oldHandleAddStockStart = `const handleAddStock = async (event) => {
    event.preventDefault();

    const quantity = Number(formData.quantity);
    const serialNumbers = stockCategory === 'serialized' ? selectedSerialValues : splitSerials(formData.serialNumbers);

    const selectedId = stockCategory === 'nonSerialized' ? formData.itemId : formData.modelId;

    if (!selectedId || !Number.isFinite(quantity) || quantity <= 0) {
      Swal.fire('Missing details', \`Select an \${stockCategory === 'nonSerialized' ? 'item' : 'model'} and enter a valid quantity.\`, 'warning');
      return;
    }`;

const newHandleAddStockStart = `const handleAddStock = async (event) => {
    event.preventDefault();

    if (!stockCategory) {
      Swal.fire('Choose category', 'Select Serialized or Non-Serialized first.', 'warning');
      return;
    }

    if (stockCategory === 'serialized') {
      if (selectedSerials.length === 0) {
        Swal.fire('Missing serials', 'Please select at least one serial number.', 'warning');
        return;
      }

      setSaving(true);
      try {
        // Group by modelId
        const groups = {};
        for (const serial of selectedSerials) {
          if (!groups[serial.modelId]) groups[serial.modelId] = [];
          groups[serial.modelId].push(serial.value || serial.serialNumber);
        }

        let totalAdded = 0;
        for (const mId of Object.keys(groups)) {
          const snums = groups[mId];
          const matchedModel = models.find(m => Number(m.id) === Number(mId));
          
          await printerService.addFbfFbaStock({
            modelId: Number(mId),
            modelGuid: matchedModel?.guid || null,
            itemId: null,
            itemKind: 'serialized',
            type: activeTab,
            warehouseGuid: formData.warehouseGuid || null,
            quantity: snums.length,
            serialNumbers: snums,
            createdBy: currentUser?.username || 'System'
          });
          totalAdded += snums.length;
        }

        setActiveModal(null);
        resetAddForm();
        await fetchStock();
        Swal.fire('Stock added', \`Successfully moved \${totalAdded} serials across \${Object.keys(groups).length} models to \${activeTab}.\`, 'success');
      } catch (err) {
        Swal.fire('Add stock failed', err.message || 'Please try again.', 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    const quantity = Number(formData.quantity);
    const serialNumbers = splitSerials(formData.serialNumbers);
    const selectedId = formData.itemId;

    if (!selectedId || !Number.isFinite(quantity) || quantity <= 0) {
      Swal.fire('Missing details', 'Select an item and enter a valid quantity.', 'warning');
      return;
    }`;

code = code.replace(oldHandleAddStockStart, newHandleAddStockStart);

// Let's remove the rest of the old serialized validation from handleAddStock
code = code.replace(/if \(!stockCategory\) \{\s*Swal\.fire\('Choose category', 'Select Serialized or Non-Serialized first\.', 'warning'\);\s*return;\s*\}/, '');
code = code.replace(/if \(stockCategory === 'serialized' && serialNumbers\.length !== quantity\) \{\s*Swal\.fire\([\s\S]*?\);\s*return;\s*\}/, '');

fs.writeFileSync(file, code);
console.log("Patched successfully!");

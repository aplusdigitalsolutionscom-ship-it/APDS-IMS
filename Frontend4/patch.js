import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

// Replace state
code = code.replace(/const \[activeModal, setActiveModal\] = useState\(null\);/, 
  "const [activeModal, setActiveModal] = useState(null);\n  const [activeView, setActiveView] = useState('list');");

// Replace openAddModal
code = code.replace(/const openAddModal = \(\) => \{\s*resetAddForm\(\);\s*setFormData\(\(prev\) => \(\{ \.\.\.prev, warehouseGuid: '' \}\)\);\s*setSelectedWhState\(''\);\s*setSerialViewItem\(null\);\s*setActiveModal\(modalTypes\.WAREHOUSE_SELECT\);\s*\};/m, 
  `const openAddModal = () => {
    resetAddForm();
    setFormData((prev) => ({ ...prev, warehouseGuid: '' }));
    setSelectedWhState('');
    setSerialViewItem(null);
    setActiveView('add_stock');
  };`);

// Insert the add_stock view logic before the main return statement
const returnStatementIndex = code.indexOf('  return (\n    <div className="space-y-6 text-slate-900">');

if (returnStatementIndex > -1) {
  const addStockViewCode = `
  if (activeView === 'add_stock') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Add Stock to {activeTab}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Select a warehouse, pick your stock category, and assign serials or quantities.
            </p>
          </div>
          <button
            onClick={() => { setActiveView('list'); resetAddForm(); }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <X size={18} />
            Cancel
          </button>
        </div>

        <form onSubmit={async (e) => {
          await handleAddStock(e);
          if (e.defaultPrevented !== true && document.querySelector('.swal2-container')) {
            // let swal handle
          } else {
             setActiveView('list');
          }
        }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Location */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">1</div>
                <h3 className="text-lg font-bold text-slate-900">Select Location</h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">State</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    value={selectedWhState}
                    onChange={(e) => {
                      setSelectedWhState(e.target.value);
                      setFormData(prev => ({ ...prev, warehouseGuid: '' }));
                    }}
                  >
                    <option value="">-- Select a State --</option>
                    {[...new Set(warehouses.filter(w => w.platform === activeTab).map(w => w.state))].map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {selectedWhState && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Warehouse Name</label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      value={formData.warehouseGuid || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, warehouseGuid: e.target.value }))}
                    >
                      <option value="">-- Select a Warehouse --</option>
                      {warehouses
                        .filter(w => w.platform === activeTab && w.state === selectedWhState)
                        .map(w => (
                          <option key={w.guid} value={w.guid}>{w.warehouseName}</option>
                        ))}
                    </select>
                  </div>
                )}

                {formData.warehouseGuid && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Warehouse Address</label>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600 flex gap-3">
                      <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                      <p>{warehouses.find(w => w.guid === formData.warehouseGuid)?.warehouseAddress || 'No address provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Category */}
            <div className={\`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity duration-300 \${!formData.warehouseGuid ? 'opacity-50 pointer-events-none' : ''}\`}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">2</div>
                <h3 className="text-lg font-bold text-slate-900">Stock Category</h3>
              </div>
              <div className="p-5 grid gap-3 sm:grid-cols-2">
                <CategoryChoice
                  icon={Barcode}
                  title="Serialized"
                  description="Serial tracking"
                  active={stockCategory === 'serialized'}
                  onClick={() => {
                    setStockCategory('serialized');
                    setPickerQuery('');
                    setBarcodeInput('');
                    setSerialSearchTerm('');
                    setSelectedSerials([]);
                    setFormData(prev => ({ ...prev, modelId: '', modelGuid: '', itemId: '', quantity: 1, serialNumbers: '' }));
                  }}
                />
                <CategoryChoice
                  icon={Boxes}
                  title="Non-Serialized"
                  description="Quantity tracking"
                  active={stockCategory === 'nonSerialized'}
                  onClick={() => {
                    setStockCategory('nonSerialized');
                    setPickerQuery('');
                    setBarcodeInput('');
                    setSerialSearchTerm('');
                    setSelectedSerials([]);
                    setFormData(prev => ({ ...prev, modelId: '', modelGuid: '', itemId: '', quantity: 1, serialNumbers: '' }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Step 3: Details */}
            <div className={\`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-opacity duration-300 \${(!formData.warehouseGuid || !stockCategory) ? 'opacity-50 pointer-events-none' : ''}\`}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">3</div>
                <h3 className="text-lg font-bold text-slate-900">Stock Details</h3>
              </div>
              
              {!stockCategory ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                  <Package size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">Select a stock category in Step 2 to continue.</p>
                </div>
              ) : (
                <div className="p-5 space-y-6 flex-1 flex flex-col">
                  <SearchablePicker
                    key={stockCategory}
                    label={stockCategory === 'nonSerialized' ? 'Item Name' : 'Model'}
                    placeholder={stockCategory === 'nonSerialized' ? 'Search and select stationery item' : 'Search and select model'}
                    options={pickerOptions}
                    query={pickerQuery}
                    selectedOption={selectedPickerOption}
                    onQueryChange={(value) => {
                      setPickerQuery(value);
                      setBarcodeInput('');
                      setSerialSearchTerm('');
                      setSelectedSerials([]);
                      setShowSerialSelector(false);
                      setFormData((prev) => ({ ...prev, modelId: '', modelGuid: '', itemId: '' }));
                    }}
                    onSelect={(option) => {
                      setPickerQuery(option.title);
                      setBarcodeInput('');
                      setSerialSearchTerm('');
                      setSelectedSerials([]);
                      setFormData((prev) => ({
                        ...prev,
                        modelId: stockCategory === 'serialized' ? option.id : '',
                        modelGuid: stockCategory === 'serialized' ? option.guid || '' : '',
                        itemId: stockCategory === 'nonSerialized' ? option.id : '',
                        quantity: 1,
                        serialNumbers: ''
                      }));
                      if (stockCategory === 'serialized') {
                        setShowSerialSelector(true);
                      }
                    }}
                    emptyText={stockCategory === 'nonSerialized' ? 'No stationery items found' : 'No serialized models found'}
                  />

                  {stockCategory === 'nonSerialized' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                  )}

                  {stockCategory === 'serialized' && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-black text-slate-800">Serial Numbers</div>
                            <div className="text-xs font-medium text-slate-500">
                              {formData.modelId
                                ? \`\${selectedSerials.length} selected from \${modelSerials.length} available\`
                                : 'Select a model first.'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={openSerialSelector}
                            disabled={!formData.modelId}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Barcode size={17} />
                            Manage Serials
                          </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
                          {selectedSerials.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 text-center">
                              <Barcode size={32} className="mb-3 opacity-20" />
                              <p className="text-sm font-medium">No serials selected yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedSerials.map((serial) => {
                                const serialValue = serial.value || serial.serialNumber;
                                return (
                                  <div key={serialValue} className="flex items-center justify-between gap-3 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="min-w-0">
                                      <div className="break-all font-mono text-xs font-bold text-slate-800">{serialValue}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedSerial(serialValue)}
                                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 shrink-0"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end mt-auto">
                    <button
                      type="submit"
                      disabled={saving || !formData.warehouseGuid || !stockCategory || (!formData.modelId && !formData.itemId) || (stockCategory === 'serialized' && selectedSerials.length === 0)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      Submit Stock to {activeTab}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {showSerialSelector && (
          <Modal title="Select Serials" onClose={closeSerialSelector} size="lg">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-800">{selectedPickerOption?.title || 'Selected model'}</div>
                  <div className="text-xs font-medium text-slate-500">
                    Pick serial numbers for {activeTab}.
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    Selected {selectedSerials.length}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs font-bold uppercase text-slate-500">Scan / Add</div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Scan barcode..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleBarcodeSubmit(e); } }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                    <button type="button" onClick={handleBarcodeSubmit} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Scanned serials are auto-selected.</p>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
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
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                {filteredSerials.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-500">No matching serials found.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs font-bold uppercase text-slate-500 shadow-sm">
                      <tr>
                        <th className="p-3">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={filteredSerials.length > 0 && filteredSerials.every((s) => selectedSerialValues.includes(s.value || s.serialNumber))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newToAdd = filteredSerials.filter((s) => !selectedSerialValues.includes(s.value || s.serialNumber));
                                setSelectedSerials((prev) => [...prev, ...newToAdd]);
                              } else {
                                const filteredValues = filteredSerials.map((s) => s.value || s.serialNumber);
                                setSelectedSerials((prev) => prev.filter((s) => !filteredValues.includes(s.value || s.serialNumber)));
                              }
                            }}
                          />
                        </th>
                        <th className="p-3">Serial Number</th>
                        <th className="p-3">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredSerials.map((s) => {
                        const val = s.value || s.serialNumber;
                        const isSelected = selectedSerialValues.includes(val);
                        return (
                          <tr key={val} className={\`transition \${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}\`}>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    removeSelectedSerial(val);
                                  } else {
                                    setSelectedSerials((prev) => [...prev, s]);
                                  }
                                }}
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{val}</td>
                            <td className="p-3"><StatusBadge status={s.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={closeSerialSelector}
                  className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }
`;
  code = code.substring(0, returnStatementIndex) + addStockViewCode + code.substring(returnStatementIndex);
}

// Modify handleAddStock to set activeView back to list on success
code = code.replace(/setSaving\(false\);\n\s*\}\n\s*\};\n\n\s*const handleSellStock = /m,
  "setSaving(false);\n      setActiveView('list');\n    }\n  };\n\n  const handleSellStock = ");

fs.writeFileSync(file, code);

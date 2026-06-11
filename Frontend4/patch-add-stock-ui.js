import fs from 'fs';

const file = 'd:/printer 13/printer 10-444/Fullstack/FRONTEND-MONGO/src/components/FbfFbaManagement.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /<form onSubmit=\{async \(e\) => \{[\s\S]*?<\/form>/;

const newForm = `<form onSubmit={async (e) => {
          await handleAddStock(e);
          if (e.defaultPrevented !== true && document.querySelector('.swal2-container')) {
            // let swal handle
          } else {
             setActiveView('list');
          }
        }} className="max-w-3xl mx-auto space-y-6">
          
          {/* Step 1: Location */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-black text-indigo-600 ring-4 ring-indigo-50/50">1</div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Select Location</h3>
                <p className="text-sm font-medium text-slate-500">Choose the warehouse where the stock is stored.</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">State</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
                  <label className="mb-2 block text-sm font-bold text-slate-700">Warehouse Name</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
            </div>

            {formData.warehouseGuid && (
              <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="mb-2 block text-sm font-bold text-slate-700">Warehouse Address</label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 flex gap-3">
                  <MapPin className="text-slate-400 shrink-0 mt-0.5" size={18} />
                  <p>{warehouses.find(w => w.guid === formData.warehouseGuid)?.warehouseAddress || 'No address provided'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Category */}
          <div className={\`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 transition-all duration-300 \${!formData.warehouseGuid ? 'opacity-50 blur-[1px] pointer-events-none' : ''}\`}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-black text-indigo-600 ring-4 ring-indigo-50/50">2</div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Stock Category</h3>
                <p className="text-sm font-medium text-slate-500">Select the type of inventory to add.</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <CategoryChoice
                icon={Barcode}
                title="Serialized Items"
                description="Printers or items with serial numbers"
                active={stockCategory === 'serialized'}
                onClick={() => {
                  setStockCategory('serialized');
                  setPickerQuery('');
                  setBarcodeInput('');
                  setSerialSearchTerm('');
                  setSerialModelFilter('');
                  setSelectedSerials([]);
                  setFormData(prev => ({ ...prev, modelId: '', modelGuid: '', itemId: '', quantity: 1, serialNumbers: '' }));
                }}
              />
              <CategoryChoice
                icon={Boxes}
                title="Non-Serialized"
                description="Stationery or bulk quantity items"
                active={stockCategory === 'nonSerialized'}
                onClick={() => {
                  setStockCategory('nonSerialized');
                  setPickerQuery('');
                  setBarcodeInput('');
                  setSerialSearchTerm('');
                  setSerialModelFilter('');
                  setSelectedSerials([]);
                  setFormData(prev => ({ ...prev, modelId: '', modelGuid: '', itemId: '', quantity: 1, serialNumbers: '' }));
                }}
              />
            </div>
          </div>

          {/* Step 3: Details */}
          <div className={\`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 transition-all duration-300 \${(!formData.warehouseGuid || !stockCategory) ? 'opacity-50 blur-[1px] pointer-events-none' : ''}\`}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-black text-indigo-600 ring-4 ring-indigo-50/50">3</div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Stock Details</h3>
                <p className="text-sm font-medium text-slate-500">Add items or scan serial numbers.</p>
              </div>
            </div>
            
            {!stockCategory ? (
              <div className="flex flex-col items-center justify-center text-slate-400 py-6 text-center">
                <Package size={42} className="mb-4 opacity-20" />
                <p className="font-medium text-sm">Select a stock category in Step 2 to continue.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stockCategory === 'nonSerialized' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                    <SearchablePicker
                      key={stockCategory}
                      label={'Item Name'}
                      placeholder={'Search and select stationery item'}
                      options={pickerOptions}
                      query={pickerQuery}
                      selectedOption={selectedPickerOption}
                      onQueryChange={(value) => {
                        setPickerQuery(value);
                        setFormData((prev) => ({ ...prev, itemId: '' }));
                      }}
                      onSelect={(option) => {
                        setPickerQuery(option.title);
                        setFormData((prev) => ({
                          ...prev,
                          itemId: option.id,
                          quantity: 1
                        }));
                      }}
                      emptyText={'No stationery items found'}
                    />
                    
                    <div>
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-slate-700">Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                          className="w-full sm:w-1/2 lg:w-1/3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {stockCategory === 'serialized' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                      <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-black text-slate-900">Serial Numbers</div>
                          <div className="text-xs font-medium text-slate-500 mt-1">
                            {\`\${selectedSerials.length} selected from \${modelSerials.length} available\`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openSerialSelector}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-600 transition-all focus:ring-4 focus:ring-indigo-500/30 active:scale-[0.98]"
                        >
                          <Barcode size={18} />
                          Manage Serials
                        </button>
                      </div>

                      <div className="p-5 max-h-[350px] overflow-y-auto">
                        {selectedSerials.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-slate-400 py-8 text-center">
                            <Barcode size={36} className="mb-3 opacity-20" />
                            <p className="text-sm font-semibold text-slate-500">No serials selected yet.</p>
                            <p className="text-xs font-medium mt-1 text-slate-400">Click Manage Serials to add printers.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedSerials.map((serial) => {
                              const serialValue = serial.value || serial.serialNumber;
                              return (
                                <div key={serialValue} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 group transition hover:border-slate-300">
                                  <div className="min-w-0">
                                    <div className="truncate font-mono text-xs font-bold text-slate-800">{serialValue}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedSerial(serialValue)}
                                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0"
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
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving || !formData.warehouseGuid || !stockCategory || (stockCategory === 'nonSerialized' && !formData.itemId) || (stockCategory === 'serialized' && selectedSerials.length === 0)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-black text-white shadow-md hover:bg-indigo-700 hover:shadow-lg focus:ring-4 focus:ring-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Confirm & Add Stock
              </button>
            </div>
          </div>
        </form>`;

if (regex.test(code)) {
  code = code.replace(regex, newForm);
  fs.writeFileSync(file, code);
  console.log("UI updated successfully.");
} else {
  console.log("Could not find form block.");
}

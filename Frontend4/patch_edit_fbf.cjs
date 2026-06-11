const fs = require('fs');

let content = fs.readFileSync('src/components/FbfFbaManagement.jsx', 'utf8');

// 1. Add EDIT to modalTypes
content = content.replace(
  "DETAILS: 'details'",
  "DETAILS: 'details',\n  EDIT: 'edit'"
);

// 2. Add editData state
content = content.replace(
  "const [sellData, setSellData] = useState({",
  `const [editData, setEditData] = useState({
    guid: '',
    warehouseGuid: '',
    quantity: '',
    itemKind: ''
  });
  const [sellData, setSellData] = useState({`
);

// 3. Add openEditModal and handleEditSubmit
content = content.replace(
  "const openDetailsModal = useCallback((item) => {",
  `const openEditModal = useCallback((item) => {
    setEditData({
      guid: item.guid,
      warehouseGuid: item.warehouseGuid || '',
      quantity: item.quantity,
      itemKind: item.itemKind || (item.activeSerials ? 'serialized' : 'nonSerialized')
    });
    setActiveModal(modalTypes.EDIT);
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      await printerService.put(\`/fbf-fba/stock/\${editData.guid}\`, {
        warehouseGuid: editData.warehouseGuid,
        quantity: editData.itemKind === 'nonSerialized' ? editData.quantity : undefined
      });
      Swal.fire('Success', 'Stock updated successfully', 'success');
      closeModal();
      fetchStock();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDetailsModal = useCallback((item) => {`
);

// 4. Update the Action buttons in the table
content = content.replace(
  /<td className="px-4 py-3 text-right">[\s\S]*?<\/td>/,
  `<td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openSellModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <ArrowDownRight size={14} />
                          Sell Out
                        </button>
                      </div>
                    </td>`
);

// 5. Add the Edit Modal UI at the end
const editModalUI = `
      {activeModal === modalTypes.EDIT && (
        <Modal title="Edit Stock Record" onClose={closeModal} size="md">
          <form onSubmit={handleEditSubmit} className="space-y-4 p-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Warehouse</label>
              <select
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={editData.warehouseGuid}
                onChange={(e) => setEditData(prev => ({ ...prev, warehouseGuid: e.target.value }))}
              >
                <option value="">-- Select a Warehouse --</option>
                {warehouses.map(w => (
                  <option key={w.guid} value={w.guid}>{w.warehouseName}</option>
                ))}
              </select>
            </div>

            {editData.itemKind === 'nonSerialized' && (
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editData.quantity}
                  onChange={(e) => setEditData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !editData.warehouseGuid}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
`;

content = content.replace(
  "    </div>\n  );\n}\n\nfunction CategoryChoice",
  editModalUI + "    </div>\n  );\n}\n\nfunction CategoryChoice"
);

fs.writeFileSync('src/components/FbfFbaManagement.jsx', content);
console.log('FbfFbaManagement.jsx updated');

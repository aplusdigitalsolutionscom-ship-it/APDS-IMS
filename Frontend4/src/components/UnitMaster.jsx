import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { Edit2, Trash2, Plus, Loader2, Ruler } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "import.meta.env.VITE_API_URL";

const UnitMaster = () => {
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitDesc, setUnitDesc] = useState("");
  const [baseUnitQty, setBaseUnitQty] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const getHeaders = () => {
    const token = localStorage.getItem("pt_auth_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUnits = async (page = currentPage, limit = pageSize) => {
    setTableLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/Inventory/GetUnitList`, {
        params: { page, limit },
        headers: getHeaders(),
      });
      setUnits(response.data?.data || []);
      setTotalRecords(response.data?.total || 0);
    } catch (error) {
      console.error(error);
      setUnits([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchUnits(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleSaveUnit = async () => {
    if (!(unitName || "").trim() || !baseUnitQty) {
      Swal.fire("Warning", "Unit name and base quantity are required", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        UnitId: unitId || "0",
        UnitName: (unitName || "").trim(),
        UnitDesc: (unitDesc || "").trim(),
        BaseUnitQty: Number(baseUnitQty)
      };
      
      const res = await axios.post(
        `${API_BASE_URL}/Inventory/SaveOrUpdateUnit`,
        payload,
        { headers: getHeaders() }
      );
      
      if (res.data?.message === "Success") {
        Swal.fire("Success", `Unit ${unitId ? 'updated' : 'saved'} successfully`, "success");
        resetForm();
        fetchUnits();
      } else {
        Swal.fire("Error", res.data?.message || "Failed to save unit", "error");
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong";
      Swal.fire("Error", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = (id) => {
    Swal.fire({
      title: "Delete unit?",
      text: "Are you sure you want to delete this unit?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setTableLoading(true);
        try {
          const res = await axios.post(`${API_BASE_URL}/Inventory/DeleteUnit`, 
            { unitId: id }, 
            { headers: getHeaders() }
          );
          if (res.data?.message === "Success" || !res.data?.message) {
            Swal.fire("Deleted", "Unit deleted successfully", "success");
            fetchUnits();
          } else {
            Swal.fire("Error", res.data?.message || "Failed to delete unit", "error");
          }
        } catch (error) {
          console.error(error);
          const errorMsg = error.response?.data?.message || error.message || "Something went wrong";
          Swal.fire("Error", errorMsg, "error");
        } finally {
          setTableLoading(false);
        }
      }
    });
  };

  const handleEdit = (unit) => {
    setUnitId(unit.unitId || "");
    setUnitName(unit.unitName || "");
    setUnitDesc(unit.unitDescription || "");
    setBaseUnitQty(unit.baseUnitQty || "");
  };

  const resetForm = () => {
    setUnitId("");
    setUnitName("");
    setUnitDesc("");
    setBaseUnitQty("");
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 min-h-screen">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Ruler size={28} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Unit Master</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage units of measurement (PCS, PKT, CTN)</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit Name</label>
              <input
                type="text"
                value={unitName || ""}
                onChange={(e) => setUnitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUnit()}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="PCS / PKT / CTN"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
              <input
                type="text"
                value={unitDesc || ""}
                onChange={(e) => setUnitDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUnit()}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="Pieces / Packet"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Base Unit Qty</label>
              <input
                type="number"
                value={baseUnitQty || ""}
                onChange={(e) => setBaseUnitQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUnit()}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="1 / 10 / 100"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
            {unitId && (
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSaveUnit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex flex-1 lg:flex-none items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {unitId ? "Update" : "Save Unit"}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Sr. No.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Qty</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">Action</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-slate-100">
              {units.length > 0 ? (
                units.map((unit, index) => (
                  <tr key={unit.unitId || index} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-600">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="py-4 px-6 text-sm font-bold text-indigo-700">
                      <span className="bg-indigo-50 px-2 py-1 rounded">
                        {unit.unitName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">{unit.unitDescription || "-"}</td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-800">{unit.baseUnitQty}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(unit)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors tooltip"
                          title="Edit Unit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUnit(unit.unitId)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors tooltip"
                          title="Delete Unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 px-6 text-center">
                    {tableLoading ? (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-sm font-medium">Loading units...</span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-500">No units found</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, totalRecords)}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> entries
              </span>
              
              <div className="flex items-center gap-2">
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-600 outline-none focus:border-indigo-400 transition-all cursor-pointer"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[5, 10, 25, 50, 100].map(val => (
                    <option key={val} value={val}>{val} per page</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalRecords / pageSize)) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-white hover:text-indigo-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                    );
                })}
              </div>

              <button 
                disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitMaster;

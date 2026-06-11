import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { Edit2, Trash2, Plus, Loader2, Store, FileText } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "import.meta.env.VITE_API_URL";

const VendorMaster = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [vendorFirmName, setVendorFirmName] = useState("");
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

  const fetchVendors = async (page = currentPage, limit = pageSize) => {
    setTableLoading(true);
    try {
      const [vendorResponse, catResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/Inventory/GetVendorList`, { 
          params: { page, limit },
          headers: getHeaders() 
        }),
        axios.get(`${API_BASE_URL}/Inventory/GetCategoryDropdown`, { headers: getHeaders() })
      ]);
      setVendors(vendorResponse.data?.data || []);
      setTotalRecords(vendorResponse.data?.total || 0);
      setCategories(catResponse.data?.data || []);
    } catch (error) {
      console.error(error);
      setVendors([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchVendors(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleSaveVendor = async () => {
    if (!(vendorFirmName || "").trim()) {
      Swal.fire("Warning", "Please enter vendor firm name", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        VendorId: vendorId || "0",
        VendorFirmName: (vendorFirmName || "").trim()
      };
      
      const res = await axios.post(
        `${API_BASE_URL}/Inventory/SaveOrUpdateVendor`,
        payload,
        { headers: getHeaders() }
      );
      
      if (res.data?.message === "Success") {
        Swal.fire("Success", "Vendor saved successfully", "success");
        resetForm();
        fetchVendors();
      } else {
        Swal.fire("Error", res.data?.message || "Failed to save vendor", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Vendor will be disabled",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setTableLoading(true);
        try {
          const res = await axios.post(`${API_BASE_URL}/Inventory/DeleteVendor`, 
            { vendorId: id }, 
            { headers: getHeaders() }
          );
          
          if (res.data?.message === "Success") {
            Swal.fire("Deleted", "Vendor disabled successfully", "success");
            fetchVendors();
          } else {
            Swal.fire("Error", res.data?.message || "Failed to delete", "error");
          }
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Something went wrong", "error");
        } finally {
          setTableLoading(false);
        }
      }
    });
  };

  const handleEdit = (id, name) => {
    setVendorId(id || "");
    setVendorFirmName(name || "");
  };

  const resetForm = () => {
    setVendorId("");
    setVendorFirmName("");
  };

  const viewVendorDetails = (id) => {
    navigate(`/vendorDetails?vendorId=${id}`);
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 min-h-screen">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Store size={28} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vendor Master</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your vendors and suppliers</p>
        </div>
      </div>

      {/* QUICK ADD FORM */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Firm Name</label>
            <input
              type="text"
              value={vendorFirmName}
              onChange={(e) => setVendorFirmName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
              placeholder="Enter Vendor Firm Name"
            />
          </div>

          <div className="flex gap-3">
            {vendorId && (
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSaveVendor}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 min-w-[160px]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {vendorId ? "Update Quick" : "Quick Add Vendor"}
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Sr. No.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Firm Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Dealing Categories</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Dealing Items</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-[280px]">Action</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-slate-100">
              {vendors.length > 0 ? (
                vendors.map((vendor, index) => {
                  
                  // Process Categories Tags
                  const catTags = (vendor.vendorDealingCategories || vendor.DealingCategories || vendor.dealingCategories)
                    ? (vendor.vendorDealingCategories || vendor.DealingCategories || vendor.dealingCategories).split(",").map(id => {
                        const cat = categories.find(c => String(c.Value) === id.trim() || String(c.categoryId) === id.trim());
                        return cat ? (cat.Text || cat.categoryName) : id.trim();
                      }) 
                    : [];
                  
                  // Process Items Tags
                  const itemTags = (vendor.vendorDealingItems || vendor.VendorDealingItems)
                    ? (vendor.vendorDealingItems || vendor.VendorDealingItems).split(",").map(i => i.trim()) 
                    : [];
                  
                  return (
                    <tr key={vendor.vendorId || index} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-600">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-800">{vendor.vendorFirmName}</td>
                      
                      {/* Dealing Categories */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {catTags.length > 0 ? (
                            catTags.map((cat, i) => (
                              <span key={i} className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-xs font-bold border border-sky-100">
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-medium text-slate-400">NA</span>
                          )}
                        </div>
                      </td>

                      {/* Dealing Items */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {itemTags.length > 0 ? (
                            itemTags.map((item, i) => (
                              <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-medium text-slate-400">NA</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => viewVendorDetails(vendor.vendorId)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 select-none"
                            title="Detailed View"
                          >
                            <FileText size={14} /> Full Details
                          </button>
                          <button 
                            onClick={() => handleEdit(vendor.vendorId, vendor.vendorFirmName)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                            title="Quick Edit Name"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteVendor(vendor.vendorId)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="Disable Vendor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 px-6 text-center">
                    {tableLoading ? (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-sm font-medium">Loading vendors...</span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-500">No vendors found</div>
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

export default VendorMaster;

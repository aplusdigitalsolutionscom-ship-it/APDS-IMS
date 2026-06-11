import React, { useEffect, useMemo, useState } from "react";
import Swal from 'sweetalert2';
import {
  Shield, Users as UsersIcon, UserPlus, Edit3, Trash2, Save, X, Loader2,
  User, Mail, Phone, BarChart3, ShoppingCart, Receipt, Package, Wrench,
  AlertOctagon, Tags, Layers, History, FileText, Check, Truck, Printer,
  Barcode, Ruler, Database, ArrowDownCircle, ArrowUpCircle, Eye, Bell,
  Lock, Search, ChevronRight, Settings2, Key, Briefcase, CheckCircle2,
  XCircle, Plus, ShieldCheck
} from "lucide-react";
import { printerService } from "../services/api";
import { ROLE_OPTIONS } from "../utils/rbac";

// ─── Constants ──────────────────────────────────────────────────────────────

const PERMISSIONS_LIST = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "print_models", label: "Printer Models", icon: Printer },
  { id: "print_serials", label: "Printer Serials", icon: Barcode },
  { id: "warranty", label: "Warranty Certificates", icon: ShieldCheck },
  { id: "print_models_view", label: "View Printer Models", icon: Eye },
  { id: "print_models_edit", label: "Edit Printer Models", icon: Printer },
  { id: "print_serials_view", label: "View Printer Serials", icon: Eye },
  { id: "print_serials_edit", label: "Edit Printer Serials", icon: Barcode },
  { id: "orders", label: "Order Processing", icon: ShoppingCart },
  { id: "create_order", label: "Create Orders", icon: ShoppingCart },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "dispatch", label: "Dispatch", icon: Package },
  { id: "stat_category", label: "Category Master", icon: Database },
  { id: "stat_brand", label: "Brand Master", icon: Tags },
  { id: "stat_vendor", label: "Vendor Master", icon: UsersIcon },
  { id: "stat_item", label: "Item Master", icon: Package },
  { id: "stat_combo", label: "Combos Master", icon: Layers },
  { id: "stat_mapping", label: "Cate-Brand Mapping", icon: FileText },
  { id: "stat_unit", label: "Unit Master", icon: Ruler },
  { id: "stat_stock_in", label: "Stock-In", icon: ArrowDownCircle },
  { id: "stat_stock_out", label: "Stock-Out", icon: ArrowUpCircle },
  { id: "stat_current_stock", label: "Current Stock", icon: History },
  { id: "installation", label: "Installation", icon: Wrench },
  { id: "damage", label: "Damage Records", icon: AlertOctagon },
  { id: "returns", label: "Returns", icon: History },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "users", label: "User Management", icon: Shield },
  { id: "reports", label: "System Reports", icon: FileText },
  { id: "godownMaster", label: "Godown Master", icon: Database },
  { id: "fbfFbaMaster", label: "FBF/FBA Master", icon: Database },
  { id: "fbfFbaManagement", label: "FBF/FBA Stock", icon: Database },
];

const PERMISSION_GROUPS = [
  { name: "Sales & Orders", icon: ShoppingCart, color: "indigo", permissions: ["orders", "create_order", "billing", "dispatch", "installation", "stat_stock_out", "returns", "damage"] },
  { name: "Master Data", icon: Database, color: "violet", permissions: ["stat_category", "stat_brand", "stat_vendor", "stat_item", "stat_combo", "stat_mapping", "stat_unit", "godownMaster", "fbfFbaMaster"] },
  { name: "Inventory", icon: History, color: "sky", permissions: ["print_models", "print_serials", "warranty", "stat_stock_in", "stat_current_stock", "fbfFbaManagement"] },
  { name: "Admin & Analytics", icon: BarChart3, color: "emerald", permissions: ["dashboard", "notifications", "users", "reports"] },
];

const EDIT_PERMISSIONS = [
  { key: 'allow_edit_models', label: 'Edit Printer Models', icon: Printer, group: 'Printers' },
  { key: 'allow_edit_serials', label: 'Edit Printer Serials', icon: Barcode, group: 'Printers' },
  { key: 'allow_edit_godown', label: 'Edit Godown Master', icon: Database, group: 'Inventory' },
  { key: 'allow_edit_fbf_fba', label: 'Edit FBF/FBA Master & Stock', icon: Database, group: 'Inventory' },
  { key: 'allow_create_order', label: 'Create Orders', icon: Plus, group: 'Orders' },
  { key: 'allow_edit_order_processing', label: 'Edit Orders', icon: ShoppingCart, group: 'Orders' },
  { key: 'allow_edit_billing', label: 'Edit Billing', icon: Receipt, group: 'Orders' },
  { key: 'allow_edit_dispatch', label: 'Edit Dispatch', icon: Truck, group: 'Orders' },
  { key: 'allow_edit_installations', label: 'Edit Installations', icon: Wrench, group: 'Operations' },
  { key: 'allow_edit_returns', label: 'Edit Returns', icon: History, group: 'Operations' },
  { key: 'allow_edit_damaged', label: 'Edit Damaged', icon: AlertOctagon, group: 'Operations' },
  { key: 'allow_edit_warranty', label: 'Edit Warranty Certificates', icon: Shield, group: 'Operations' },
];

const DEFAULT_ROLE_PERMISSIONS = {
  Admin: PERMISSIONS_LIST.map((p) => p.id),
  Supervisor: ["dashboard", "print_models", "print_serials", "warranty", "orders", "create_order", "dispatch", "installation", "notifications", "damage", "stat_current_stock", "stat_stock_in", "stat_stock_out", "returns", "reports"],
  Accountant: ["dashboard", "billing", "notifications", "reports", "stat_current_stock", "stat_stock_in", "stat_stock_out"],
  Operator: ["dashboard", "orders", "create_order", "dispatch", "notifications", "stat_current_stock", "stat_stock_in", "stat_stock_out"],
  User: ["dashboard", "print_models", "notifications", "stat_current_stock"],
};

const INITIAL_FORM = {
  username: "", password: "", role: "User", fullName: "", email: "", phone: "",
  permissions: DEFAULT_ROLE_PERMISSIONS["User"],
  allow_edit_models: false, allow_edit_serials: false, allow_edit_godown: false,
  allow_create_order: false, allow_edit_order_processing: false, allow_edit_billing: false,
  allow_edit_dispatch: false, allow_edit_installations: false, allow_edit_damaged: false,
  allow_edit_returns: false, allow_edit_fbf_fba: false, allow_edit_warranty: false,
};

const ROLE_CONFIG = {
  Admin:      { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", avatar: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  Supervisor: { bg: "bg-sky-100",    text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-500",    avatar: "bg-sky-100 text-sky-700 border-sky-300" },
  Accountant: { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500",avatar: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  User:       { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500",  avatar: "bg-amber-100 text-amber-700 border-amber-300" },
  Operator:   { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", avatar: "bg-violet-100 text-violet-700 border-violet-300" },
};

const GROUP_COLORS = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "text-indigo-500", header: "bg-indigo-50 border-indigo-100", checked: "bg-indigo-600 text-white", checkedCard: "bg-indigo-50/80 border-indigo-200 text-indigo-900" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "text-violet-500", header: "bg-violet-50 border-violet-100", checked: "bg-violet-600 text-white", checkedCard: "bg-violet-50/80 border-violet-200 text-violet-900" },
  sky:    { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    icon: "text-sky-500",    header: "bg-sky-50 border-sky-100",    checked: "bg-sky-600 text-white",    checkedCard: "bg-sky-50/80 border-sky-200 text-sky-900" },
  emerald:{ bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",icon: "text-emerald-500",header: "bg-emerald-50 border-emerald-100",checked: "bg-emerald-600 text-white",checkedCard: "bg-emerald-50/80 border-emerald-200 text-emerald-900" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const RoleBadge = ({ role, size = "sm" }) => {
  const cfg = ROLE_CONFIG[role] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${size === "sm" ? "text-[10px] uppercase tracking-wider" : "text-xs"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {role}
    </span>
  );
};

const Avatar = ({ name, role, size = "md" }) => {
  const cfg = ROLE_CONFIG[role] || { avatar: "bg-slate-100 text-slate-600 border-slate-200" };
  const initials = name ? name.substring(0, 2).toUpperCase() : "?";
  const sz = size === "lg" ? "w-14 h-14 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-extrabold border-2 shrink-0 ${cfg.avatar}`}>
      {initials}
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'}`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const DrawerTab = ({ id, label, icon: Icon, active, onClick, badge }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
      active ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
    }`}
  >
    <Icon size={15} />
    {label}
    {badge != null && (
      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Users({ currentUser, onCurrentUserUpdate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("profile");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewingUser, setViewingUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await printerService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const stats = useMemo(() =>
    ROLE_OPTIONS.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length })),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      const matchSearch = !q || u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const openDrawer = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setForm({
        username: user.username || "",
        password: "",
        role: user.role || "User",
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        permissions: user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role || "User"] || [],
        allow_edit_models: !!user.allow_edit_models,
        allow_edit_serials: !!user.allow_edit_serials,
        allow_edit_godown: !!user.allow_edit_godown,
        allow_create_order: !!user.allow_create_order,
        allow_edit_order_processing: !!user.allow_edit_order_processing,
        allow_edit_billing: !!user.allow_edit_billing,
        allow_edit_dispatch: !!user.allow_edit_dispatch,
        allow_edit_installations: !!user.allow_edit_installations,
        allow_edit_damaged: !!user.allow_edit_damaged,
        allow_edit_returns: !!user.allow_edit_returns,
        allow_edit_fbf_fba: !!user.allow_edit_fbf_fba,
        allow_edit_warranty: !!user.allow_edit_warranty,
      });
    } else {
      setEditingId(null);
      setForm(INITIAL_FORM);
    }
    setDrawerTab("profile");
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        const result = await printerService.updateUser(editingId, form);
        // If admin just edited their own account, sync permissions immediately
        // so they don't have to re-login to see changes take effect.
        const savedUser = result?.user;
        if (savedUser && currentUser && String(savedUser.id) === String(currentUser.id)) {
          onCurrentUserUpdate?.(savedUser);
        }
      } else {
        await printerService.createUser(form);
      }
      closeDrawer();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to save user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: "Delete Account?",
      text: `"${user.username}" will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' }
    });
    if (!result.isConfirmed) return;
    setSubmitting(true);
    try {
      await printerService.deleteUser(user.id);
      if (editingId === user.id) closeDrawer();
      await loadUsers();
      Swal.fire({ title: "Deleted!", text: `"${user.username}" has been removed.`, icon: "success", confirmButtonColor: "#6366F1", customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl font-semibold' } });
    } catch (err) {
      setError(err.message || "Unable to delete user.");
    } finally {
      setSubmitting(false);
    }
  };

  const editPermCount = (user) => EDIT_PERMISSIONS.filter(ep => user[ep.key]).length;

  return (
    <div className="max-w-9xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <UsersIcon size={20} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Team Management</h1>
            </div>
            <p className="text-slate-300 font-medium ml-13">Control access, roles, and modular permissions for every team member.</p>
          </div>
          <button
            onClick={() => openDrawer()}
            className="flex items-center gap-2.5 px-5 py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <UserPlus size={18} className="text-indigo-600" />
            Add Team Member
          </button>
        </div>
      </div>

      {/* ── Role Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((item) => {
          const cfg = ROLE_CONFIG[item.value] || {};
          return (
            <button
              key={item.value}
              onClick={() => setRoleFilter(prev => prev === item.value ? "All" : item.value)}
              className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md group ${
                roleFilter === item.value ? `${cfg.bg} ${cfg.border} shadow-md` : "bg-white border-slate-200/60 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {item.value.charAt(0)}
                </span>
                {roleFilter === item.value && <Check size={14} className={cfg.text} strokeWidth={3} />}
              </div>
              <p className={`text-2xl font-black ${roleFilter === item.value ? cfg.text : "text-slate-800"}`}>{item.count}</p>
              <p className={`text-xs font-semibold mt-0.5 ${roleFilter === item.value ? cfg.text : "text-slate-400"}`}>{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Directory ── */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium shrink-0">
            <UsersIcon size={15} />
            <span>{filteredUsers.length} of {users.length} users</span>
          </div>
        </div>

        {/* User Cards */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="font-semibold">Loading directory…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">{search || roleFilter !== "All" ? "No users match your filter" : "No users yet"}</h3>
            <p className="text-sm text-slate-500 mt-1">{search || roleFilter !== "All" ? "Try clearing the search or filter." : "Click 'Add Team Member' to get started."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {filteredUsers.map((user) => {
              const isSelf = Number(user.id) === Number(currentUser?.id);
              const modCount = user.role === 'Admin' ? PERMISSIONS_LIST.length : (user.permissions?.length || 0);
              const editCount = user.role === 'Admin' ? EDIT_PERMISSIONS.length : editPermCount(user);
              const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.User;

              return (
                <div key={user.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/60 transition-colors group">

                  {/* Avatar + Identity */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar name={user.fullName || user.username} role={user.role} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-extrabold text-slate-900">{user.username}</span>
                        {isSelf && <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">You</span>}
                        <RoleBadge role={user.role} />
                      </div>
                      {user.fullName && <p className="text-sm text-slate-500 font-medium mb-1">{user.fullName}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        {user.email && <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11} />{user.email}</span>}
                        {user.phone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} />{user.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Permission Summary */}
                  <div className="flex items-center gap-3 sm:ml-auto">
                    {user.role === 'Admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                        <Shield size={13} /> Full Access
                      </span>
                    ) : (
                      <button
                        onClick={() => setViewingUser(user)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-all"
                      >
                        <Eye size={13} />
                        <span>{modCount} modules</span>
                        {editCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">{editCount} edits</span>
                        )}
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDrawer(user)}
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm"
                        title="Edit user"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        disabled={isSelf || submitting}
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[200] flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />

          {/* Drawer Panel */}
          <div className="ml-auto relative flex flex-col bg-white shadow-2xl h-full overflow-hidden" style={{ width: '50%', minWidth: '400px' }}>

            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                    {editingId ? <Edit3 size={17} className="text-indigo-700" /> : <UserPlus size={17} className="text-indigo-700" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{editingId ? "Edit Account" : "New Team Member"}</h2>
                    <p className="text-xs text-slate-500 font-medium">{editingId ? `Updating ${form.username}` : "Fill in the details below"}</p>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-500">
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <DrawerTab id="profile"  label="Profile"        icon={User}     active={drawerTab === "profile"}  onClick={setDrawerTab} />
                <DrawerTab id="features" label="Feature Access" icon={Key}      active={drawerTab === "features"} onClick={setDrawerTab} badge={form.role === 'Admin' ? null : form.permissions.length} />
                <DrawerTab id="rules"    label="Data Rules"     icon={Settings2} active={drawerTab === "rules"}    onClick={setDrawerTab}
                  badge={form.role === 'Admin' ? null : EDIT_PERMISSIONS.filter(ep => form[ep.key]).length || null}
                />
              </div>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
                    <XCircle size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                {/* ── Tab: Profile ── */}
                {drawerTab === "profile" && (
                  <div className="space-y-5">
                    {/* Role — prominent at top */}
                    <div className="p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50">
                      <label className="text-[11px] font-black uppercase tracking-wider text-indigo-600 mb-2 block">Access Role *</label>
                      <div className="grid grid-cols-5 gap-2">
                        {ROLE_OPTIONS.map(opt => {
                          const cfg = ROLE_CONFIG[opt.value] || {};
                          const active = form.role === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, role: opt.value, permissions: DEFAULT_ROLE_PERMISSIONS[opt.value] || [] }))}
                              className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                                active ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm` : "border-transparent hover:border-slate-200 text-slate-500 hover:bg-white"
                              }`}
                            >
                              {opt.value === 'Admin' && <Shield size={14} className="mx-auto mb-1" />}
                              {opt.value === 'Supervisor' && <Briefcase size={14} className="mx-auto mb-1" />}
                              {opt.value === 'Accountant' && <Receipt size={14} className="mx-auto mb-1" />}
                              {opt.value === 'User' && <User size={14} className="mx-auto mb-1" />}
                              {opt.value === 'Operator' && <Settings2 size={14} className="mx-auto mb-1" />}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Identity fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Username *</label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text" required
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="e.g. john_doe"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Full Name</label>
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Email</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Phone</label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="+91 98765..."
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                          Password {editingId && <span className="normal-case font-medium text-slate-400">— leave blank to keep current</span>}
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required={!editingId}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Feature Access ── */}
                {drawerTab === "features" && (
                  form.role === 'Admin' ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border-2 border-indigo-100">
                        <Shield size={36} className="text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Full Access Granted</h3>
                      <p className="text-sm text-slate-500 max-w-xs">Admin bypasses all restrictions. Individual module permissions cannot be toggled.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Select all / none per group */}
                      {PERMISSION_GROUPS.map((group) => {
                        const gc = GROUP_COLORS[group.color];
                        const groupPerms = group.permissions;
                        const allChecked = groupPerms.every(id => form.permissions.includes(id));
                        const someChecked = groupPerms.some(id => form.permissions.includes(id));

                        return (
                          <div key={group.name} className={`rounded-2xl border overflow-hidden ${gc.border}`}>
                            {/* Group header */}
                            <div className={`flex items-center justify-between px-4 py-3 ${gc.header} border-b ${gc.border}`}>
                              <div className="flex items-center gap-2">
                                <group.icon size={15} className={gc.icon} />
                                <span className={`text-xs font-black uppercase tracking-wider ${gc.text}`}>{group.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${gc.bg} ${gc.text}`}>
                                  {groupPerms.filter(id => form.permissions.includes(id)).length}/{groupPerms.length}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm(prev => {
                                    const without = prev.permissions.filter(p => !groupPerms.includes(p));
                                    return { ...prev, permissions: allChecked ? without : [...without, ...groupPerms] };
                                  });
                                }}
                                className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all border ${gc.border} ${gc.bg} ${gc.text} hover:opacity-80`}
                              >
                                {allChecked ? "Deselect all" : "Select all"}
                              </button>
                            </div>

                            {/* Permission items */}
                            <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                              {groupPerms.map((pId) => {
                                const perm = PERMISSIONS_LIST.find(p => p.id === pId);
                                if (!perm) return null;
                                const isChecked = form.permissions.includes(pId);
                                return (
                                  <button
                                    key={pId}
                                    type="button"
                                    onClick={() => setForm(prev => ({
                                      ...prev,
                                      permissions: isChecked
                                        ? prev.permissions.filter(p => p !== pId)
                                        : [...prev.permissions, pId]
                                    }))}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                                      isChecked ? gc.checkedCard : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                      isChecked ? `${gc.checked} border-transparent` : "bg-slate-100 border-slate-200"
                                    }`}>
                                      {isChecked && <Check size={11} strokeWidth={3} />}
                                    </div>
                                    <span className="text-xs font-semibold truncate">{perm.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ── Tab: Data Rules ── */}
                {drawerTab === "rules" && (
                  form.role === 'Admin' ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border-2 border-indigo-100">
                        <Shield size={36} className="text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">All Write Access Granted</h3>
                      <p className="text-sm text-slate-500 max-w-xs">Admin can edit and delete records across all modules.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500">These toggles grant write access (create / update / delete) for specific modules, independently of which modules are visible above.</p>

                      {/* Grouped by category */}
                      {["Printers", "Orders", "Inventory", "Operations"].map(grpName => {
                        const items = EDIT_PERMISSIONS.filter(ep => ep.group === grpName);
                        return (
                          <div key={grpName} className="rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{grpName}</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {items.map(ep => (
                                <div key={ep.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                      form[ep.key] ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-100 border-slate-200 text-slate-400"
                                    }`}>
                                      <ep.icon size={14} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">{ep.label}</p>
                                      <p className="text-[11px] text-slate-400">{form[ep.key] ? "Write access enabled" : "Read-only"}</p>
                                    </div>
                                  </div>
                                  <Toggle
                                    checked={form[ep.key] || false}
                                    onChange={(val) => setForm(prev => ({ ...prev, [ep.key]: val }))}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
                <button type="button" onClick={closeDrawer} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {drawerTab !== "rules" && (
                    <button
                      type="button"
                      onClick={() => setDrawerTab(drawerTab === "profile" ? "features" : "rules")}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-all"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-70 transition-all shadow-lg shadow-slate-900/20"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <UserPlus size={16} />}
                    {editingId ? "Save Changes" : "Create Account"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Permission View Modal ── */}
      {viewingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={viewingUser.fullName || viewingUser.username} role={viewingUser.role} size="lg" />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{viewingUser.username}</h3>
                    {viewingUser.fullName && <p className="text-sm text-slate-500">{viewingUser.fullName}</p>}
                    <div className="mt-1"><RoleBadge role={viewingUser.role} size="default" /></div>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 shrink-0">
              <div className="px-6 py-3 text-center">
                <p className="text-2xl font-black text-indigo-600">{viewingUser.permissions?.length || 0}</p>
                <p className="text-xs font-semibold text-slate-400">Module Access</p>
              </div>
              <div className="px-6 py-3 text-center">
                <p className="text-2xl font-black text-amber-600">{editPermCount(viewingUser)}</p>
                <p className="text-xs font-semibold text-slate-400">Write Permissions</p>
              </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Feature Access */}
              {(viewingUser.permissions?.length || 0) > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Key size={12} /> Feature Access
                  </h4>
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map(group => {
                      const gc = GROUP_COLORS[group.color];
                      const assigned = group.permissions.filter(id => viewingUser.permissions?.includes(id));
                      if (!assigned.length) return null;
                      return (
                        <div key={group.name}>
                          <div className={`flex items-center gap-1.5 mb-2`}>
                            <group.icon size={12} className={gc.icon} />
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${gc.text}`}>{group.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {assigned.map(pId => {
                              const p = PERMISSIONS_LIST.find(perm => perm.id === pId);
                              return (
                                <span key={pId} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${gc.bg} ${gc.text} ${gc.border}`}>
                                  <CheckCircle2 size={11} /> {p?.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Write Permissions */}
              {editPermCount(viewingUser) > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Settings2 size={12} /> Write Permissions
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {EDIT_PERMISSIONS.filter(ep => viewingUser[ep.key]).map(ep => (
                      <span key={ep.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                        <ep.icon size={11} /> {ep.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(viewingUser.permissions?.length || 0) === 0 && editPermCount(viewingUser) === 0 && (
                <div className="py-12 text-center">
                  <Shield size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No permissions assigned.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <button
                onClick={() => { setViewingUser(null); openDrawer(viewingUser); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-all"
              >
                <Edit3 size={14} /> Edit Permissions
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

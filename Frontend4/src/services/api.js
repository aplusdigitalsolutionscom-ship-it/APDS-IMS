    import axios from 'axios';
    import { clearSession, getStoredToken } from '../utils/auth';

    const normalizeApiUrl = (url) => {
        try {
            const parsed = new URL(url);
            return parsed.origin;
        } catch {
            console.warn(`Invalid VITE_API_URL value '${url}', falling back to import.meta.env.VITE_API_URL`);
            return import.meta.env.VITE_API_URL;
        }
    };

    const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL).replace(/\/$/, '');
    const API_URL = `${API_BASE_URL}/api`;

    // =============================================
    // HELPERS
    // =============================================
    const toNumber = (val, fallback = 0) => {
        if (val === null || val === undefined || val === '') return fallback;
        const num = Number(val);
        return Number.isNaN(num) ? fallback : num;
    };

    const toNullableNumber = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return Number.isNaN(num) ? null : num;
    };

    const toTrimmedString = (val, fallback = '') => {
        if (val === null || val === undefined) return fallback;
        return String(val).trim();
    };

    const toNullableString = (val) => {
        const str = toTrimmedString(val, '');
        return str ? str : null;
    };

    const collapseDuplicateColumnValue = (val) => {
        if (!Array.isArray(val)) return val;

        const meaningfulValues = val.filter(
            (entry) => entry !== null && entry !== undefined && String(entry).trim() !== ''
        );

        if (meaningfulValues.length > 0) {
            return meaningfulValues[meaningfulValues.length - 1];
        }

        return val.length > 0 ? val[val.length - 1] : null;
    };

    const toBoolean = (val) => {
        return (
            val === true ||
            val === 1 ||
            val === '1' ||
            val === 'true' ||
            val === 'TRUE' ||
            val === 'Yes' ||
            val === 'YES' ||
            val === 'yes'
        );
    };

    const normalizeDispatchStatus = (status) => {
        const safeStatus = toTrimmedString(status, '');
        if (!safeStatus) return 'Pending';

        // Keep current business logic compatible with frontend
        if (safeStatus === 'Order Not Confirmed') return 'Order On Hold';

        return safeStatus;
    };

    const normalizeLogisticsStatus = (status) => {
        const safeStatus = toTrimmedString(status, '');
        if (!safeStatus) return null;

        // Backward compatibility
        if (safeStatus === 'Ready for Dispatch') return 'Packing in Process';

        return safeStatus;
    };

    // Create axios instance with default config
    const api = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });

    const withAuthHeaders = (config = {}) => {
        const nextConfig = { ...config };
        nextConfig.headers = { ...(config.headers || {}) };

        const token = getStoredToken();
        if (token) {
            nextConfig.headers.Authorization = `Bearer ${token}`;
        } else {
            delete nextConfig.headers.Authorization;
        }

        return nextConfig;
    };

    axios.interceptors.request.use(withAuthHeaders);
    api.interceptors.request.use(withAuthHeaders);

    // ✅ Response interceptor with preserved response
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                clearSession();
            }

            console.error('API Error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';

            const enhancedError = new Error(errorMessage);
            enhancedError.response = error.response;
            return Promise.reject(enhancedError);
        }
    );

    export const printerService = {
        // =============================================
        // =============== AUTH =======================
        // =============================================
        // ... inside printerService object ...

    getProfile: async () => {
        const res = await api.get('/auth/profile');
        return res.data;
    },

    updateProfile: async (data) => {
        const payload = {
            fullName: toTrimmedString(data.fullName),
            email: toTrimmedString(data.email),
            phone: toTrimmedString(data.phone)
        };
        const res = await api.put('/auth/profile', payload);
        return res.data;
    },

    changePassword: async (data) => {
        const payload = {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword
        };
        const res = await api.put('/auth/change-password', payload);
        return res.data;
    },

        getBootstrapStatus: async () => {
            const res = await api.get('/auth/bootstrap-status');
            return res.data;
        },

        login: async (credentials) => {
            const res = await api.post('/auth/login', credentials);
            return res.data;
        },

        signup: async (credentials) => {
            const res = await api.post('/auth/signup', credentials);
            return res.data;
        },

        getCurrentUser: async () => {
            const res = await api.get('/auth/me');
            return res.data;
        },

        logout: async () => {
            const res = await api.post('/auth/logout');
            return res.data;
        },

        getUsers: async () => {
            const res = await api.get('/users');
            return res.data;
        },

        createUser: async (data) => {
            const payload = {
                username: toTrimmedString(data.username),
                password: toTrimmedString(data.password),
                role: data.role || 'User',
                fullName: toTrimmedString(data.fullName),
                email: toTrimmedString(data.email),
                phone: toTrimmedString(data.phone),
                permissions: data.permissions || [],
                allow_edit_models: !!data.allow_edit_models,
                allow_edit_serials: !!data.allow_edit_serials,
                allow_edit_godown: !!data.allow_edit_godown,
                allow_create_order: !!data.allow_create_order,
                allow_edit_order_processing: !!data.allow_edit_order_processing,
                allow_edit_billing: !!data.allow_edit_billing,
                allow_edit_dispatch: !!data.allow_edit_dispatch,
                allow_edit_installations: !!data.allow_edit_installations,
                allow_edit_returns: !!data.allow_edit_returns,
                allow_edit_damaged: !!data.allow_edit_damaged,
                allow_edit_fbf_fba: !!data.allow_edit_fbf_fba,
                allow_edit_warranty: !!data.allow_edit_warranty
            };

            const res = await api.post('/users', payload);
            return res.data;
        },

        updateUser: async (id, data) => {
            const payload = {
                username: toTrimmedString(data.username),
                role: data.role || 'User',
                fullName: toTrimmedString(data.fullName),
                email: toTrimmedString(data.email),
                phone: toTrimmedString(data.phone),
                permissions: data.permissions || [],
                allow_edit_models: !!data.allow_edit_models,
                allow_edit_serials: !!data.allow_edit_serials,
                allow_edit_godown: !!data.allow_edit_godown,
                allow_create_order: !!data.allow_create_order,
                allow_edit_order_processing: !!data.allow_edit_order_processing,
                allow_edit_billing: !!data.allow_edit_billing,
                allow_edit_dispatch: !!data.allow_edit_dispatch,
                allow_edit_installations: !!data.allow_edit_installations,
                allow_edit_returns: !!data.allow_edit_returns,
                allow_edit_damaged: !!data.allow_edit_damaged,
                allow_edit_fbf_fba: !!data.allow_edit_fbf_fba,
                allow_edit_warranty: !!data.allow_edit_warranty
            };

            if (data.password && data.password.trim() !== "") {
                payload.password = data.password.trim();
            }

            const res = await api.put(`/users/${id}`, payload);
            return res.data;
        },

        deleteUser: async (id) => {
            const res = await api.delete(`/users/${id}`);
            return res.data;
        },

        getActivityLogs: async (page = 1, limit = 10) => {
            const res = await api.get('/admin/activity-logs', { params: { page, limit } });
            return res.data;
        },

        // =============================================
        // =============== COMPANIES ==================
        // =============================================
        getCompanies: async () => {
            try {
                const res = await api.get(`/companies?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch companies:', error.message);
                return [];
            }
        },

        addCompany: async (data) => {
            const res = await api.post('/companies', data);
            return res.data;
        },

        updateCompany: async (id, data) => {
            const res = await api.put(`/companies/${id}`, data);
            return res.data;
        },

        deleteCompany: async (id) => {
            const res = await api.delete(`/companies/${id}`);
            return res.data;
        },

        // =============================================
        // =============== VENDORS =====================
        // =============================================
        getVendors: async () => {
            const res = await api.get(`/vendors?_t=${new Date().getTime()}`);
            return res.data;
        },
        addVendor: async (data) => {
            const res = await api.post('/vendors', data);
            return res.data;
        },

        // =============================================
        // =============== PRODUCTS & VARIANTS ========
        // =============================================
        getProducts: async () => {
            const res = await api.get(`/products?_t=${new Date().getTime()}`);
            return res.data;
        },
        getStationeryItems: async () => {
            const res = await api.get(`/Inventory/GetItemList?limit=1000&_t=${new Date().getTime()}`);
            return res.data?.data || [];
        },
        addProduct: async (data) => {
            const res = await api.post('/products', data);
            return res.data;
        },
        addVariant: async (data) => {
            const res = await api.post('/variants', data);
            return res.data;
        },
        getVariantByBarcode: async (barcode) => {
            const res = await api.get(`/variants/barcode/${barcode}?_t=${new Date().getTime()}`);
            return res.data;
        },

        // =============================================
        // =============== BILL PARSING ================
        // =============================================
        parseBill: async (file) => {
            const formData = new FormData();
            formData.append('billFile', file);
            const res = await api.post('/parse-bill', formData);
            return res.data;
        },

        // =============================================
        // =============== PURCHASES (INWARD) =========
        // =============================================
        getPurchases: async () => {
            const res = await api.get(`/purchases?_t=${new Date().getTime()}`);
            return res.data;
        },
        addPurchase: async (data) => {
            let formData = new FormData();
            formData.append('vendorId', data.vendorId);
            formData.append('totalAmount', data.totalAmount);
            if (data.purchaseDate) formData.append('purchaseDate', data.purchaseDate);
            formData.append('items', JSON.stringify(data.items));
            if (data.billFile) formData.append('billFile', data.billFile);

            const res = await api.post('/purchases', formData);
            return res.data;
        },

        // =============================================
        // =============== SALES (OUTWARD) ============
        // =============================================
        getSales: async () => {
            const res = await api.get(`/sales?_t=${new Date().getTime()}`);
            return res.data;
        },
        addSale: async (data) => {
            let formData = new FormData();
            formData.append('customerName', data.customerName || '');
            formData.append('customerContact', data.customerContact || '');
            formData.append('totalAmount', data.totalAmount);
            if (data.saleDate) formData.append('saleDate', data.saleDate);
            formData.append('items', JSON.stringify(data.items));
            if (data.billFile) formData.append('billFile', data.billFile);

            const res = await api.post('/sales', formData);
            return res.data;
        },

        // =============================================
        // =============== MODELS =====================
        // =============================================
        getModels: async () => {
            try {
                const res = await api.get(`/models?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch models:', error.message);
                return [];
            }
        },

        addModel: async (data) => {
            const payload = {
                name: toTrimmedString(data.name),
                company: toTrimmedString(data.company),
                category: data.category,
                colorType: data.colorType || 'Monochrome',
                printerType: data.printerType || 'Multi-Function',
                description: toTrimmedString(data.description, ''),
                mrp: toNumber(data.mrp),
                isSerialized: data.isSerialized !== false,
                stockQuantity: toNumber(data.stockQuantity),
                packagingCost: toNumber(data.packagingCost),
                mainCategory: data.mainCategory,
                cpu: data.cpu,
                ram: data.ram,
                ssd: data.ssd,
                barcode: data.barcode?.trim() || null
            };

            if (!payload.name || !payload.company) {
                throw new Error('Model name and company are required');
            }

            const res = await api.post('/models', payload);
            return res.data;
        },

        updateModel: async (id, data) => {
            const payload = {
                name: toTrimmedString(data.name),
                company: toTrimmedString(data.company),
                category: data.category,
                colorType: data.colorType || 'Monochrome',
                printerType: data.printerType || 'Multi-Function',
                description: toTrimmedString(data.description, ''),
                mrp: toNumber(data.mrp),
                isSerialized: data.isSerialized !== false,
                stockQuantity: toNumber(data.stockQuantity),
                packagingCost: toNumber(data.packagingCost),
                mainCategory: data.mainCategory,
                cpu: data.cpu,
                ram: data.ram,
                ssd: data.ssd,
                barcode: data.barcode?.trim() || null
            };

            const res = await api.put(`/models/${id}`, payload);
            return res.data;
        },

        onUpdateModel: async (id, data) => {
            return printerService.updateModel(id, data);
        },

        deleteModel: async (id) => {
            const res = await api.delete(`/models/${id}`);
            return res.data;
        },

        bulkDeleteModels: async (ids) => {
            const res = await api.post('/models/bulk-delete', { ids });
            return res.data;
        },

        // =============================================
        // =============== SERIALS ====================
        // =============================================
        getSerials: async () => {
            try {
                // ✅ FIX 1: Added cache busting timestamp to force fresh fetch after Excel Upload
                const res = await api.get(`/serials?_t=${new Date().getTime()}`);
                
                // ✅ FIX 2: Data Normalization ensuring Frontend gets what it expects
                return res.data.map(item => ({
                    ...item,
                    serialNumber: item.value || item.serialNumber, // Guarantee serialNumber property exists
                    model: item.modelName ? {
                        id: item.modelId,
                        guid: item.modelGuid,
                        name: item.modelName,
                        company: item.companyName,
                        category: item.modelCategory
                    } : null, // Support UI expecting nested object
                    godownName: item.godownName || item.warehouseName || item.warehouse_name || null,
                    godownGuid: item.godownGuid || item.warehouseGuid || item.warehouse_guid || null,
                    warehouseName: item.godownName || item.warehouseName || item.warehouse_name || (typeof item.warehouse === 'string' ? item.warehouse : item.warehouse?.name) || null,
                    warehouseGuid: item.godownGuid || item.warehouseGuid || item.warehouse_guid || (typeof item.warehouse === 'object' ? item.warehouse.guid || item.warehouse.id : null) || null
                }));
            } catch (error) {
                console.warn('Failed to fetch serials:', error.message);
                return [];
            }
        },

        addSerial: async (data) => {
            const payload = {
                modelId: data.modelId,
                value: toTrimmedString(data.value || data.serialNumber),
                landingPrice: toNumber(data.landingPrice),
                landingPriceReason: toNullableString(data.landingPriceReason),
                godownGuid: toNullableString(data.godownGuid || data.warehouseGuid),
                warehouseGuid: toNullableString(data.godownGuid || data.warehouseGuid)
            };

            if (!payload.value || !payload.modelId) {
                throw new Error('Serial number and model are required');
            }

            const res = await api.post('/serials', payload);
            return res.data;
        },

        updateSerial: async (id, data) => {
            const payload = {
                value: toTrimmedString(data.value || data.serialNumber),
                landingPrice: toNumber(data.landingPrice),
                modelId: data.modelId,
                landingPriceReason: toNullableString(data.landingPriceReason),
                godownGuid: toNullableString(data.godownGuid || data.warehouseGuid),
                warehouseGuid: toNullableString(data.godownGuid || data.warehouseGuid)
            };

            const res = await api.put(`/serials/${id}`, payload);
            return res.data;
        },

        deleteSerial: async (id) => {
            const res = await api.delete(`/serials/${id}`);
            return res.data;
        },

        bulkAddSerials: async (serials) => {
            const safeSerialsData = serials.map(s => ({
                ...s,
                value: s.value || s.serialNumber, // Fallback support
                landingPriceReason: toNullableString(s.landingPriceReason),
                godownGuid: toNullableString(s.godownGuid || s.warehouseGuid),
                warehouseGuid: toNullableString(s.godownGuid || s.warehouseGuid)
            }));
            const res = await api.post('/serials/bulk', { serials: safeSerialsData });
            return res.data;
        },

        bulkDeleteSerials: async (ids) => {
            const res = await api.post('/serials/bulk-delete', { ids });
            return res.data;
        },

        getGodowns: async () => {
            const res = await api.get(`/godowns?_t=${new Date().getTime()}`);
            return res.data;
        },

        addGodown: async (data) => {
            const res = await api.post('/godowns', {
                godownName: toTrimmedString(data.godownName),
                godownAddress: toTrimmedString(data.godownAddress, ''),
                isDefault: Boolean(data.isDefault)
            });
            return res.data;
        },

        updateGodown: async (id, data) => {
            const res = await api.put(`/godowns/${id}`, {
                godownName: toTrimmedString(data.godownName),
                godownAddress: toTrimmedString(data.godownAddress, ''),
                isDefault: Boolean(data.isDefault)
            });
            return res.data;
        },

        deleteGodown: async (id) => {
            const res = await api.delete(`/godowns/${id}`);
            return res.data;
        },

        // =============================================
        // STOCK TRANSFER
        // =============================================

        getGodownModels: async (godownId) => {
            const res = await api.get(`/godowns/${godownId}/models`);
            return res.data;
        },

        getGodownModelSerials: async (godownId, modelId) => {
            const res = await api.get(`/godowns/${godownId}/models/${modelId}/serials`);
            return res.data;
        },

        transferGodownStock: async (payload) => {
            const res = await api.post('/godowns/transfer', payload);
            return res.data;
        },

        getGodownTransferHistory: async (page = 1, limit = 20) => {
            const res = await api.get(`/godowns/transfer-history?page=${page}&limit=${limit}`);
            return res.data;
        },

        // =============================================
        // ✅ EXCEL UPLOAD / DOWNLOAD FOR SERIALS
        // =============================================
        
        // 🔥 UPDATE: Added targetModelId parameter for Model Filtering
        uploadSerialsExcel: async (file, targetModelId = "") => {
            console.log('📤 Uploading Excel file:', file.name, 'Target Model:', targetModelId || 'All Models');

            if (!file) {
                throw new Error('No file selected');
            }

            const formData = new FormData();
            formData.append('file', file);
            
            // ✅ Send targetModelId to backend if selected
            if (targetModelId) {
                formData.append('targetModelId', targetModelId);
            }

            try {
                const res = await api.post('/serials/upload-excel', formData, {
                    timeout: 60000 // 60 seconds timeout for large files
                });

                console.log('✅ Excel upload successful:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Excel upload failed:', error.message);
                throw error;
            }
        },

        downloadSerialTemplate: async () => {
            try {
                const res = await api.get('/serials/download-template', {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'serial_upload_template.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                console.log('✅ Template downloaded successfully');
                return true;
            } catch (error) {
                console.error('❌ Template download failed:', error.message);
                throw error;
            }
        },

        exportSerialsExcel: async () => {
            try {
                const res = await api.get(`/serials/export-excel?_t=${new Date().getTime()}`, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `serials_export_${Date.now()}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                console.log('✅ Serials exported successfully');
                return true;
            } catch (error) {
                console.error('❌ Export failed:', error.message);
                throw error;
            }
        },

        // =============================================
        // =============== DISPATCHES =================
        // =============================================
        getDispatches: async (includeDeleted = true) => {
            try {
                const res = await api.get(`/dispatches?includeDeleted=${includeDeleted}&_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch dispatches:', error.message);
                return [];
            }
        },

        getDispatchById: async (id) => {
            try {
                const res = await api.get(`/dispatches/${id}?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn(`Failed to fetch dispatch details for ID ${id}:`, error.message);
                return null;
            }
        },

        getDispatchStats: async () => {
            try {
                const res = await api.get(`/dispatches/stats?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch dispatch stats:', error.message);
                return null;
            }
        },

        addDispatch: async (data) => {
            let safePackagingCost = null;
            if (data.packagingCost !== undefined && data.packagingCost !== '') {
                safePackagingCost = toNumber(data.packagingCost);
            }

            const normalizedStatus = normalizeDispatchStatus(data.status);

            const payload = {
                serialId: data.serialId,
                firmName: toTrimmedString(data.firmName),
                customer: toTrimmedString(data.customer || data.customerName),
                customerName: toTrimmedString(data.customerName || data.customer),
                address: toTrimmedString(data.address || data.shippingAddress),
                shippingAddress: toTrimmedString(data.shippingAddress || data.address),
                user: data.user || data.dispatchedBy || 'Unknown',
                sellingPrice: toNumber(data.sellingPrice),
                status: normalizedStatus,
                remarks: toTrimmedString(data.remarks, ''),

                // backward compatibility
                orderVerified: data.orderVerified || 'No',

                gemOrderType: data.orderType || data.gemOrderType || null,
                bidNumber: data.bidNumber || data.bidNo || null,
                orderDate: data.orderDate || null,
                lastDeliveryDate: data.lastDeliveryDate || null,
                gstNumber: toNullableString(data.gstNumber),
                contactNumber: toNullableString(data.contactNumber),
                altContactNumber: toNullableString(data.altContactNumber),
                buyerEmail: toNullableString(data.buyerEmail),
                consigneeEmail: toNullableString(data.consigneeEmail),
                consigneeName: toNullableString(data.consigneeName),
                contractFile: data.contractFile || data.contractFilename || null,
                invoiceNumber: toNullableString(data.invoiceNumber),
                invoiceDate: data.invoiceDate || null,
                invoiceFilename: data.invoiceFilename || null,

                installationRequired: toBoolean(data.installationRequired),
                installationStatus: toBoolean(data.installationRequired)
                    ? (data.installationStatus || 'Pending')
                    : null,
                technicianName: toNullableString(data.technicianName),
                technicianContact: toNullableString(data.technicianContact),
                installationCharges: toNumber(data.installationCharges),
                installationRemarks: toNullableString(data.installationRemarks),
                scheduledDate: data.scheduledDate || null,

                // logistics compatibility
                courierPartner: toNullableString(data.courierPartner),
                logisticsDispatchDate: data.logisticsDispatchDate || null,
                trackingId: toNullableString(data.trackingId),
                freightCharges: toNumber(data.freightCharges),
                logisticsStatus: normalizeLogisticsStatus(data.logisticsStatus),
                podFilename: data.podFilename || null,
                ewayBillFilename: data.ewayBillFilename || null,

                packagingCost: safePackagingCost,
                commission: toNumber(data.commission),
                warranty: data.warranty || null
            };

            const res = await api.post('/dispatches', payload);
            return res.data;
        },

        addBulkDispatch: async (items) => {
            const safeItems = items.map(item => {
                let safePackagingCost = null;
                if (item.packagingCost !== undefined && item.packagingCost !== '') {
                    safePackagingCost = toNumber(item.packagingCost);
                }

                return {
                    serialId: item.serialId,
                    firmName: toTrimmedString(item.firmName),
                    customer: toTrimmedString(item.customer || item.customerName),
                    customerName: toTrimmedString(item.customerName || item.customer),
                    address: toTrimmedString(item.address || item.shippingAddress),
                    shippingAddress: toTrimmedString(item.shippingAddress || item.address),
                    buyerAddress: toTrimmedString(item.buyerAddress || item.buyToAddress),
                    user: item.user || 'Unknown',
                    sellingPrice: toNumber(item.sellingPrice),
                    status: normalizeDispatchStatus(item.status || 'Pending'),

                    orderVerified: item.orderVerified || 'No',
                    gemOrderType: item.orderType || item.gemOrderType || null,
                    bidNumber: item.bidNumber || item.bidNo || null,
                    orderDate: item.orderDate || null,
                    lastDeliveryDate: item.lastDeliveryDate || null,
                    gstNumber: toNullableString(item.gstNumber),
                    contactNumber: toNullableString(item.contactNumber),
                    altContactNumber: toNullableString(item.altContactNumber),
                    buyerEmail: toNullableString(item.buyerEmail),
                    consigneeEmail: toNullableString(item.consigneeEmail),
                    consigneeName: toNullableString(item.consigneeName),
                    contractFile: item.contractFile || item.contractFilename || null,
                    invoiceNumber: toNullableString(item.invoiceNumber),
                    invoiceDate: item.invoiceDate || null,
                    invoiceFilename: item.invoiceFilename || null,

                    installationRequired: toBoolean(item.installationRequired),
                    installationStatus: toBoolean(item.installationRequired)
                        ? (item.installationStatus || 'Pending')
                        : null,
                    technicianName: toNullableString(item.technicianName),
                    technicianContact: toNullableString(item.technicianContact),
                    installationCharges: toNumber(item.installationCharges),
                    installationRemarks: toNullableString(item.installationRemarks),
                    scheduledDate: item.scheduledDate || null,

                    courierPartner: toNullableString(item.courierPartner),
                    logisticsDispatchDate: item.logisticsDispatchDate || null,
                    trackingId: toNullableString(item.trackingId),
                    freightCharges: toNumber(item.freightCharges),
                    logisticsStatus: normalizeLogisticsStatus(item.logisticsStatus),
                    podFilename: item.podFilename || null,
                    ewayBillFilename: item.ewayBillFilename || null,

                    packagingCost: safePackagingCost,
                    commission: toNumber(item.commission),
                    warranty: item.warranty || null
                };
            });

            const res = await api.post('/dispatches/bulk', { items: safeItems });
            return res.data;
        },

        resetDocs: async (payload) => {
            const res = await api.put('/orders/bulk-reset-docs', payload);
            return res.data;
        },

        sendBackToBilling: async (payload) => {
            const res = await api.put('/orders/bulk-send-back', payload);
            return res.data;
        },

        updateDispatch: async (id, updates) => {
            if (!updates && !id) return null;

            // bulk payload support exactly like Dispatch.jsx uses
            if (!id && Array.isArray(updates)) {
                const normalizedUpdates = updates.map((item) => {
                    const payload = { ...item };

                    if (payload.status !== undefined) {
                        payload.status = normalizeDispatchStatus(payload.status);
                    }
                    if (payload.logisticsStatus !== undefined) {
                        payload.logisticsStatus = normalizeLogisticsStatus(payload.logisticsStatus);
                    }
                    if (payload.installationRequired !== undefined) {
                        const val = payload.installationRequired;
                        payload.installationRequired = (val === true || val === "Yes" || val === "yes" || val === 1 || val === "1") ? "Yes" : "No";
                    }
                    if (payload.installationCharges !== undefined) {
                        payload.installationCharges = toNumber(payload.installationCharges);
                    }
                    if (payload.packagingCost !== undefined) {
                        payload.packagingCost = toNumber(payload.packagingCost);
                    }
                    if (payload.commission !== undefined) {
                        payload.commission = toNumber(payload.commission);
                    }
                    if (payload.freightCharges !== undefined) {
                        payload.freightCharges = toNumber(payload.freightCharges);
                    }
                    if (payload.sellingPrice !== undefined) {
                        payload.sellingPrice = toNumber(payload.sellingPrice);
                    }
                    if (payload.buyerAddress !== undefined) {
                        payload.buyerAddress = toTrimmedString(payload.buyerAddress);
                    }
                    if (payload.technicianName !== undefined) {
                        payload.technicianName = toNullableString(payload.technicianName);
                    }
                    if (payload.technicianContact !== undefined) {
                        payload.technicianContact = toNullableString(payload.technicianContact);
                    }
                    if (payload.installationRemarks !== undefined) {
                        payload.installationRemarks = toNullableString(payload.installationRemarks);
                    }
                    if (payload.contactNumber !== undefined) {
                        payload.contactNumber = toNullableString(payload.contactNumber);
                    }
                    if (payload.altContactNumber !== undefined) {
                        payload.altContactNumber = toNullableString(payload.altContactNumber);
                    }
                    if (payload.buyerEmail !== undefined) {
                        payload.buyerEmail = toNullableString(payload.buyerEmail);
                    }
                    if (payload.consigneeEmail !== undefined) {
                        payload.consigneeEmail = toNullableString(payload.consigneeEmail);
                    }
                    if (payload.gstNumber !== undefined) {
                        payload.gstNumber = toNullableString(payload.gstNumber);
                    }
                    if (payload.customer !== undefined || payload.customerName !== undefined) {
                        payload.customer = toTrimmedString(payload.customer || payload.customerName);
                        payload.customerName = toTrimmedString(payload.customerName || payload.customer);
                    }
                    if (payload.address !== undefined || payload.shippingAddress !== undefined) {
                        payload.address = toTrimmedString(payload.address || payload.shippingAddress);
                        payload.shippingAddress = toTrimmedString(payload.shippingAddress || payload.address);
                    }

                    return payload;
                });

                const res = await api.put('/dispatches', { updates: normalizedUpdates });
                return res.data;
            }

            const payload = { ...updates };

            if (payload.status !== undefined) payload.status = normalizeDispatchStatus(payload.status);
            if (payload.logisticsStatus !== undefined) payload.logisticsStatus = normalizeLogisticsStatus(payload.logisticsStatus);
            if (payload.installationRequired !== undefined) {
                const val = payload.installationRequired;
                payload.installationRequired = (val === true || val === "Yes" || val === "yes" || val === 1 || val === "1") ? "Yes" : "No";
            }
            if (payload.installationCharges !== undefined) payload.installationCharges = toNumber(payload.installationCharges);
            if (payload.packagingCost !== undefined) payload.packagingCost = toNumber(payload.packagingCost);
            if (payload.commission !== undefined) payload.commission = toNumber(payload.commission);
            if (payload.freightCharges !== undefined) payload.freightCharges = toNumber(payload.freightCharges);
            if (payload.sellingPrice !== undefined) payload.sellingPrice = toNumber(payload.sellingPrice);

            if (payload.technicianName !== undefined) payload.technicianName = toNullableString(payload.technicianName);
            if (payload.technicianContact !== undefined) payload.technicianContact = toNullableString(payload.technicianContact);
            if (payload.installationRemarks !== undefined) payload.installationRemarks = toNullableString(payload.installationRemarks);
            if (payload.contactNumber !== undefined) payload.contactNumber = toNullableString(payload.contactNumber);
            if (payload.altContactNumber !== undefined) payload.altContactNumber = toNullableString(payload.altContactNumber);
            if (payload.buyerEmail !== undefined) payload.buyerEmail = toNullableString(payload.buyerEmail);
            if (payload.consigneeEmail !== undefined) payload.consigneeEmail = toNullableString(payload.consigneeEmail);
            if (payload.gstNumber !== undefined) payload.gstNumber = toNullableString(payload.gstNumber);

            if (payload.customer !== undefined || payload.customerName !== undefined) {
                payload.customer = toTrimmedString(payload.customer || payload.customerName);
                payload.customerName = toTrimmedString(payload.customerName || payload.customer);
            }

            if (payload.address !== undefined || payload.shippingAddress !== undefined) {
                payload.address = toTrimmedString(payload.address || payload.shippingAddress);
                payload.shippingAddress = toTrimmedString(payload.shippingAddress || payload.address);
            }

            if (id) {
                const res = await api.put(`/dispatches/${id}`, payload);
                return res.data;
            } else {
                const res = await api.put('/dispatches', { updates: payload });
                return res.data;
            }
        },

        updateTransaction: async (id, data) => {
            return printerService.updateDispatch(id, data);
        },

        deleteDispatch: async (ids, reason, cancelledBy) => {
            const res = await api.delete('/dispatches', {
                data: {
                    ids: Array.isArray(ids) ? ids : [ids],
                    reason: reason || 'No reason provided',
                    cancelledBy: cancelledBy || 'Unknown'
                }
            });
            return res.data;
        },

        restoreDispatch: async (ids) => {
            const res = await api.post('/dispatches/restore', {
                ids: Array.isArray(ids) ? ids : [ids]
            });
            return res.data;
        },

        permanentDeleteDispatch: async (ids) => {
            const res = await api.delete('/dispatches/permanent', {
                data: { ids: Array.isArray(ids) ? ids : [ids] }
            });
            return res.data;
        },

        // =============================================
        // ✅ INSTALLATIONS
        // =============================================
        getInstallations: async () => {
            try {
                const res = await api.get(`/installations?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch installations:', error.message);
                return [];
            }
        },

        getInstallationStats: async () => {
            try {
                const res = await api.get(`/installations/stats?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch installation stats:', error.message);
                return {
                    total: 0,
                    pending: 0,
                    scheduled: 0,
                    inProgress: 0,
                    completed: 0,
                    cancelled: 0,
                    totalCharges: 0
                };
            }
        },

        getInstallationById: async (id) => {
            const res = await api.get(`/installations/${id}?_t=${new Date().getTime()}`);
            return res.data;
        },

        updateInstallation: async (id, data) => {
            const payload = {
                technicianName: toNullableString(data.technicianName),
                technicianContact: toNullableString(data.technicianContact),
                installationStatus: data.installationStatus || null,
                installationCharges: toNumber(data.installationCharges),
                installationRemarks: toNullableString(data.installationRemarks),
                scheduledDate: data.scheduledDate || null,
                installationDate: data.installationDate || null
            };

            const res = await api.put(`/installations/${id}`, payload);
            return res.data;
        },

        bulkUpdateInstallations: async (ids, updates) => {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('No IDs provided');
            }

            const payload = {
                ids,
                updates: {
                    technicianName: updates.technicianName?.trim() || undefined,
                    technicianContact: updates.technicianContact?.trim() || undefined,
                    installationStatus: updates.installationStatus || undefined,
                    scheduledDate: updates.scheduledDate || undefined
                }
            };

            const res = await api.put('/installations/bulk/update', payload);
            return res.data;
        },

        // =============================================
        // =============== RETURNS ====================
        // =============================================
        getReturns: async () => {
            try {
                console.log('📥 Fetching returns...');
                const res = await api.get(`/returns?_t=${new Date().getTime()}`);
                const rows = Array.isArray(res.data) ? res.data : [];
                const normalizedRows = rows.map((item) => ({
                    ...item,
                    serialValue: toTrimmedString(collapseDuplicateColumnValue(item.serialValue), ''),
                    firmName: toNullableString(collapseDuplicateColumnValue(item.firmName)),
                    customerName: toNullableString(collapseDuplicateColumnValue(item.customerName)),
                    invoiceNumber: toNullableString(collapseDuplicateColumnValue(item.invoiceNumber))
                }));
                return normalizedRows;
            } catch (error) {
                console.error('❌ Failed to fetch returns:', error.message);
                console.error('Full error:', error.response?.data);
                return [];
            }
        },

        getReturnLookup: async (serialValue) => {
            const trimmedSerial = toTrimmedString(serialValue);
            if (!trimmedSerial) {
                throw new Error('Serial number is required');
            }

            const res = await api.get('/returns/lookup', {
                params: {
                    serialValue: trimmedSerial,
                    _t: new Date().getTime()
                }
            });
            return res.data;
        },

        getSerialHistory: async (serialId) => {
            const safeId = toNullableNumber(serialId);
            if (!safeId) {
                throw new Error('Serial ID is required');
            }

            const res = await api.get(`/serials/${safeId}/history?_t=${new Date().getTime()}`);
            return res.data;
        },

        addReturn: async (data, conditionParam, reasonParam) => {
            console.log('📤 Adding return - Raw input:', { data, conditionParam, reasonParam });

            let payload;

            if (typeof data === 'object' && data !== null && !conditionParam) {
                payload = {
                    serialValue: (data.serialValue || data.serialNumber || data.serial)?.toString().trim(),
                    condition: data.condition || 'Good',
                    reason: (data.reason || data.remarks || '')?.toString().trim(),
                    dispatchId: data.dispatchId || null,
                    returnDate: data.returnDate || new Date().toISOString(),
                    returnedBy: data.returnedBy || data.user || 'Unknown',
                    itemVariantId: data.itemVariantId || null,
                    quantity: data.quantity || 1,
                    isInventoryItem: data.isInventoryItem || false
                };
            } else {
                payload = {
                    serialValue: data?.toString().trim(),
                    condition: conditionParam || 'Good',
                    reason: (reasonParam || '')?.toString().trim(),
                    returnDate: new Date().toISOString(),
                    returnedBy: 'Unknown',
                    quantity: 1
                };
            }

            console.log('📦 Return payload:', payload);

            if (!payload.serialValue && !payload.itemVariantId) {
                throw new Error('Serial number or Item Variant is required for return');
            }

            if (!payload.reason) {
                throw new Error('Return reason is required');
            }

            const validConditions = ['Good', 'InStock', 'Damaged', 'Defective', 'Refurbished', 'Other'];
            if (!validConditions.includes(payload.condition)) {
                console.warn(`⚠️ Invalid condition "${payload.condition}", defaulting to "Good"`);
                payload.condition = 'Good';
            }

            try {
                const res = await api.post('/returns', payload);
                console.log('✅ Return added successfully:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to add return:', error.message);
                console.error('Response:', error.response?.data);
                console.error('Status:', error.response?.status);
                throw error;
            }
        },

        updateReturn: async (id, data) => {
            console.log('📝 Updating return:', { id, data });

            if (!id) {
                throw new Error('Return ID is required for update');
            }

            const payload = {
                condition: data.condition,
                reason: data.reason?.trim() || data.remarks?.trim() || '',
                status: data.status,
                ...(data.restoredToStock !== undefined && { restoredToStock: data.restoredToStock })
            };

            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) delete payload[key];
            });

            try {
                const res = await api.put(`/returns/${id}`, payload);
                console.log('✅ Return updated successfully:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to update return:', error.message);
                console.error('Response:', error.response?.data);
                throw error;
            }
        },

        deleteReturn: async (item) => {
            console.log('🗑️ Deleting return - Raw input:', item);

            let id = null;

            if (typeof item === 'string' || typeof item === 'number') {
                id = item;
            } else if (item && typeof item === 'object') {
                id = item._id || item.id || item.returnId || item.return_id || item.Id || item.ID;
            }

            console.log('🔑 Extracted ID:', id);

            if (!id) {
                console.error('❌ No valid ID found. Full item received:', JSON.stringify(item, null, 2));
                throw new Error('No valid ID found for this return record. Please refresh and try again.');
            }

            try {
                const res = await api.delete(`/returns/${id}`);
                console.log('✅ Return deleted successfully:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to delete return:', error.message);
                console.error('Response:', error.response?.data);
                console.error('Status:', error.response?.status);

                if (error.response?.status === 404) {
                    throw new Error('Return record not found. It may have been already deleted.');
                }
                throw error;
            }
        },

        bulkDeleteReturns: async (ids) => {
            console.log('🗑️ Bulk deleting returns:', ids);

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('No IDs provided for bulk delete');
            }

            try {
                const res = await api.post('/returns/bulk-delete', { ids });
                console.log('✅ Bulk delete successful:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to bulk delete returns:', error.message);
                throw error;
            }
        },

        restoreReturnToStock: async (id) => {
            console.log('🔄 Restoring return to stock:', id);

            if (!id) {
                throw new Error('Return ID is required');
            }

            try {
                const res = await api.post(`/returns/${id}/restore-to-stock`);
                console.log('✅ Restored to stock:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to restore to stock:', error.message);
                throw error;
            }
        },

        getReturnById: async (id) => {
            console.log('📥 Fetching return by ID:', id);

            if (!id) {
                throw new Error('Return ID is required');
            }

            try {
                const res = await api.get(`/returns/${id}?_t=${new Date().getTime()}`);
                console.log('✅ Return fetched:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ Failed to fetch return:', error.message);
                throw error;
            }
        },

        getReturnStats: async () => {
            try {
                const res = await api.get(`/returns/stats?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch return stats:', error.message);
                return {
                    total: 0,
                    good: 0,
                    damaged: 0,
                    defective: 0,
                    restoredToStock: 0
                };
            }
        },

        // =============================================
        // =============== REPORTS ====================
        // =============================================
        getReports: async (startDate, endDate) => {
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                params.append('_t', new Date().getTime());

                const res = await api.get(`/reports?${params.toString()}`);

                if (res.data && res.data.transactions) {
                    res.data.transactions = res.data.transactions.map(t => ({
                        ...t,
                        customerName: t.customerName || t.customer || t.customer_name || "N/A"
                    }));
                }

                return res.data;
            } catch (error) {
                console.warn('Failed to fetch reports:', error.message);
                return null;
            }
        },

        saveReportSnapshot: async (payload) => {
            const res = await api.post('/reports/save', payload);
            return res.data;
        },

        searchOrderForReturn: async (query) => {
            const res = await api.get(`/Inventory/SearchOrderForReturn?query=${query}`);
            return res.data;
        },

        saveStationeryReturn: async (data) => {
            const res = await api.post('/Inventory/SaveStationeryReturn', data);
            return res.data;
        },

        getStationeryReturnsHistory: async () => {
            const res = await api.get('/Inventory/GetStationeryReturnsHistory');
            return res.data;
        },

        updateStationeryCompensation: async (data) => {
            const res = await api.post('/Inventory/UpdateStationeryCompensation', data);
            return res.data;
        },

        getInventoryReport: async () => {
            const res = await api.get(`/reports/inventory?_t=${new Date().getTime()}`);
            return res.data;
        },

        getSalesReport: async (startDate, endDate) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            params.append('_t', new Date().getTime());

            const res = await api.get(`/reports/sales?${params.toString()}`);
            return res.data;
        },

        getInstallationReport: async (startDate, endDate) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            params.append('_t', new Date().getTime());

            const res = await api.get(`/reports/installations?${params.toString()}`);
            return res.data;
        },

        // =============================================
        // =============== ORDERS TRACKING ============
        // =============================================
        getOrders: async () => {
            try {
                const res = await api.get(`/orders?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn("Error fetching orders:", error.message);
                return [];
            }
        },

        updateOrderStatus: async (id, statusData) => {
            const payload = {
                status: normalizeDispatchStatus(statusData.status),
                trackingId: toTrimmedString(statusData.trackingId, ''),
                reason: toNullableString(statusData.reason)
            };

            const res = await api.put(`/orders/${id}/status`, payload);
            return res.data;
        },

        updatePayment: async (id, paymentData) => {
            const payload = {
                paymentDate: paymentData.paymentDate,
                amount: toNumber(paymentData.amount),
                utrId: toNullableString(paymentData.utrId),
                status: 'Completed'
            };

            const res = await api.put(`/orders/${id}/payment`, payload);
            return res.data;
        },

        replaceOrder: async (id, data) => {
            const payload = {
                oldSerialValue: toTrimmedString(data.oldSerialValue),
                newSerialId: data.newSerialId,
                newSerialValue: toTrimmedString(data.newSerialValue),
                reason: toNullableString(data.reason)
            };
            const res = await api.post(`/orders/${id}/replace`, payload);
            return res.data;
        },

        // =============================================
        // ✅ uploadOrderDocument
        // =============================================
        uploadOrderDocument: async (id, file, docType) => {
            console.log(`📤 Uploading document — ID: ${id}, DocType: ${docType}, File: ${file?.name}`);

            if (!id) throw new Error('Order item ID is required for document upload');
            if (!file) throw new Error('File is required for document upload');
            if (!(file instanceof File)) throw new Error('Invalid file selected for document upload');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('docType', docType);

            try {
                const res = await api.post(`/orders/${id}/upload`, formData, {
                    timeout: 60000,
                    headers: { 'Content-Type': undefined }
                });

                console.log(`✅ Upload successful [${docType}]:`, res.data);
                return res.data;
            } catch (error) {
                console.error(`❌ Upload failed [${docType}]:`, error.message);
                console.error('Response:', error.response?.data);
                throw error;
            }
        },

        uploadEwayBill: async (dispatchId, file) => {
            console.log(`📤 Uploading E-Way Bill — Dispatch ID: ${dispatchId}, File: ${file?.name}`);

            if (!dispatchId) throw new Error('Dispatch ID is required for E-Way Bill upload');
            if (!file) throw new Error('File is required for E-Way Bill upload');

            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ];

            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only PDF, JPG, PNG, and WEBP are allowed for E-Way Bill.');
            }

            const maxSizeBytes = 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                throw new Error('File size exceeds 10MB limit.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('docType', 'ewayBill');

            try {
                const res = await api.post(`/orders/${dispatchId}/upload`, formData);

                console.log('✅ E-Way Bill uploaded successfully:', res.data);
                return res.data;
            } catch (error) {
                console.error('❌ E-Way Bill upload failed:', error.message);
                console.error('Response:', error.response?.data);
                throw error;
            }
        },

        getEwayBillUrl: (filename) => {
            if (!filename) return null;
            return `${API_BASE_URL}/uploads/${filename}`;
        },

        validateEwayBillRequired: (orderValue) => {
            const threshold = 50000;
            const isRequired = Number(orderValue) > threshold;
            return {
                isRequired,
                threshold,
                message: isRequired
                    ? `E-Way Bill is mandatory for orders above ₹${threshold.toLocaleString('en-IN')}`
                    : null
            };
        },

        // =============================================
        // =============== DASHBOARD ==================
        // =============================================
        getDashboardStats: async () => {
            try {
                const res = await api.get(`/dashboard/stats?_t=${new Date().getTime()}`);
                return res.data;
            } catch (error) {
                console.warn('Failed to fetch dashboard stats:', error.message);
                return null;
            }
        },

        // =============================================
        // =============== SEARCH =====================
        // =============================================
        searchItems: async (query, type = 'all') => {
            const params = new URLSearchParams();
            params.append('q', query);
            params.append('type', type);

            const res = await api.get(`/search?${params.toString()}`);
            return res.data;
        },

        // =============================================
        // =============== EXPORT =====================
        // =============================================
        exportData: async (type, format = 'csv', filters = {}) => {
            const params = new URLSearchParams();
            params.append('format', format);
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const res = await api.get(`/export/${type}?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return true;
        },

        exportInstallations: async (format = 'csv', filters = {}) => {
            const params = new URLSearchParams();
            params.append('format', format);
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await api.get(`/export/installations?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `installations_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return true;
        },

        exportReturns: async (format = 'csv', filters = {}) => {
            const params = new URLSearchParams();
            params.append('format', format);
            if (filters.condition) params.append('condition', filters.condition);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await api.get(`/export/returns?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `returns_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return true;
        },

        exportDispatches: async (format = 'csv', filters = {}) => {
            const params = new URLSearchParams();
            params.append('format', format);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.status) params.append('status', filters.status);

            const res = await api.get(`/export/dispatches?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `dispatches_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return true;
        },

        // --- Priority Appearance & Tagging ---
        updateAppearance: async (id, data) => {
            const res = await api.put(`/dispatches/${id}/appearance`, data);
            return res.data;
        },

        updateReturnAppearance: async (id, data) => {
            const res = await api.put(`/returns/${id}/appearance`, data);
            return res.data;
        },

        updateStationeryAppearance: async (data) => {
            const res = await api.post(`/Inventory/UpdateAppearance`, data);
            return res.data;
        },

        updateBatchAppearance: async (ids, data) => {
            const res = await api.post(`/dispatches/batch/appearance`, { ids, ...data });
            return res.data;
        },

        getGlobalTags: async () => {
            const res = await api.get('/global-tags');
            return res.data;
        },

        createGlobalTag: async (tagData) => {
            const res = await api.post('/global-tags', tagData);
            return res.data;
        },

        deleteGlobalTag: async (id, module) => {
            const res = await api.delete(`/global-tags/${id}?module=${module}`);
            return res.data;
        },

        // --- Saved Reports Management ---
        saveReport: async (reportData) => {
            const res = await api.post('/reports/save', reportData);
            return res.data;
        },

        getSavedReports: async () => {
            const res = await api.get('/reports/saved');
            return res.data;
        },

        // =============================================
        // ✅ FBF & FBA STOCK MANAGEMENT
        // =============================================
        getFbfFbaStock: async (type) => {
            const res = await api.get(`/fbf-fba/stock?type=${type}&_t=${new Date().getTime()}`);
            return res.data;
        },

        addFbfFbaStock: async (data) => {
            const res = await api.post('/fbf-fba/add-stock', data);
            return res.data;
        },

        updateFbfFbaStock: async (guid, data) => {
            const res = await api.put(`/fbf-fba/stock/${guid}`, data);
            return res.data;
        },

        sellFbfFbaStock: async (data) => {
            // Logic for Selling/OUT with FIFO
            const res = await api.post('/fbf-fba/sell-out', data);
            return res.data;
        },

        getFbfFbaReports: async () => {
            const res = await api.get('/reports/fbf-fba');
            return res.data;
        },

        // =============================================
        // ✅ FBF & FBA WAREHOUSE MASTER
        // =============================================
        getFbfFbaPlatforms: async () => {
            const res = await api.get('/fbf-fba-master/platforms');
            return res.data;
        },
        addFbfFbaPlatform: async (data) => {
            const res = await api.post('/fbf-fba-master/platforms', data);
            return res.data;
        },
        deleteFbfFbaPlatform: async (id) => {
            const res = await api.delete(`/fbf-fba-master/platforms/${id}`);
            return res.data;
        },

        getFbfFbaStates: async () => {
            const res = await api.get('/fbf-fba-master/states');
            return res.data;
        },
        addFbfFbaState: async (data) => {
            const res = await api.post('/fbf-fba-master/states', data);
            return res.data;
        },
        deleteFbfFbaState: async (id) => {
            const res = await api.delete(`/fbf-fba-master/states/${id}`);
            return res.data;
        },

        getFbfFbaWarehouses: async () => {
            const res = await api.get('/fbf-fba-master/warehouses');
            return res.data;
        },

        addFbfFbaWarehouse: async (data) => {
            const res = await api.post('/fbf-fba-master/warehouses', data);
            return res.data;
        },

        updateFbfFbaWarehouse: async (id, data) => {
            const res = await api.put(`/fbf-fba-master/warehouses/${id}`, data);
            return res.data;
        },

        deleteFbfFbaWarehouse: async (id) => {
            const res = await api.delete(`/fbf-fba-master/warehouses/${id}`);
            return res.data;
        },

        // ── Model Approval Requests ──────────────────────────────────────────
        submitModelApproval: async (data) => {
            const res = await api.post('/model-approvals', data);
            return res.data;
        },
        getModelApprovals: async (status) => {
            const params = status ? { status } : {};
            const res = await api.get('/model-approvals', { params });
            return res.data;
        },
        approveModelRequest: async (guid, modelData) => {
            const res = await api.put(`/model-approvals/${guid}/approve`, modelData || {});
            return res.data;
        },
        getApprovalSerials: async (guid) => {
            const res = await api.get(`/model-approvals/${guid}/serials`);
            return res.data;
        },
        rejectModelRequest: async (guid, reason) => {
            const res = await api.put(`/model-approvals/${guid}/reject`, { reason });
            return res.data;
        }
    };

    export default api;

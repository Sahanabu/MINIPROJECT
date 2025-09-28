import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { api } from '../../services/api'; // Assuming this is your configured Axios instance

// ====================================================================
// INTERFACES (UNCHANGED)
// ====================================================================

export interface AssetItem {
  itemName: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  vendorName: string;
  vendorAddress?: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string | Date;
  billFile?: File;
  billFileUrl?: string;
}

export interface Asset {
  _id?: string;
  type: 'capital' | 'revenue';
  departmentId: string;
  departmentName?: string;
  subcategory: string;
  academicYear: string;
  officer: {
    id: string;
    name: string;
  };
  items: AssetItem[];
  grandTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AssetsState {
  assets: Asset[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    type?: 'capital' | 'revenue';
    departmentId?: string;
    subcategory?: string;
    vendorName?: string;
    academicYear?: string;
  };
}

// ====================================================================
// API RESPONSE INTERFACES (NEW FOR TYPE SAFETY)
// ====================================================================

interface FetchAssetsResponse {
  data: Asset[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SingleAssetResponse {
  data: Asset;
}

// ====================================================================
// INITIAL STATE (UNCHANGED)
// ====================================================================

const initialState: AssetsState = {
  assets: [],
  loading: false,
  actionLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// ====================================================================
// ASYNC THUNKS (UPDATED WITH RETURN TYPES)
// ====================================================================

export const fetchAssets = createAsyncThunk<
  FetchAssetsResponse, // Success return type
  { // Params type
    type?: 'capital' | 'revenue';
    page?: number;
    limit?: number;
    departmentId?: string;
    subcategory?: string;
    vendorName?: string;
    academicYear?: string;
  }
>(
  'assets/fetchAssets',
  async (params) => {
    const response = await api.get('/assets', { params });
    return response.data;
  }
);

export const createAsset = createAsyncThunk<
  SingleAssetResponse, // Success return type (API should return the created asset)
  Asset // Argument type
>(
  'assets/createAsset',
  async (assetData) => {
    const formData = new FormData();

    // Build clean payload without File objects and with normalized dates
    const cleanPayload = {
      type: assetData.type,
      departmentId: assetData.departmentId,
      subcategory: assetData.subcategory,
      academicYear: assetData.academicYear,
      officer: assetData.officer,
      items: assetData.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        pricePerItem: item.pricePerItem,
        totalAmount: item.totalAmount,
        vendorName: item.vendorName,
        vendorAddress: item.vendorAddress || '',
        contactNumber: item.contactNumber, // Removed unnecessary || '' as type requires it
        email: item.email, // Removed unnecessary || '' as type requires it
        billNo: item.billNo || '',
        billDate: item.billDate ? new Date(item.billDate).toISOString() : undefined,
        billFileUrl: item.billFileUrl || '',
      })),
      grandTotal: assetData.grandTotal,
    };

    formData.append('payload', JSON.stringify(cleanPayload));

    // Attach files as itemFiles[] in index order
    assetData.items.forEach((item, index) => {
      if (item.billFile) {
        formData.append('itemFiles[]', item.billFile, `item_${index}_${item.billFile.name}`);
      }
    });

    const response = await api.post('/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const getAsset = createAsyncThunk<
  SingleAssetResponse, // Success return type (assuming you want to type the response)
  string // Argument type (id)
>(
  'assets/getAsset',
  async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  }
);

export const updateAsset = createAsyncThunk<
  SingleAssetResponse, // Success return type (API should return the updated asset)
  { id: string; assetData: Partial<Asset> } // Argument type
>(
  'assets/updateAsset',
  async ({ id, assetData }) => {
    const formData = new FormData();

    // Build clean payload without File objects and with normalized dates
    const cleanPayload = {
      type: assetData.type,
      departmentId: assetData.departmentId,
      subcategory: assetData.subcategory,
      academicYear: assetData.academicYear,
      officer: assetData.officer,
      items: assetData.items?.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        pricePerItem: item.pricePerItem,
        totalAmount: item.totalAmount,
        vendorName: item.vendorName,
        vendorAddress: item.vendorAddress || '',
        contactNumber: item.contactNumber || '',
        email: item.email || '',
        billNo: item.billNo || '',
        billDate: item.billDate ? new Date(item.billDate).toISOString() : undefined,
        billFileUrl: item.billFileUrl || '',
      })),
      grandTotal: assetData.grandTotal,
    };

    formData.append('payload', JSON.stringify(cleanPayload));

    // Attach files as itemFiles[] in index order
    assetData.items?.forEach((item, index) => {
      if (item.billFile) {
        formData.append('itemFiles[]', item.billFile, `item_${index}_${item.billFile.name}`);
      }
    });

    const response = await api.put(`/assets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const deleteAsset = createAsyncThunk<string, string>(
  'assets/deleteAsset',
  async (id) => {
    await api.delete(`/assets/${id}`);
    return id;
  }
);

// ====================================================================
// SLICE AND REDUCERS (UPDATED)
// ====================================================================

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AssetsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<AssetsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------------- Fetch assets ----------------
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload is now type-safe as FetchAssetsResponse
        state.assets = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        const err = action.error as AxiosError<{ message?: string }>;
        state.error = err.response?.data?.message || err.message || 'Failed to fetch assets';
      })

      // ---------------- Create asset ----------------
      .addCase(createAsset.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.actionLoading = false;
        // **FIX:** Add the newly created asset to the state
        state.assets.unshift(action.payload.data); 
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.actionLoading = false;
        const err = action.error as AxiosError<{ message?: string }>;
        state.error = err.response?.data?.message || err.message || 'Failed to create asset';
      })

      // ---------------- Update asset ----------------
      .addCase(updateAsset.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.actionLoading = false;
        // action.payload.data is now type-safe as Asset
        const index = state.assets.findIndex(asset => asset._id === action.payload.data._id);
        if (index !== -1) {
          state.assets[index] = action.payload.data;
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.actionLoading = false;
        const err = action.error as AxiosError<{ message?: string }>;
        state.error = err.response?.data?.message || err.message || 'Failed to update asset';
      })

      // ---------------- Delete asset ----------------
      .addCase(deleteAsset.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.assets = state.assets.filter(asset => asset._id !== action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.actionLoading = false;
        const err = action.error as AxiosError<{ message?: string }>;
        state.error = err.response?.data?.message || err.message || 'Failed to delete asset';
      })

      // ---------------- Get asset ----------------
      .addCase(getAsset.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(getAsset.fulfilled, (state) => {
        // NOTE: This reducer doesn't store the fetched asset in the global state, 
        // which is fine if you handle it locally (e.g., in a component).
        state.actionLoading = false; 
      })
      .addCase(getAsset.rejected, (state, action) => {
        state.actionLoading = false;
        const err = action.error as AxiosError<{ message?: string }>;
        state.error = err.response?.data?.message || err.message || 'Failed to fetch asset';
      });
  },
});

export const { setFilters, clearFilters, setPagination } = assetsSlice.actions;
export default assetsSlice.reducer;
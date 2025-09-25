import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface ReportItem {
  groupKey: string;
  items: any[];
  subtotal: number;
}

export interface ReportData {
  data: ReportItem[];
  grandTotal: number;
}

interface ReportsState {
  reportData: ReportData | null;
  loading: boolean;
  error: string | null;
  filters: {
    academicYear?: string;
    departmentId?: string;
    itemName?: string;
    vendorName?: string;
    groupBy?: 'department' | 'item' | 'vendor';
  };
}

const initialState: ReportsState = {
  reportData: null,
  loading: false,
  error: null,
  filters: {},
};

// Async thunks
export const generateReport = createAsyncThunk(
  'reports/generateReport',
  async (params: {
    academicYear?: string;
    departmentId?: string;
    itemName?: string;
    vendorName?: string;
    groupBy?: 'department' | 'item' | 'vendor';
  }) => {
    const response = await api.get('/reports', { params });
    return response.data;
  }
);

export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async (params: {
    format: 'excel' | 'word';
    academicYear?: string;
    departmentId?: string;
    itemName?: string;
    vendorName?: string;
    groupBy?: 'department' | 'item' | 'vendor';
  }) => {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report.${params.format === 'excel' ? 'xlsx' : 'docx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate report
      .addCase(generateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate report';
      })
      
      // Export report
      .addCase(exportReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to export report';
      });
  },
});

export const { setFilters, clearFilters } = reportsSlice.actions;
export default reportsSlice.reducer;
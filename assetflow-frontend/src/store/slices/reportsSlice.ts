import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface ReportGroup {
  groupKey: string;
  items: any[];
  subtotal: number;
}

export interface ReportData {
  data: ReportGroup[];
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
    groupBy: 'department' | 'item' | 'vendor';
  };
}

const initialState: ReportsState = {
  reportData: null,
  loading: false,
  error: null,
  filters: {
    groupBy: 'department',
  },
};

export const generateReport = createAsyncThunk(
  'reports/generateReport',
  async (filters: ReportsState['filters']) => {
    const response = await api.get('/reports', { params: filters });
    return response.data;
  }
);

export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async ({ format, filters }: { format: 'excel' | 'word'; filters: ReportsState['filters'] }) => {
    const response = await api.get(`/reports/export/${format}`, {
      params: filters,
      responseType: 'blob',
    });
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-report.${format === 'excel' ? 'xlsx' : 'docx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, format };
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ReportsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { groupBy: 'department' };
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(exportReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.loading = false;
        // File download handled in the thunk
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to export report';
      });
  },
});

export const { setFilters, clearFilters } = reportsSlice.actions;
export default reportsSlice.reducer;

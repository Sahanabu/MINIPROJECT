import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Department {
  _id: string;
  name: string;
  type: 'major' | 'academic' | 'service';
}

interface DepartmentsState {
  departments: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  departments: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async () => {
    const response = await api.get('/departments');
    return response.data;
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (departmentData: Omit<Department, '_id'>) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ id, departmentData }: { id: string; departmentData: Partial<Department> }) => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (id: string) => {
    await api.delete(`/departments/${id}`);
    return id;
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.data;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      })
      
      // Create department
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload.data);
      })
      
      // Update department
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex(dept => dept._id === action.payload.data._id);
        if (index !== -1) {
          state.departments[index] = action.payload.data;
        }
      })
      
      // Delete department
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(dept => dept._id !== action.payload);
      });
  },
});

export default departmentsSlice.reducer;
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer from './slices/assetsSlice';
import departmentsReducer from './slices/departmentsSlice';
import reportsReducer from './slices/reportsSlice';

export const store = configureStore({
  reducer: {
    assets: assetsReducer,
    departments: departmentsReducer,
    reports: reportsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
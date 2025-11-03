import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { patientsSlice } from './slices/patientsSlice';
import { recordsSlice } from './slices/recordsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    patients: patientsSlice.reducer,
    records: recordsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
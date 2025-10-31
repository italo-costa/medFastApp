import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: string[];
  observations: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface RecordsState {
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RecordsState = {
  records: [],
  selectedRecord: null,
  isLoading: false,
  error: null,
};

export const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    fetchRecordsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchRecordsSuccess: (state, action: PayloadAction<MedicalRecord[]>) => {
      state.isLoading = false;
      state.records = action.payload;
      state.error = null;
    },
    fetchRecordsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectRecord: (state, action: PayloadAction<MedicalRecord>) => {
      state.selectedRecord = action.payload;
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    addRecord: (state, action: PayloadAction<MedicalRecord>) => {
      state.records.push(action.payload);
    },
    updateRecord: (state, action: PayloadAction<MedicalRecord>) => {
      const index = state.records.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord = action.payload;
      }
    },
    removeRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(r => r.id !== action.payload);
      if (state.selectedRecord?.id === action.payload) {
        state.selectedRecord = null;
      }
    },
  },
});

export const {
  fetchRecordsStart,
  fetchRecordsSuccess,
  fetchRecordsFailure,
  selectRecord,
  clearSelectedRecord,
  addRecord,
  updateRecord,
  removeRecord,
} = recordsSlice.actions;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email?: string;
  address: string;
  emergencyContact: string;
  allergies: string[];
  medications: string[];
  createdAt: string;
  updatedAt: string;
}

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: PatientsState = {
  patients: [],
  selectedPatient: null,
  isLoading: false,
  error: null,
  searchQuery: '',
};

export const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    fetchPatientsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPatientsSuccess: (state, action: PayloadAction<Patient[]>) => {
      state.isLoading = false;
      state.patients = action.payload;
      state.error = null;
    },
    fetchPatientsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectPatient: (state, action: PayloadAction<Patient>) => {
      state.selectedPatient = action.payload;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    addPatient: (state, action: PayloadAction<Patient>) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
      if (state.selectedPatient?.id === action.payload.id) {
        state.selectedPatient = action.payload;
      }
    },
    removePatient: (state, action: PayloadAction<string>) => {
      state.patients = state.patients.filter(p => p.id !== action.payload);
      if (state.selectedPatient?.id === action.payload) {
        state.selectedPatient = null;
      }
    },
  },
});

export const {
  fetchPatientsStart,
  fetchPatientsSuccess,
  fetchPatientsFailure,
  selectPatient,
  clearSelectedPatient,
  setSearchQuery,
  addPatient,
  updatePatient,
  removePatient,
} = patientsSlice.actions;
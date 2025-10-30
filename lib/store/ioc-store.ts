import { create } from 'zustand';
import { IOCResult, BulkAnalysisResult, FileAnalysisResult } from '../api/types';

interface IOCStore {
  
  singleResult: IOCResult | null;
  bulkResults: BulkAnalysisResult | null;
  fileResult: FileAnalysisResult | null;
  

  isAnalyzing: boolean;
  isBulkAnalyzing: boolean;
  isFileAnalyzing: boolean;
  
 
  error: string | null;

  analysisHistory: IOCResult[];
  
  // Actions
  setSingleResult: (result: IOCResult | null) => void;
  setBulkResults: (results: BulkAnalysisResult | null) => void;
  setFileResult: (result: FileAnalysisResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setBulkAnalyzing: (analyzing: boolean) => void;
  setFileAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: IOCResult) => void;
  clearHistory: () => void;
  clearResults: () => void;
}

export const useIOCStore = create<IOCStore>((set, get) => ({

  singleResult: null,
  bulkResults: null,
  fileResult: null,
  isAnalyzing: false,
  isBulkAnalyzing: false,
  isFileAnalyzing: false,
  error: null,
  analysisHistory: [],

  
  setSingleResult: (result) => {
    set({ singleResult: result });
    if (result) {
      get().addToHistory(result);
    }
  },

  setBulkResults: (results) => {
    set({ bulkResults: results });
    if (results?.results) {
      const currentHistory = get().analysisHistory;
      const newHistory = [...currentHistory, ...results.results];
   
      const limitedHistory = newHistory.slice(-100);
      set({ analysisHistory: limitedHistory });
    }
  },

  setFileResult: (result) => set({ fileResult: result }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setBulkAnalyzing: (analyzing) => set({ isBulkAnalyzing: analyzing }),
  setFileAnalyzing: (analyzing) => set({ isFileAnalyzing: analyzing }),
  setError: (error) => set({ error }),

  addToHistory: (result) => {
    const currentHistory = get().analysisHistory;
    const existingIndex = currentHistory.findIndex(r => r.id === result.id);
    
    let newHistory;
    if (existingIndex >= 0) {
  
      newHistory = [...currentHistory];
      newHistory[existingIndex] = result;
    } else {

      newHistory = [result, ...currentHistory];
    }
    
    const limitedHistory = newHistory.slice(0, 100);
    set({ analysisHistory: limitedHistory });
  },

  clearHistory: () => set({ analysisHistory: [] }),
  
  clearResults: () => set({ 
    singleResult: null, 
    bulkResults: null, 
    fileResult: null,
    error: null 
  }),
}));
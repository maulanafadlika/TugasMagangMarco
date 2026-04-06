import { create } from 'zustand';

export const useUploadFile = create((set) => ({
  dataFileName: '',
  setDataFileName: (data) => set({ dataFileName: data }),

  filesEvent: {
    tasklist: [],
    subtasklist: [],
  },
  setFilesEvent: (type, updater) =>
    set((state) => ({
      filesEvent: {
        ...state.filesEvent,
        [type]: typeof updater === 'function' ? updater(state.filesEvent[type]) : updater,
      },
    })),

  cleanUploadFile: () =>
    set({
      dataFileName: '',
      filesEvent: {
        tasklist: [],
        subtasklist: [],
      },
    }),
}));

import { create } from 'zustand'

export const useDashboard = create((set) => ({
  openModal: false,
  setOpenModal: (data) => set({ openModal: data }),

  dataProgres: '',
  setDataProgres: (data) => set({ dataProgres: data }),

  openDetail: false,
  setOpenDetail: (data) => set({ openDetail: data }),

  
  currentPage: 0,
  setCurrentPage: (data) => set({ currentPage: data }),

  payloadStatus: { status_id: '', project_id: '',status_name:'' },
  setPayloadStatus: (data) =>
    set((state) => ({
      payloadStatus: {
        ...state.payloadStatus,
        ...data,
      },
    })),

  dataLink: "",
  setDataLink: (data) => set({ dataLink: data }),
}))

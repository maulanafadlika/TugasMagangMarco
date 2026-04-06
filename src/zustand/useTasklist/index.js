import { create } from 'zustand'

export const useTasklist = create((set) => ({
  openModalDelete: false,
  setOpenModalDelete: (data) => set({openModalDelete : data}),
  dataDelete: '',
  setDataDelete: (data) => set({dataDelete : data}),

}))
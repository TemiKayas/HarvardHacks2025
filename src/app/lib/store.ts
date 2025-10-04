import { create } from 'zustand';

// Define the shape of our store
interface FileStore {
  files: File[];
  setFiles: (files: File[]) => void;
}

// Create the store
export const useFileStore = create<FileStore>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
}));
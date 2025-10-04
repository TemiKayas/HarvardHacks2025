import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

//file metadata
export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

//class shape
export interface Class {
  id: string;
  files: FileMeta[];
}

//store state
interface ClassStore {
  classes: Class[];
  addClass: (newClass: Class) => void;
  getClassById: (id: string) => Class | undefined;
}

export const useClassStore = create<ClassStore>()(
  // The 'persist' middleware wraps our store definition
  persist(
    (set, get) => ({
      classes: [],
      addClass: (newClass) => {
        set((state) => ({
          classes: [...state.classes, newClass],
        }));
      },
      getClassById: (id) => {
        return get().classes.find((c) => c.id === id);
      },
    }),
    {
      name: 'class-storage', // The key used in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage
    }
  )
);
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
  name: string;
  files: FileMeta[];
}

//store state
interface ClassStore {
  classes: Class[];
  addClass: (newClass: Class) => void;
  getClassById: (id: string) => Class | undefined;
  deleteClass: (id: string) => void;
}

//rename class func
export const renameClass = (id: string) => {
    const newName = prompt('Enter new class name:');
    if (newName) {
        useClassStore.setState((state) => ({
        classes: state.classes.map((classItem) =>
            classItem.id === id ? { ...classItem, name: newName } : classItem
        ),
        }));
        alert(`Class renamed to: ${newName}`);
    }
};

export const useClassStore = create<ClassStore>()(
  persist(
    (set, get) => ({
      classes: [],
      addClass: (newClass) => {
        set((state) => ({
          classes: [...state.classes, newClass],
        }));
      },
      deleteClass: (id: string) => {
        set((state) => ({
          classes: state.classes.filter((cls) => cls.id !== id),
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
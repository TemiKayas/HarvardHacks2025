import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

//file metadata
export interface FileMeta {
  name: string;
  size: number;
  type: string;
  content?: string; // Store file content for AI processing
  selected?: boolean; // Track if file is selected for AI analysis
}

//generated content types
export interface QuizQuestion {
  question: string;
  type: 'MCQ' | 'TF';
  answerA?: string;
  answerB?: string;
  answerC?: string;
  answerD?: string;
  correctAnswer: string;
  explanation: string;
}

//student response types
export interface StudentResponse {
  studentName: string;
  answers: { [questionId: string]: string };
  timestamp: string;
  score?: number;
}

export interface GeneratedContent {
  quiz?: QuizQuestion[];
  summary?: string;
  keyPoints?: string;
  slides?: { title: string; content: string }[];
  lastGenerated?: string; // Track what was last generated
  htmlContent?: string; // Store HTML output from Gemini
  studentResponses?: StudentResponse[]; // Store student submissions
}

//class shape
export interface Class {
  id: string;
  name: string;
  files: FileMeta[];
  generatedContent?: GeneratedContent;
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

//store state
interface ClassStore {
  classes: Class[];
  addClass: (newClass: Class) => void;
  getClassById: (id: string) => Class | undefined;
  deleteClass: (id: string) => void;
  addFileToClass: (classId: string, file: FileMeta) => void;
  removeFileFromClass: (classId: string, fileIndex: number) => void;
  toggleFileSelection: (classId: string, fileIndex: number) => void;
  updateClassGeneratedContent: (classId: string, content: GeneratedContent) => void;
  addChatMessage: (classId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  updateQuizQuestion: (classId: string, questionIndex: number, question: QuizQuestion) => void;
  deleteQuizQuestion: (classId: string, questionIndex: number) => void;
  addStudentResponse: (classId: string, response: StudentResponse) => void;
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
      addFileToClass: (classId: string, file: FileMeta) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId ? { ...cls, files: [...cls.files, file] } : cls
          ),
        }));
      },
      removeFileFromClass: (classId: string, fileIndex: number) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId 
              ? { ...cls, files: cls.files.filter((_, index) => index !== fileIndex) }
              : cls
          ),
        }));
      },
      toggleFileSelection: (classId: string, fileIndex: number) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId 
              ? { 
                  ...cls, 
                  files: cls.files.map((file, index) => 
                    index === fileIndex ? { ...file, selected: !file.selected } : file
                  )
                }
              : cls
          ),
        }));
      },
      updateClassGeneratedContent: (classId: string, content: GeneratedContent) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId 
              ? { ...cls, generatedContent: { ...cls.generatedContent, ...content } }
              : cls
          ),
        }));
      },
      addChatMessage: (classId: string, message: { role: 'user' | 'assistant'; content: string }) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId 
              ? { 
                  ...cls, 
                  chatHistory: [...(cls.chatHistory || []), message]
                }
              : cls
          ),
        }));
      },
      updateQuizQuestion: (classId: string, questionIndex: number, question: QuizQuestion) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId && cls.generatedContent?.quiz
              ? { 
                  ...cls, 
                  generatedContent: {
                    ...cls.generatedContent,
                    quiz: cls.generatedContent.quiz.map((q, index) => 
                      index === questionIndex ? question : q
                    )
                  }
                }
              : cls
          ),
        }));
      },
      deleteQuizQuestion: (classId: string, questionIndex: number) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId && cls.generatedContent?.quiz
              ? { 
                  ...cls, 
                  generatedContent: {
                    ...cls.generatedContent,
                    quiz: cls.generatedContent.quiz.filter((_, index) => index !== questionIndex)
                  }
                }
              : cls
          ),
        }));
      },
      addStudentResponse: (classId: string, response: StudentResponse) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId
              ? { 
                  ...cls, 
                  generatedContent: {
                    ...cls.generatedContent,
                    studentResponses: [...(cls.generatedContent?.studentResponses || []), response]
                  }
                }
              : cls
          ),
        }));
      },
    }),
    {
      name: 'class-storage', // The key used in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage
    }
  )
);
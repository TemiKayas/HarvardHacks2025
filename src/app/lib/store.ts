import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

//file data structure
export interface FileData {
  name: string;
  size: number;
  type: string;
  extractedText?: string; // Store extracted text from PDF processing
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

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudentResponse {
  studentName: string;
  answers: { [questionIndex: number]: string };
  score: number;
  totalQuestions: number;
  submittedAt: Date;
  classId: string;
}

export interface QRCodeData {
  dataURL: string;
  url?: string;
  generatedAt: Date;
  classId: string;
}

export interface GeneratedContent {
  quiz?: QuizQuestion[];
  summary?: string;
  keyPoints?: string;
  flashcards?: Flashcard[];
  lastGenerated?: string; // Track what was last generated
  qrCode?: QRCodeData; // QR code for student access
  studentResponses?: StudentResponse[]; // Student quiz responses
}

//class shape
export interface Class {
  id: string;
  name: string;
  files: FileData[];
  generatedContent?: GeneratedContent;
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

//terminal log entry
export interface TerminalLog {
  timestamp: Date;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

//store state
interface ClassStore {
  classes: Class[];
  terminalLogs: TerminalLog[];
  addClass: (newClass: Class) => void;
  getClassById: (id: string) => Class | undefined;
  deleteClass: (id: string) => void;
  addFileToClass: (classId: string, file: FileData) => void;
  removeFileFromClass: (classId: string, fileIndex: number) => void;
  toggleFileSelection: (classId: string, fileIndex: number) => void;
  updateClassGeneratedContent: (classId: string, content: GeneratedContent) => void;
  addChatMessage: (classId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  updateQuizQuestion: (classId: string, questionIndex: number, question: QuizQuestion) => void;
  deleteQuizQuestion: (classId: string, questionIndex: number) => void;
  addQuizQuestion: (classId: string, question: QuizQuestion) => void;
  updateClassName: (classId: string, newName: string) => void;
  addTerminalLog: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  clearTerminalLogs: () => void;
  generateQRCode: (classId: string, url: string) => Promise<void>;
  addStudentResponse: (classId: string, response: StudentResponse) => void;
  clearStudentResponses: (classId: string) => void;
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
      terminalLogs: [],
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
      addFileToClass: (classId: string, file: FileData) => {
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
      addQuizQuestion: (classId: string, question: QuizQuestion) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  generatedContent: {
                    ...cls.generatedContent,
                    quiz: [...(cls.generatedContent?.quiz || []), question]
                  }
                }
              : cls
          ),
        }));
      },
      updateClassName: (classId: string, newName: string) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId ? { ...cls, name: newName } : cls
          ),
        }));
      },
      addTerminalLog: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => {
        set((state) => ({
          terminalLogs: [...state.terminalLogs, { timestamp: new Date(), message, type }],
        }));
      },
      clearTerminalLogs: () => {
        set({ terminalLogs: [] });
      },
      generateQRCode: async (classId: string, url: string) => {
        try {
          // Import QRGenerator dynamically to avoid SSR issues
          const QRGenerator = (await import('./qr-generator')).default;
          const qrResult = await QRGenerator.generateQRCode(url);

          if (qrResult.success) {
            set((state) => ({
              classes: state.classes.map((cls) =>
                cls.id === classId
                  ? {
                      ...cls,
                      generatedContent: {
                        ...cls.generatedContent,
                        qrCode: {
                          dataURL: qrResult.dataURL,
                          url: qrResult.url,
                          generatedAt: new Date(),
                          classId: classId
                        }
                      }
                    }
                  : cls
              ),
            }));
          } else {
            throw new Error(qrResult.error);
          }
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          throw error;
        }
      },
      addStudentResponse: (classId: string, response: StudentResponse) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  generatedContent: {
                    ...cls.generatedContent,
                    studentResponses: [
                      ...(cls.generatedContent?.studentResponses || []),
                      response
                    ]
                  }
                }
              : cls
          ),
        }));
      },
      clearStudentResponses: (classId: string) => {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  generatedContent: {
                    ...cls.generatedContent,
                    studentResponses: []
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
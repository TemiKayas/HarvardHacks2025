"use client";

import { useCallback, useState, useEffect, MouseEvent as ReactMouseEvent, useRef } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClassStore, Class, FileData, renameClass } from './lib/store';

// === Component Definitions ===

const Navbar = () => (
  <nav className="bg-[gray] text-white text-3xl p-4 font-bold shadow-md">
    StudySync
  </nav>
);

// MODIFIED: ClassCard is now a more complex component with its own state for the delete menu
const ClassCard = ({ cls, onDelete }: { cls: Class; onDelete: (id: string) => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // This function opens the menu but stops the click from navigating to the class page
  const handleMenuClick = (e: ReactMouseEvent) => {
    e.stopPropagation(); // Prevents the Link from being triggered
    e.preventDefault(); // Prevents default browser behavior
    setMenuOpen(!menuOpen);
  };

  // This function handles the delete action
  const handleDeleteClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(cls.id);
    setMenuOpen(false); // Close the menu after deleting
  };

  // This function handles the rename action
  const handleRenameClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    renameClass(cls.id);
    setMenuOpen(false); // Close the menu after renaming
  };

  return (
    <div className="relative bg-transparent bg-opacity-80 border border-zinc-200 rounded-lg p-6 hover:shadow-xl hover:border-blue-500 transition-all duration-200">
      {/* The Link now wraps the main content area */}
      <Link href={`/class/${cls.id}`} className="block cursor-pointer">
        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{cls.name}</h3>
        <p className="text-sm text-zinc-500">{cls.files.length} file(s)</p>
      </Link>
      
      {/* Three-dot menu button */}
      <button onClick={handleMenuClick} className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
      </button>

      {/* Dropdown Menu (only appears if menuOpen is true) */}
      {menuOpen && (
        <div ref={menuRef} className="absolute top-12 right-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-10">
          <button 
            onClick={handleRenameClick} 
            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Rename Lesson
          </button>
          <button 
            onClick={handleDeleteClick} 
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Delete Lesson
          </button>
        </div>
      )}
    </div>
  );
};


// CreateClassModal Component
const CreateClassModal = ({ onClose, addClass }: { onClose: () => void; addClass: (newClass: Class) => void; }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCreateClass = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const newClassId = String(Date.now());

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          // Check file size (warn if > 2MB)
          if (file.size > 2 * 1024 * 1024) {
            console.warn(`Large file detected: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
          }

          // Only process PDFs
          if (file.type === 'application/pdf') {
            setProcessingStatus(`Processing ${file.name}...`);

            // Convert to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get pure base64
                const base64Data = result.split(',')[1];
                resolve(base64Data);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Send to server for text extraction
            const response = await fetch('/api/process-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
            });

            if (!response.ok) {
              throw new Error(`Failed to process ${file.name}`);
            }

            const { extractedText } = await response.json();

            return {
              name: file.name,
              size: file.size,
              type: file.type,
              extractedText,
              selected: false,
            };
          } else {
            // Non-PDF files - store as-is without processing
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              selected: false,
            };
          }
        })
      );

      addClass({
        id: newClassId,
        name: 'Untitled Lesson',
        files: processedFiles,
      });

      router.push(`/class/${newClassId}`);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Create New Class & Upload Files</h2>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center w-full h-64 p-4 border-2 border-dashed rounded-lg cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-300 dark:border-zinc-600'} transition-colors`}
        >
          <input {...getInputProps()} />
          {isDragActive ? <p className="text-blue-500">Drop the files here ...</p> : <p className="text-zinc-500 dark:text-zinc-400">Drag & drop files here, or <span className="font-semibold text-blue-600">click to browse</span></p>}
        </div>
        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Uploaded Files:</h4>
            <ul className="list-disc list-inside bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded">
              {files.map((file, i) => (<li key={i}>{file.name}</li>))}
            </ul>
          </div>
        )}
        {processingStatus && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">{processingStatus}</p>
          </div>
        )}
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={isProcessing}>Cancel</button>
          <button onClick={handleCreateClass} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:bg-zinc-400" disabled={files.length === 0 || isProcessing}>
            {isProcessing ? 'Processing...' : 'Create Class'}
          </button>
        </div>
      </div>
    </div>
  );
};


// === Main Page Component ===

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  //Get the actual classes and the addClass function from the store.

  
  // Get all necessary functions from the store
  const classes = useClassStore((state) => state.classes);
  const addClass = useClassStore((state) => state.addClass);
  const deleteClass = useClassStore((state) => state.deleteClass);

  // This pattern prevents errors when rendering content from localStorage
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Classes</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white font-semibold rounded-lg shadow-md px-5 py-2.5 hover:bg-blue-700 transition-colors"
          >
            + New Class
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} onDelete={deleteClass} />
          ))}
        </div>
      </main>
      {isModalOpen && <CreateClassModal onClose={() => setIsModalOpen(false)} addClass={addClass} />}
    </div>
  );
}
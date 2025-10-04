"use client";

import { useClassStore, renameClass, FileMeta } from '../../lib/store';
import { useEffect, useState, use, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import Link from 'next/link';

export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const getClassById = useClassStore((state) => state.getClassById);
  const addFileToClass = useClassStore((state) => state.addFileToClass);
  const removeFileFromClass = useClassStore((state) => state.removeFileFromClass);
  const classData = getClassById(resolvedParams.id);
  
  //rename logic
  const handleRename = () => {
    renameClass(resolvedParams.id);
  };

  // File upload logic
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    acceptedFiles.forEach((file) => {
      const fileMeta: FileMeta = {
        name: file.name,
        size: file.size,
        type: file.type,
      };
      addFileToClass(resolvedParams.id, fileMeta);
    });
  }, [resolvedParams.id, addFileToClass]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // File delete logic
  const handleDeleteFile = (fileIndex: number) => {
    removeFileFromClass(resolvedParams.id, fileIndex);
  };

  // This prevents hydration errors by waiting for the component to mount on the client
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="p-8">Loading class data...</div>; // Show a loading state
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header with back button and title */}
      <div className="flex items-center gap-4 p-6 border-b border-zinc-200 dark:border-zinc-700">
        <Link href="/" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Link>
        {classData ? (
          <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors" onClick={handleRename}>
            {classData.name}
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-zinc-500">Loading...</h1>
        )}
      </div>

      {classData ? (
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Column - File Management */}
          <div className="w-1/4 border-r border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Files</h2>
            <div className="space-y-2">
              {classData.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteFile(index)}
                    className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18"/>
                      <path d="M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
              <div 
                {...getRootProps()} 
                className={`w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <input {...getInputProps()} />
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Middle Column - Chat */}
          <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Chat with Gemini</h2>
            <div className="h-full bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-zinc-500 text-center mt-8">Chat functionality will be implemented soon...</p>
            </div>
          </div>

          {/* Right Column - Button Dashboard */}
          <div className="w-1/4 p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="grid grid-cols-2 gap-3 h-full">
              <button className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                Generate Summary
              </button>
              <button className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                Create Quiz
              </button>
              <button className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                Extract Key Points
              </button>
              <button className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                Generate Questions
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-center text-red-500">Error: Could not find data for class ID: {resolvedParams.id}</p>
        </div>
      )}
    </div>
  );
}
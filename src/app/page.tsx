//=== Imports ====
"use client";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

//=== Logic ====

interface ClassCardProps {
  name: string;
}

const Navbar = () => (
  <nav className="bg-[gray] text-white text-3xl p-4 font-bold shadow-md">
    TA+
  </nav>
);

const ClassCard = ({ name }: ClassCardProps) => (
  <div className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all duration-200">
    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{name}</h3>
  </div>
);

interface CreateClassModalProps {
  onClose: () => void;
}

const CreateClassModal = ({ onClose }: CreateClassModalProps) => {
  // State to hold the uploaded files
  const [files, setFiles] = useState<File[]>([]);

  // This function will be called when files are dropped
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Here, you would handle the file upload logic.
    // For now, we'll just add them to our state.
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    console.log(acceptedFiles);
  }, []);

  // Initialize the dropzone hook
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Create New Class & Upload Files</h2>
        
        {/*Dropzone*/}
        <div 
          {...getRootProps()} 
          className={`flex flex-col items-center justify-center w-full h-64 p-4 border-2 border-dashed rounded-lg cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-300 dark:border-zinc-600'}
            transition-colors`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-500">Drop the files here ...</p>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              Drag & drop files here, or{' '}
              <span className="font-semibold text-blue-600">click to browse</span>
            </p>
          )}
        </div>
        
        {/* Display the names of the uploaded files */}
        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Uploaded Files:</h4>
            <ul className="list-disc list-inside bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded">
              {files.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:bg-zinc-400" disabled={files.length === 0}>
            Create Class
          </button>
        </div>
      </div>
    </div>
  );
};

//=== Page Render ====

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const classes: { name: string }[] = [
    { name: 'Intro to Physics' },
    { name: 'American History 101' },
  ];

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
          {classes.map((cls, index) => (
            <ClassCard key={index} name={cls.name} />
          ))}
        </div>
      </main>
      {isModalOpen && <CreateClassModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
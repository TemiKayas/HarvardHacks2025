"use client";

import { useCallback, useState, useEffect } from 'react'; // FIX: Added useEffect
import { useDropzone, FileWithPath } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // FIX: Added Link for navigation
import { useClassStore, Class, FileMeta } from './lib/store'; // FIX: Import all necessary types

// === Component Definitions ===

// Navbar (No changes needed)
const Navbar = () => (
  <nav className="bg-[gray] text-white text-3xl p-4 font-bold shadow-md">
    TA+
  </nav>
);

// ClassCard (No changes needed, but will be wrapped in a Link)
const ClassCard = ({ name, fileCount }: { name: string; fileCount: number }) => (
  <div className="bg-transparent bg-opacity-80 border border-zinc-200 rounded-lg p-6 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all duration-200">
    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{name}</h3>
    <p className="text-sm text-zinc-500">{fileCount} file(s)</p>
  </div>
);

// CreateClassModal Props
interface CreateClassModalProps {
  onClose: () => void;
  addClass: (newClass: Class) => void; // FIX: Prop for the addClass function
}

// CreateClassModal Component
const CreateClassModal = ({ onClose, addClass }: CreateClassModalProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCreateClass = () => {
    //Generate the ID ONCE and use it for both saving and navigating.
    const newClassId = String(Date.now());

    //Convert the File array to the FileMeta array format the store expects.
    const fileMetas: FileMeta[] = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    //Call the addClass function with the correctly shaped object.
    addClass({
      id: newClassId,
      files: fileMetas,
    });

    //Navigate using the SAME ID that was saved to the store.
    router.push(`/class/${newClassId}`);
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
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button onClick={handleCreateClass} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:bg-zinc-400" disabled={files.length === 0}>Create Class</button>
        </div>
      </div>
    </div>
  );
};

// === Main Page Component ===

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  //Get the actual classes and the addClass function from the store.
  const classes = useClassStore((state) => state.classes);
  const addClass = useClassStore((state) => state.addClass);

  //This pattern prevents errors when rendering content from localStorage.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Or return a loading spinner
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
            <Link href={`/class/${cls.id}`} key={cls.id}>
              <ClassCard name={`Class ${cls.id}`} fileCount={cls.files.length} />
            </Link>
          ))}
        </div>
      </main>
      {isModalOpen && <CreateClassModal onClose={() => setIsModalOpen(false)} addClass={addClass} />}
    </div>
  );
}
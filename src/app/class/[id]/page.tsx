"use client";

import { useClassStore } from '../../lib/store';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClassPage({ params }: { params: { id: string } }) {
  const getClassById = useClassStore((state) => state.getClassById);
  
  const classData = getClassById(params.id);

  // This prevents hydration errors by waiting for the component to mount on the client
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="p-8">Loading class data...</div>; // Show a loading state
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-8">
      <Link href="/" className="text-blue-500 hover:underline mb-6 block">&larr; Back to Dashboard</Link>
      
      {classData ? (
        <div>
          <h1 className="text-3xl font-bold mb-2">Class Details</h1>
          <p className="text-zinc-500 mb-6">Displaying content for class ID: {params.id}</p>
          
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>

          <ul className="list-disc list-inside bg-white dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {classData.files.map((file, index) => (
              <li key={index} className="mb-1">{file.name} ({Math.round(file.size / 1024)} KB)</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-red-500 mt-12">Error: Could not find data for class ID: {params.id}</p>
      )}
    </div>
  );
}
"use client";

import { useFileStore } from '../../lib/store';

export default function ClassPage({ params }: { params: { id: string } }) {
  // Read the files from our global store
  const files = useFileStore((state) => state.files);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-2">Class Details</h1>
      <p className="text-zinc-500 mb-6">Displaying content for class ID: {params.id}</p>
      
      {files.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <ul className="list-disc list-inside bg-white dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {files.map((file, index) => (
              <li key={index} className="mb-1">{file.name} ({Math.round(file.size / 1024)} KB)</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-zinc-500 mt-12">No files were uploaded for this class.</p>
      )}
    </div>
  );
}
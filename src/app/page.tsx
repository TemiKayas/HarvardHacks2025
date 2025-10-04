//Imports ====
"use client";
import { useState } from 'react';

//Logic ====

interface ClassCardProps {
  name: string;
}

interface CreateClassModalProps {
  onClose: () => void;
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

const CreateClassModal = ({ onClose }: CreateClassModalProps) => (
  <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-2xl w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Create a New Class</h2>
      <input 
        type="text" 
        placeholder="Enter class name..."
        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-800 mb-4"
      />
      <div className="flex justify-end gap-4">
        <button onClick={onClose} className="px-4 py-2 rounded font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
        <button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700">Create</button>
      </div>
    </div>
  </div>
);

//Page Export ====

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
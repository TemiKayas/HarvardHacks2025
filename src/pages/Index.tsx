import { useState } from 'react';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';

interface ClassCardProps {
  name: string;
}

interface CreateClassModalProps {
  onClose: () => void;
}

const Navbar = () => <nav className={styles.navbar}>Teacher's Assistant</nav>;

const ClassCard = ({ name }: ClassCardProps) => <div className={styles.classCard}>{name}</div>;

const CreateClassModal = ({ onClose }: CreateClassModalProps) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>Create a New Class</h2>
      <input type="text" placeholder="Enter class name..." />
      <button>Create</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  </div>
);

// --- Page Component ---

const HomePage: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Dummy data
  const classes: { name: string }[] = [
    { name: 'Intro to Physics' },
    { name: 'American History 101' },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <h1>Your Classes</h1>
          <button className={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
            + New Class
          </button>
        </div>
        <div className={styles.classGrid}>
          {classes.map((cls, index) => (
            <ClassCard key={index} name={cls.name} />
          ))}
        </div>
      </main>
      {isModalOpen && <CreateClassModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default HomePage;
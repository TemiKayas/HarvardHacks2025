import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import navbar from 'globals';

// --- Barebones Placeholder Components & Types ---

interface ActionButtonProps {
  label: string;
}

const Navbar = () => <nav className="navbar">Teacher's Assistant</nav>;

const Uploader = () => <div className={styles.uploader}>Drag & Drop Files Here</div>;

const ActionButton = ({ label }: ActionButtonProps) => (
  <button className={styles.actionButton}>{label}</button>
);

// --- Page Component ---

const WorkspacePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query; // `id` can be string, string[], or undefined

  // Dummy data
  const documents: string[] = ['lecture-notes.pdf', 'syllabus.docx'];

  return (
    <>
      <Navbar />
      <div className={styles.workspaceContainer}>
        {/* Left Panel: Sources */}
        <aside className={styles.panel}>
          <h2>Sources</h2>
          <Uploader />
          <ul className={styles.documentList}>
            {documents.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </aside>

        {/* Center Panel: Main Content */}
        <main className={styles.mainPanel}>
          <h2>Project Description for Class: {id}</h2>
          <textarea
            className={styles.mainTextarea}
            placeholder="Your main content, notes, or AI responses will appear here..."
          />
        </main>

        {/* Right Panel: Actions */}
        <aside className={styles.panel}>
          <h2>Actions</h2>
          <div className={styles.actionGrid}>
            <ActionButton label="Generate Quiz 📝" />
            <ActionButton label="Create Summary ✨" />
            <ActionButton label="Get QR Code 🔳" />
          </div>
        </aside>
      </div>
    </>
  );
};

export default WorkspacePage;
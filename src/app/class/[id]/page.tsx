"use client";

import { useClassStore, FileData, QuizQuestion, GeneratedContent } from '../../lib/store';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import QuizDisplay from '../../components/quiz-display/QuizDisplay';
import SummaryDisplay from '../../components/summary-display/SummaryDisplay';
import KeyPointsDisplay from '../../components/keypoints-display/KeyPointsDisplay';
import FlashcardsDisplay from '../../components/flashcards-display/FlashcardsDisplay';
import Terminal from '../../components/terminal/Terminal';

export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  // Use reactive selectors for real-time updates
  const classData = useClassStore((state) => state.classes.find(c => c.id === resolvedParams.id));
  const removeFileFromClass = useClassStore((state) => state.removeFileFromClass);
  const toggleFileSelection = useClassStore((state) => state.toggleFileSelection);
  const updateClassGeneratedContent = useClassStore((state) => state.updateClassGeneratedContent);
  const updateQuizQuestion = useClassStore((state) => state.updateQuizQuestion);
  const deleteQuizQuestion = useClassStore((state) => state.deleteQuizQuestion);
  const updateClassName = useClassStore((state) => state.updateClassName);
  const addTerminalLog = useClassStore((state) => state.addTerminalLog);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'quiz' | 'summary' | 'keyPoints' | 'flashcards' | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  // Title editing logic
  const handleStartEditTitle = () => {
    setEditingTitle(classData?.name || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle.trim() !== classData?.name) {
      updateClassName(resolvedParams.id, editingTitle.trim());
      addTerminalLog(`Class renamed to: ${editingTitle.trim()}`, 'success');
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setEditingTitle('');
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };


  // File delete logic
  const handleDeleteFile = (fileIndex: number) => {
    removeFileFromClass(resolvedParams.id, fileIndex);
  };

  // File selection toggle
  const handleToggleFileSelection = (fileIndex: number) => {
    toggleFileSelection(resolvedParams.id, fileIndex);
  };

  // AI Functions

  const handleActionButton = async (action: string) => {
    if (!classData?.files.some(f => f.selected)) {
      alert('Please select at least one file for analysis');
      return;
    }

    const selectedFiles = classData.files.filter(f => f.selected);

    // Handle different actions with switch statement
    switch (action) {
      case 'quiz':
        await handleQuizGeneration(selectedFiles);
        break;
      case 'summary':
      case 'keyPoints':
      case 'flashcards':
        setCurrentAction(action);
        await generateContent(action, selectedFiles);
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleQuizGeneration = async (selectedFiles: FileData[]) => {
    setIsGenerating(true);
    setCurrentAction('quiz');
    addTerminalLog('Starting quiz generation...', 'info');

    try {
      // Get extracted text from selected PDFs
      const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf' && f.extractedText);

      if (pdfFiles.length === 0) {
        addTerminalLog('No PDF files with extracted text found', 'error');
        alert('No PDF files with extracted text found. Please upload and process PDF files first.');
        return;
      }

      addTerminalLog(`Processing ${pdfFiles.length} PDF file(s)...`, 'info');

      // Combine text from all selected PDFs
      const combinedText = pdfFiles.map(f => f.extractedText).join('\n\n');

      addTerminalLog('Sending request to quiz generation API...', 'info');

      // Call quiz generation API
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: combinedText,
          numQuestions: 5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const result = await response.json();

      addTerminalLog(`Generated ${result.quiz.questions.length} quiz questions`, 'success');

      // Update store with generated quiz
      updateClassGeneratedContent(resolvedParams.id, {
        quiz: result.quiz.questions,
        lastGenerated: 'quiz'
      });

      // Set active tab to quiz
      setActiveTab('quiz');

      addTerminalLog('Quiz generation complete', 'success');

    } catch (error) {
      console.error('Error generating quiz:', error);
      addTerminalLog('Quiz generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContent = async (action: string, selectedFiles: FileData[]) => {
    setIsGenerating(true);

    const extractedText = selectedFiles.map(f => f.extractedText || '').join('\n\n');

    addTerminalLog(`Starting ${action} generation...`, 'info');

    try {
      // Determine which API endpoint to call based on action
      const endpointMap: { [key: string]: string } = {
        'summary': '/api/generate-summary',
        'keyPoints': '/api/generate-keypoints',
        'flashcards': '/api/generate-flashcards'
      };

      const endpoint = endpointMap[action];
      if (!endpoint) {
        throw new Error(`Unknown action: ${action}`);
      }

      addTerminalLog(`Processing ${selectedFiles.length} file(s)...`, 'info');
      addTerminalLog(`Sending request to ${action} API...`, 'info');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText,
          details: '' // No additional details needed
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate content');
      }

      addTerminalLog(`${action} generated successfully`, 'success');

      // Update store with generated content
      const generatedContent: GeneratedContent = {
        [action]: result[action] || result.summary || result.keyPoints || result.flashcards,
        lastGenerated: action
      };

      updateClassGeneratedContent(resolvedParams.id, generatedContent);

      // Set active tab based on generated content
      setActiveTab(action as 'summary' | 'keyPoints' | 'flashcards');

      addTerminalLog(`${action} generation complete`, 'success');

    } catch (error) {
      console.error('Error generating content:', error);
      addTerminalLog(`${action} generation failed: ` + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // New handler functions
  const handleQRCode = () => {
    // Placeholder for QR code functionality
    alert('QR Code functionality will be implemented soon!');
  };

  const handleInstructorDashboard = () => {
    // Navigate to instructor dashboard
    window.open(`/instructor/${resolvedParams.id}`, '_blank');
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        {classData ? (
          isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveTitle}
                className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                title="Save"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </button>
              <button
                onClick={handleCancelEditTitle}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Cancel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{classData.name}</h1>
              <button
                onClick={handleStartEditTitle}
                className="p-1 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Edit title"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )
        ) : (
          <h1 className="text-2xl font-bold text-zinc-500">Loading...</h1>
        )}
      </div>

      {classData ? (
        <div className="flex h-[calc(100vh-120px)]">
          {/* Left Column - File Management */}
          <div className="w-1/4 border-r border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Files</h2>
            <div className="space-y-2">
              {classData.files.map((file, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${file.selected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                  }`}>
                  <div 
                    className="flex items-center flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleToggleFileSelection(index)}
                  >
                    <input
                      type="checkbox"
                      checked={file.selected || false}
                      onChange={() => handleToggleFileSelection(index)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">{Math.round(file.size / 1024)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(index)}
                    className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column - Preview */}
          <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-700 p-6 flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>

            {/* Tab Navigation */}
            {(classData.generatedContent?.quiz || classData.generatedContent?.summary || classData.generatedContent?.keyPoints || classData.generatedContent?.flashcards) && (
              <div className="flex gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700">
                {classData.generatedContent.quiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'quiz'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Quiz
                  </button>
                )}
                {classData.generatedContent.summary && (
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'summary'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Summary
                  </button>
                )}
                {classData.generatedContent.keyPoints && (
                  <button
                    onClick={() => setActiveTab('keyPoints')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'keyPoints'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Key Points
                  </button>
                )}
                {classData.generatedContent.flashcards && (
                  <button
                    onClick={() => setActiveTab('flashcards')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'flashcards'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Flashcards
                  </button>
                )}
              </div>
            )}

            {/* Content Preview */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'quiz' && classData.generatedContent?.quiz ? (
                <QuizDisplay
                  questions={classData.generatedContent.quiz.filter(q => q.type === 'MCQ') as any}
                  onClose={() => setActiveTab(null)}
                />
              ) : activeTab === 'summary' && classData.generatedContent?.summary ? (
                <SummaryDisplay
                  summary={classData.generatedContent.summary}
                  onClose={() => setActiveTab(null)}
                />
              ) : activeTab === 'keyPoints' && classData.generatedContent?.keyPoints ? (
                <KeyPointsDisplay
                  keyPoints={classData.generatedContent.keyPoints}
                  onClose={() => setActiveTab(null)}
                />
              ) : activeTab === 'flashcards' && classData.generatedContent?.flashcards ? (
                <FlashcardsDisplay
                  flashcards={classData.generatedContent.flashcards}
                  onClose={() => setActiveTab(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  <p>Select files and generate content to preview here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Terminal */}
          <div className="w-1/4 p-6 flex flex-col h-full">
            {/* Actions Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleActionButton('summary')}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Generate Summary
                </button>
                <button
                  onClick={() => handleActionButton('quiz')}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => handleActionButton('keyPoints')}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Extract Key Points
                </button>
                <button
                  onClick={() => handleActionButton('flashcards')}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Generate Flashcards
                </button>
              </div>

              {/* Tools Section */}
              <h2 className="text-lg font-semibold mb-4">Tools</h2>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleQRCode()}
                  className="w-full p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  QR Code
                </button>
                <button
                  onClick={() => handleInstructorDashboard()}
                  className="w-full p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Instructor Dashboard
                </button>
              </div>
            </div>

            {/* Terminal Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <h2 className="text-lg font-semibold mb-4">Terminal</h2>
              <div className="flex-1 min-h-0">
                <Terminal />
              </div>
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
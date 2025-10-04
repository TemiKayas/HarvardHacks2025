"use client";

import { useClassStore, renameClass, FileMeta, QuizQuestion, GeneratedContent } from '../../lib/store';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import PDFQuiz from '../../components/pdf-quiz/pdf-quiz';

export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  // Use reactive selectors for real-time updates
  const classData = useClassStore((state) => state.classes.find(c => c.id === resolvedParams.id));
  const removeFileFromClass = useClassStore((state) => state.removeFileFromClass);
  const toggleFileSelection = useClassStore((state) => state.toggleFileSelection);
  const updateClassGeneratedContent = useClassStore((state) => state.updateClassGeneratedContent);
  const addChatMessage = useClassStore((state) => state.addChatMessage);
  const updateQuizQuestion = useClassStore((state) => state.updateQuizQuestion);
  const deleteQuizQuestion = useClassStore((state) => state.deleteQuizQuestion);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetailPrompt, setShowDetailPrompt] = useState(false);
  const [detailPrompt, setDetailPrompt] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  //rename logic
  const handleRename = () => {
    renameClass(resolvedParams.id);
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

    // Special handling for quiz generation using PDF pipeline
    if (action === 'quiz') {
      const selectedFiles = classData.files.filter(f => f.selected);
      const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');

      if (pdfFiles.length === 0) {
        alert('Please select PDF files for quiz generation');
        return;
      }

      // Use PDF quiz component for PDF files
      return;
    }

    setCurrentAction(action);
    setShowDetailPrompt(true);

    // Set default prompts based on action
    const prompts = {
      'summary': 'Please enter any specific requirements for the summary such as length, focus areas, or particular aspects to emphasize.',
      'keyPoints': 'Please enter any specific requirements for the key points such as number of points, focus areas, or particular aspects to highlight.',
      'slides': 'Please enter any specific requirements for the slides such as number of slides, presentation style, or particular topics to cover.'
    };

    setDetailPrompt(prompts[action as keyof typeof prompts] || '');
  };

  const generateContent = async () => {
    if (!classData?.files.some(f => f.selected)) return;

    setIsGenerating(true);
    setShowDetailPrompt(false);

    const selectedFiles = classData.files.filter(f => f.selected);
    const content = selectedFiles.map(f => f.content || '').join('\n\n');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentAction,
          content,
          details: detailPrompt
        })
      });

      const result = await response.json();

      // Update store with generated content
      const generatedContent: GeneratedContent = {
        [currentAction]: result[currentAction] || result.quiz || result.summary || result.keyPoints || result.slides,
        lastGenerated: currentAction
      };

      updateClassGeneratedContent(resolvedParams.id, generatedContent);

      // Add to chat history
      addChatMessage(resolvedParams.id, {
        role: 'assistant',
        content: `Generated ${currentAction} successfully! You can now edit the content below or ask me to make changes.`
      });

    } catch (error) {
      console.error('Error generating content:', error);
      addChatMessage(resolvedParams.id, {
        role: 'assistant',
        content: 'Sorry, there was an error generating the content. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    addChatMessage(resolvedParams.id, {
      role: 'user',
      content: chatMessage
    });

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          content: chatMessage,
          details: `Current context: ${currentAction} generation for lesson "${classData?.name}"`
        })
      });

      const { response: aiResponse } = await response.json();

      addChatMessage(resolvedParams.id, {
        role: 'assistant',
        content: aiResponse
      });

    } catch (error) {
      console.error('Error with chat:', error);
      addChatMessage(resolvedParams.id, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.'
      });
    }

    setChatMessage('');
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

  // Handle PDF quiz generation
  const handlePDFQuizGenerated = (quizPath: string, analysis: any) => {
    // Add a chat message about the successful generation
    addChatMessage(resolvedParams.id, {
      role: 'assistant',
      content: `✅ PDF Quiz generated successfully! Content analysis found: ${analysis.contentTypes.join(', ')}. The quiz has been opened in a new tab.`
    });
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
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${file.selected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                  }`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={file.selected || false}
                      onChange={() => handleToggleFileSelection(index)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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

          {/* Middle Column - Preview & Chat */}
          <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-700 p-6 flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Preview & Chat</h2>

            {/* Mobile Emulator Preview */}
            <div className="flex-1 mb-4">
              {classData.generatedContent && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden" style={{ width: '320px', height: '500px' }}>
                    {/* Mobile Header */}
                    <div className="bg-blue-600 text-white p-3 text-center">
                      <h3 className="font-semibold">{classData.name}</h3>
                    </div>

                    {/* Mobile Content */}
                    <div className="p-4 h-full overflow-y-auto">
                      {classData.generatedContent.quiz && (
                        <div className="space-y-4">
                          {classData.generatedContent.quiz.map((question, index) => (
                            <div key={index} className="border-b pb-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{question.question}</h4>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setEditingQuestion(index)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteQuizQuestion(resolvedParams.id, index)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {question.type === 'MCQ' ? (
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center">
                                    <span className="w-4">A)</span>
                                    <span className="ml-2">{question.answerA}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-4">B)</span>
                                    <span className="ml-2">{question.answerB}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-4">C)</span>
                                    <span className="ml-2">{question.answerC}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-4">D)</span>
                                    <span className="ml-2">{question.answerD}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs">
                                  <div className="flex gap-4">
                                    <label className="flex items-center">
                                      <input type="radio" name={`q${index}`} className="mr-1" />
                                      True
                                    </label>
                                    <label className="flex items-center">
                                      <input type="radio" name={`q${index}`} className="mr-1" />
                                      False
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {classData.generatedContent.summary && (
                        <div className="text-sm">
                          <h4 className="font-semibold mb-2">Summary</h4>
                          <p className="text-gray-700 dark:text-gray-300">{classData.generatedContent.summary}</p>
                        </div>
                      )}

                      {classData.generatedContent.keyPoints && (
                        <div className="text-sm">
                          <h4 className="font-semibold mb-2">Key Points</h4>
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{classData.generatedContent.keyPoints}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detail Prompt - Inline */}
            {showDetailPrompt && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{detailPrompt}</p>
                <div className="flex gap-2">
                  <button
                    onClick={generateContent}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setShowDetailPrompt(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Chat Interface - Bottom */}
            <div className="h-48 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto">
                {classData.chatHistory?.map((message, index) => (
                  <div key={index} className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg text-sm max-w-xs ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask Gemini to modify the content..."
                    className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Tools */}
          <div className="w-1/4 p-6 flex flex-col h-full">
            {/* Actions Section - Top Half */}
            <div className="flex-1 mb-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>

              {/* PDF Quiz Generation */}
              {classData?.files.some(f => f.selected && f.type === 'application/pdf') && (
                <div className="mb-6">
                  <PDFQuiz
                    files={classData.files.filter(f => f.selected && f.type === 'application/pdf')}
                    onQuizGenerated={handlePDFQuizGenerated}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                  onClick={() => handleActionButton('slides')}
                  className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Generate Slides
                </button>
              </div>
            </div>

            {/* Tools Section - Bottom Half */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">Tools</h2>
              <div className="space-y-3">
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
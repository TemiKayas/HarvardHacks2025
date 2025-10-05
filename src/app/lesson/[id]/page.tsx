"use client";

import { useState } from 'react';
import { useClassStore, QuizQuestion } from '../../lib/store';
import { use } from 'react';
import QuizDisplay from '../../components/quiz-display/QuizDisplay';
import SummaryDisplay from '../../components/summary-display/SummaryDisplay';
import KeyPointsDisplay from '../../components/keypoints-display/KeyPointsDisplay';
import FlashcardsDisplay from '../../components/flashcards-display/FlashcardsDisplay';

export default function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classData = useClassStore((state) => state.classes.find(c => c.id === resolvedParams.id));
  const { addStudentResponse, addTerminalLog } = useClassStore();

  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'quiz' | 'summary' | 'keyPoints' | 'flashcards' | null>(null);

  // Check if student has already submitted
  const existingResponse = classData?.generatedContent?.studentResponses?.find(
    response => response.studentName === studentName && response.classId === resolvedParams.id
  );

  const handleStartQuiz = () => {
    if (!studentName.trim()) {
      addTerminalLog('Please enter your name to start the quiz', 'warning');
      return;
    }
    setHasStarted(true);
  };

  const handleQuizSubmit = async (answers: { [key: number]: string }) => {
    if (!classData?.generatedContent?.quiz || !studentName.trim()) return;

    setIsSubmitting(true);

    try {
      // Calculate score
      let correctCount = 0;
      classData.generatedContent?.quiz?.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correctCount++;
        }
      });

      const response = {
        studentName: studentName.trim(),
        answers,
        score: correctCount,
        totalQuestions: classData.generatedContent?.quiz?.length || 0,
        submittedAt: new Date(),
        classId: resolvedParams.id
      };

      addStudentResponse(resolvedParams.id, response);
      addTerminalLog(`${studentName} submitted quiz with score ${correctCount}/${classData.generatedContent?.quiz?.length || 0}`, 'success');

    } catch (error) {
      addTerminalLog(`Failed to submit quiz: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!classData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="text-center text-red-500">Error: Could not find quiz data for class ID: {resolvedParams.id}</p>
      </div>
    );
  }

  // Check if any content is available
  const hasContent = classData.generatedContent?.quiz || classData.generatedContent?.summary ||
                    classData.generatedContent?.keyPoints || classData.generatedContent?.flashcards;

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="text-center text-zinc-500">No content available for this class yet.</p>
      </div>
    );
  }

  // Show results if student already submitted
  if (existingResponse && !hasStarted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Quiz Already Completed</h2>
          <p className="text-lg mb-2">Hello, {existingResponse.studentName}!</p>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            You have already completed this quiz with a score of{' '}
            <span className="font-bold text-green-600">
              {existingResponse.score}/{existingResponse.totalQuestions}
            </span>
          </p>
          <p className="text-sm text-zinc-500">
            Submitted on: {existingResponse.submittedAt.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Show name input form
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">{classData.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6">
            Enter your name to start the quiz
          </p>

          <div className="mb-6">
            <label htmlFor="studentName" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              placeholder="Enter your full name"
              onKeyPress={(e) => e.key === 'Enter' && handleStartQuiz()}
              autoFocus
            />
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all text-lg"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Show content tabs
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">{classData.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Welcome, {studentName}!</p>
        </div>

        {/* Tab Navigation */}
        {hasContent && (
          <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
            {classData.generatedContent?.quiz && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
                  activeTab === 'quiz'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Quiz
              </button>
            )}
            {classData.generatedContent?.summary && (
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
                  activeTab === 'summary'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Summary
              </button>
            )}
            {classData.generatedContent?.keyPoints && (
              <button
                onClick={() => setActiveTab('keyPoints')}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
                  activeTab === 'keyPoints'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Key Points
              </button>
            )}
            {classData.generatedContent?.flashcards && (
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-2 font-medium transition-colors text-sm ${
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

        {/* Content Display */}
        <div className="min-h-[600px]">
          {activeTab === 'quiz' && classData.generatedContent?.quiz ? (
            <QuizDisplay
              questions={classData.generatedContent?.quiz as QuizQuestion[] || []}
              mode="take"
              onQuizSubmit={handleQuizSubmit}
            />
          ) : activeTab === 'summary' && classData.generatedContent?.summary ? (
            <SummaryDisplay
              summary={classData.generatedContent?.summary || ''}
            />
          ) : activeTab === 'keyPoints' && classData.generatedContent?.keyPoints ? (
            <KeyPointsDisplay
              keyPoints={classData.generatedContent?.keyPoints || ''}
            />
          ) : activeTab === 'flashcards' && classData.generatedContent?.flashcards ? (
            <FlashcardsDisplay
              flashcards={classData.generatedContent?.flashcards || []}
            />
          ) : !activeTab ? (
            <div className="flex items-center justify-center h-96 text-zinc-400">
              <div className="text-center">
                <p className="mb-4">Select a tab above to view content</p>
                {classData.generatedContent?.quiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start with Quiz
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Submit Status */}
        {isSubmitting && (
          <div className="mt-4 text-center">
            <p className="text-blue-600 dark:text-blue-400">Submitting your quiz...</p>
          </div>
        )}
      </div>
    </div>
  );
}

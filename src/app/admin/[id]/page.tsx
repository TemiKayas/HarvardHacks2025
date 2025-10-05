"use client";

import { useClassStore } from '../../lib/store';
import { use } from 'react';
import Link from 'next/link';

export default function AdminResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classData = useClassStore((state) => state.classes.find(c => c.id === resolvedParams.id));
  const { clearStudentResponses, addTerminalLog } = useClassStore();

  if (!classData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="text-center text-red-500">Error: Could not find data for class ID: {resolvedParams.id}</p>
      </div>
    );
  }

  const responses = classData.generatedContent?.studentResponses || [];
  const quiz = classData.generatedContent?.quiz;

  // Calculate analytics
  const totalStudents = responses.length;
  const averageScore = totalStudents > 0
    ? Math.round((responses.reduce((sum, r) => sum + r.score, 0) / totalStudents) * 100) / 100
    : 0;
  const averagePercentage = totalStudents > 0
    ? Math.round((responses.reduce((sum, r) => sum + (r.score / r.totalQuestions), 0) / totalStudents) * 100)
    : 0;

  const handleClearResponses = () => {
    if (confirm('Are you sure you want to clear all student responses? This action cannot be undone.')) {
      clearStudentResponses(resolvedParams.id);
      addTerminalLog('All student responses cleared', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-zinc-200 dark:border-zinc-700">
        <Link href={`/class/${resolvedParams.id}`} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{classData.name} - Quiz Results</h1>
      </div>

      <div className="p-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Total Participants</h3>
            <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-green-600">{averageScore}/{quiz?.length || 0}</p>
            <p className="text-sm text-zinc-500">{averagePercentage}%</p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Participation Rate</h3>
            <p className="text-3xl font-bold text-purple-600">100%</p>
            <p className="text-sm text-zinc-500">All invited students</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Student Responses ({totalStudents})</h2>
          {totalStudents > 0 && (
            <button
              onClick={handleClearResponses}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear All Responses
            </button>
          )}
        </div>

        {/* No responses message */}
        {totalStudents === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No student responses yet.</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
              Students need to scan the QR code and complete the quiz to see results here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student List */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold">Individual Results</h3>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {responses.map((response, index) => (
                  <div key={index} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{response.studentName}</h4>
                        <p className="text-sm text-zinc-500">
                          Submitted: {response.submittedAt.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {response.score}/{response.totalQuestions}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {Math.round((response.score / response.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Question-by-question breakdown */}
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Question Breakdown:</h5>
                      <div className="grid gap-2">
                        {quiz?.map((question, qIndex) => {
                          const studentAnswer = response.answers[qIndex];
                          const isCorrect = studentAnswer === question.correctAnswer;

                          return (
                            <div
                              key={qIndex}
                              className={`p-3 rounded-lg border ${
                                isCorrect
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    Q{qIndex + 1}: {question.question}
                                  </p>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    Your answer: <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                      {studentAnswer}
                                    </span>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                      Correct answer: <span className="font-medium text-green-600">
                                        {question.correctAnswer}
                                      </span>
                                    </p>
                                  )}
                                </div>
                                <div className={`ml-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {isCorrect ? '✓' : '✗'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold">Question Analysis</h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {quiz?.map((question, qIndex) => {
                    const correctCount = responses.filter(r => r.answers[qIndex] === question.correctAnswer).length;
                    const percentage = Math.round((correctCount / totalStudents) * 100);

                    return (
                      <div key={qIndex} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                        <div>
                          <p className="font-medium">Question {qIndex + 1}</p>
                          <p className="text-sm text-zinc-500">{question.question}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{correctCount}/{totalStudents}</p>
                          <p className="text-sm text-zinc-500">{percentage}% correct</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

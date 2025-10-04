"use client";

import { useState } from 'react';

interface MCQQuestion {
  question: string;
  type: 'MCQ';
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswer: string;
  explanation: string;
}

interface TFQuestion {
  question: string;
  type: 'TF';
  correctAnswer: string;
  explanation: string;
}

type QuizQuestion = MCQQuestion | TFQuestion;

interface QuizDisplayProps {
  questions: QuizQuestion[];
  onClose?: () => void;
}

export default function QuizDisplay({ questions, onClose }: QuizDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (showResults) return; // Don't allow changes after submission
    setUserAnswers({ ...userAnswers, [questionIndex]: answer });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const getScoreMessage = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90) return 'Excellent work! 🌟';
    if (percentage >= 70) return 'Good job! 👍';
    if (percentage >= 50) return 'Not bad! Keep studying 📚';
    return 'Keep practicing! 💪';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interactive Quiz</h1>
            <p className="text-blue-100">Test your knowledge with {questions.length} questions</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {questions.map((question, index) => (
          <div
            key={index}
            className="mb-6 p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex items-start mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg mr-3">
                Q{index + 1}.
              </span>
              <p className="text-lg text-zinc-900 dark:text-zinc-100 flex-1">
                {question.question}
              </p>
            </div>

            {question.type === 'MCQ' ? (
              <div className="space-y-3 ml-8">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const answerKey = `answer${letter}` as keyof MCQQuestion;
                  const answerText = question[answerKey] as string;
                  const isSelected = userAnswers[index] === letter;
                  const isCorrect = question.correctAnswer === letter;
                  const showCorrect = showResults && isCorrect;
                  const showIncorrect = showResults && isSelected && !isCorrect;

                  return (
                    <div
                      key={letter}
                      onClick={() => handleAnswerSelect(index, letter)}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        showCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : showIncorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(index, letter)}
                        className="mr-3 h-5 w-5"
                        disabled={showResults}
                      />
                      <label className="flex-1 cursor-pointer">
                        <strong className="mr-2">{letter}.</strong>
                        {answerText}
                      </label>
                      {showCorrect && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}
                      {showIncorrect && (
                        <span className="text-red-600 font-bold">✗</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-4 ml-8">
                {['true', 'false'].map((value) => {
                  const isSelected = userAnswers[index] === value;
                  const isCorrect = question.correctAnswer === value;
                  const showCorrect = showResults && isCorrect;
                  const showIncorrect = showResults && isSelected && !isCorrect;

                  return (
                    <div
                      key={value}
                      onClick={() => handleAnswerSelect(index, value)}
                      className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        showCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : showIncorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(index, value)}
                        className="mr-2 h-5 w-5"
                        disabled={showResults}
                      />
                      <label className="cursor-pointer font-medium capitalize">
                        {value}
                      </label>
                      {showCorrect && (
                        <span className="ml-2 text-green-600 font-bold">✓</span>
                      )}
                      {showIncorrect && (
                        <span className="ml-2 text-red-600 font-bold">✗</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation (shown after submission) */}
            {showResults && (
              <div className="mt-4 ml-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Explanation:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with Submit/Results */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length !== questions.length}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:from-zinc-400 disabled:to-zinc-400 disabled:cursor-not-allowed transition-all text-lg"
          >
            {Object.keys(userAnswers).length === questions.length
              ? 'Submit Quiz'
              : `Answer all questions (${Object.keys(userAnswers).length}/${questions.length})`}
          </button>
        ) : (
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-xl text-zinc-700 dark:text-zinc-300">
              {getScoreMessage()}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              You scored {Math.round((score / questions.length) * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

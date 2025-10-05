"use client";

import { useState, useEffect } from 'react';
import { useClassStore } from '@/src/app/lib/store';
import QRGenerator from '@/src/app/lib/qr-generator';

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
  mode?: 'edit' | 'take';
  classId?: string;
  onSave?: () => void;
  onCancel?: () => void;
  onQuizSubmit?: (answers: { [key: number]: string }) => void;
}

export default function QuizDisplay({ questions, onClose, mode = 'take', classId, onSave, onQuizSubmit }: QuizDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Edit mode state
  const [editedQuestions, setEditedQuestions] = useState<QuizQuestion[]>(questions);
  const [undoHistory, setUndoHistory] = useState<QuizQuestion[][]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const { updateQuizQuestion, deleteQuizQuestion, addQuizQuestion, addTerminalLog, generateQRCode } = useClassStore();
  const classData = useClassStore((state) => state.classes.find(c => c.id === classId));

  // Sync editedQuestions when questions prop changes
  useEffect(() => {
    setEditedQuestions(questions);
    setUndoHistory([]); // Clear history when questions change from outside
  }, [questions]);

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

    // Call external submit handler if provided
    if (onQuizSubmit) {
      onQuizSubmit(userAnswers);
    }
  };

  const getScoreMessage = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90) return 'Excellent work! 🌟';
    if (percentage >= 70) return 'Good job! 👍';
    if (percentage >= 50) return 'Not bad! Keep studying 📚';
    return 'Keep practicing! 💪';
  };

  // Edit mode handlers
  const saveToHistory = () => {
    setUndoHistory([...undoHistory, JSON.parse(JSON.stringify(editedQuestions))]);
  };

  const handleQuestionEdit = (index: number, field: string, value: string) => {
    const updated = [...editedQuestions];
    updated[index] = { ...updated[index], [field]: value } as QuizQuestion;
    setEditedQuestions(updated);
  };

  const handleFieldBlur = () => {
    // Save current state to history when user finishes editing a field
    saveToHistory();
  };

  const handleCorrectAnswerChange = (index: number, answer: string) => {
    saveToHistory();
    const updated = [...editedQuestions];
    updated[index] = { ...updated[index], correctAnswer: answer } as QuizQuestion;
    setEditedQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    saveToHistory();
    setEditedQuestions(editedQuestions.filter((_, i) => i !== index));
  };

  const handleAddQuestion = (type: 'MCQ' | 'TF') => {
    saveToHistory();
    const newQuestion: QuizQuestion = type === 'MCQ'
      ? {
          question: "",
          type: "MCQ",
          answerA: "",
          answerB: "",
          answerC: "",
          answerD: "",
          correctAnswer: "A",
          explanation: ""
        }
      : {
          question: "",
          type: "TF",
          correctAnswer: "true",
          explanation: ""
        };
    setEditedQuestions([...editedQuestions, newQuestion]);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;

    const newHistory = [...undoHistory];
    const previousState = newHistory.pop()!;
    setUndoHistory(newHistory);
    setEditedQuestions(previousState);
  };

  const handleSaveChanges = async () => {
    if (!classId) return;

    // Validate all fields are filled
    for (let i = 0; i < editedQuestions.length; i++) {
      const question = editedQuestions[i];

      if (!question.question.trim()) {
        addTerminalLog(`Error: Question ${i + 1} is missing question text`, 'error');
        return;
      }

      if (!question.explanation.trim()) {
        addTerminalLog(`Error: Question ${i + 1} is missing explanation`, 'error');
        return;
      }

      if (question.type === 'MCQ') {
        const mcq = question as MCQQuestion;
        if (!mcq.answerA.trim()) {
          addTerminalLog(`Error: Question ${i + 1} is missing answer A`, 'error');
          return;
        }
        if (!mcq.answerB.trim()) {
          addTerminalLog(`Error: Question ${i + 1} is missing answer B`, 'error');
          return;
        }
        if (!mcq.answerC.trim()) {
          addTerminalLog(`Error: Question ${i + 1} is missing answer C`, 'error');
          return;
        }
        if (!mcq.answerD.trim()) {
          addTerminalLog(`Error: Question ${i + 1} is missing answer D`, 'error');
          return;
        }
      }
    }

    // Update all questions in the store
    editedQuestions.forEach((question, index) => {
      if (index < questions.length) {
        // Update existing question
        updateQuizQuestion(classId, index, question);
      } else {
        // Add new question
        addQuizQuestion(classId, question);
      }
    });

    // Delete questions that were removed
    for (let i = editedQuestions.length; i < questions.length; i++) {
      deleteQuizQuestion(classId, editedQuestions.length);
    }

    addTerminalLog('Quiz saved successfully', 'success');

    // Generate QR Code
    setIsGeneratingQR(true);
    try {
      const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const lessonURL = QRGenerator.generateQuizURL(baseURL, classId);

      await generateQRCode(classId, lessonURL);
      addTerminalLog('QR code generated successfully for student access', 'success');
      setShowQRCode(true);
    } catch (error) {
      addTerminalLog(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGeneratingQR(false);
    }

    setUndoHistory([]); // Clear undo history after successful save
    onSave?.();
  };

  // Render edit mode
  if (mode === 'edit') {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-0">Edit Quiz</h1>
              <p className="text-blue-100">Customize questions and answers</p>
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
          {editedQuestions.map((question, index) => (
            <div
              key={index}
              className="mb-6 p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg relative"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteQuestion(index)}
                className="absolute top-4 right-4 text-red-600 hover:text-red-800 dark:hover:text-red-400"
                title="Delete question"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {/* Question number and text */}
              <div className="flex items-start mb-4 pr-8">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg mr-3 flex-shrink-0">
                  Q{index + 1}.
                </span>
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionEdit(index, 'question', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="flex-1 text-lg text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Enter question text..."
                />
              </div>

              {/* MCQ Answers */}
              {question.type === 'MCQ' && (
                <div className="space-y-3 ml-8">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const answerKey = `answer${letter}` as keyof MCQQuestion;
                    const answerText = (question as MCQQuestion)[answerKey] as string;
                    const isCorrect = question.correctAnswer === letter;

                    return (
                      <div key={letter} className="flex items-center gap-3">
                        <button
                          onClick={() => handleCorrectAnswerChange(index, letter)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isCorrect
                              ? 'border-green-500 bg-green-500'
                              : 'border-zinc-400 hover:border-green-400'
                          }`}
                          title="Mark as correct answer"
                        >
                          {isCorrect && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          )}
                        </button>
                        <strong className="mr-2 flex-shrink-0">{letter}.</strong>
                        <input
                          type="text"
                          value={answerText}
                          onChange={(e) => handleQuestionEdit(index, answerKey, e.target.value)}
                          onBlur={handleFieldBlur}
                          className="flex-1 px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded focus:border-blue-500 focus:outline-none bg-white dark:bg-zinc-800"
                          placeholder={`Answer ${letter}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True/False Answers */}
              {question.type === 'TF' && (
                <div className="flex gap-4 ml-8">
                  {['true', 'false'].map((value) => {
                    const isCorrect = question.correctAnswer === value;
                    const isFalse = value === 'false';

                    return (
                      <button
                        key={value}
                        onClick={() => handleCorrectAnswerChange(index, value)}
                        className={`flex-1 px-6 py-3 border-2 rounded-lg font-medium capitalize transition-all ${
                          isCorrect
                            ? isFalse
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-green-500 bg-green-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              <div className="mt-4 ml-8">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Explanation:
                </label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => handleQuestionEdit(index, 'explanation', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded focus:border-blue-500 focus:outline-none resize-none bg-white dark:bg-zinc-800"
                  rows={2}
                  placeholder="Enter explanation..."
                />
              </div>
            </div>
          ))}

          {/* Add Question Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleAddQuestion('MCQ')}
              className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Add MCQ Question
            </button>
            <button
              onClick={() => handleAddQuestion('TF')}
              className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              + Add T/F Question
            </button>
          </div>
        </div>

        {/* QR Code Display */}
        {showQRCode && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                QR Code Generated Successfully!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                Students can scan this QR code to take the quiz
              </p>
              <div className="inline-block p-4 bg-white dark:bg-zinc-800 rounded-lg border-2 border-green-200 dark:border-green-700">
                <img
                  src={classData?.generatedContent?.qrCode?.dataURL}
                  alt="Quiz QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600 dark:text-green-300 break-all">
                  URL: {classData?.generatedContent?.qrCode?.url}
                </p>
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Close QR Code
              </button>
            </div>
          </div>
        )}

        {/* Footer with Save/Undo */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-4">
            <button
              onClick={handleSaveChanges}
              disabled={isGeneratingQR}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:from-zinc-400 disabled:to-zinc-400 disabled:cursor-not-allowed transition-all text-lg"
            >
              {isGeneratingQR ? 'Generating QR Code...' : 'Save Changes and Generate QR Code'}
            </button>
            <button
              onClick={handleUndo}
              disabled={undoHistory.length === 0}
              className="px-8 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-all text-lg disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              Undo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render quiz-taking mode (original)
  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-0">Interactive Quiz</h1>
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
      <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto">
        {questions.map((question, index) => (
          <div
            key={index}
            className="mb-6 p-4 sm:p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex items-start mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0">
                Q{index + 1}.
              </span>
              <p className="text-base sm:text-lg text-zinc-900 dark:text-zinc-100 flex-1 leading-relaxed">
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
                      className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[60px] ${
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
                        className="mr-3 h-5 w-5 mt-0.5 flex-shrink-0"
                        disabled={showResults}
                      />
                      <label className="flex-1 cursor-pointer leading-relaxed">
                        <strong className="mr-2 text-base">{letter}.</strong>
                        <span className="text-sm sm:text-base">{answerText}</span>
                      </label>
                      {showCorrect && (
                        <span className="text-green-600 font-bold ml-2 flex-shrink-0">✓</span>
                      )}
                      {showIncorrect && (
                        <span className="text-red-600 font-bold ml-2 flex-shrink-0">✗</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 ml-8">
                {['true', 'false'].map((value) => {
                  const isSelected = userAnswers[index] === value;
                  const isCorrect = question.correctAnswer === value;
                  const showCorrect = showResults && isCorrect;
                  const showIncorrect = showResults && isSelected && !isCorrect;

                  return (
                    <div
                      key={value}
                      onClick={() => handleAnswerSelect(index, value)}
                      className={`flex-1 flex items-center justify-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[60px] ${
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
                        className="mr-2 h-5 w-5 flex-shrink-0"
                        disabled={showResults}
                      />
                      <label className="cursor-pointer font-medium capitalize text-center flex-1">
                        {value}
                      </label>
                      {showCorrect && (
                        <span className="ml-2 text-green-600 font-bold flex-shrink-0">✓</span>
                      )}
                      {showIncorrect && (
                        <span className="ml-2 text-red-600 font-bold flex-shrink-0">✗</span>
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

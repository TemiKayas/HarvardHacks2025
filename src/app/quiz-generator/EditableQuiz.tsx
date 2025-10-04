// src/app/quiz-generator/EditableQuiz.tsx
"use client";

import { useState } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

interface MCQQuestion {
    type: 'MCQ';
    question: string;
    answerA: string;
    answerB: string;
    answerC: string;
    answerD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
}

interface TFQuestion {
    type: 'TF';
    question: string;
    correctAnswer: 'true' | 'false';
    explanation: string;
}

type Question = MCQQuestion | TFQuestion;

interface QuizData {
    quiz: {
        questions: Question[];
    };
}

interface EditableQuizProps {
    initialQuizData: QuizData;
    onSave: (quizData: QuizData) => void;
}

export default function EditableQuiz({ initialQuizData, onSave }: EditableQuizProps) {
    const [questions, setQuestions] = useState<Question[]>(initialQuizData?.quiz?.questions || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [score, setScore] = useState<number | null>(null);

    const addQuestion = (type: 'MCQ' | 'TF') => {
        const newQuestion: Question = type === 'MCQ'
            ? {
                type: 'MCQ',
                question: 'New question?',
                answerA: 'Option A',
                answerB: 'Option B',
                answerC: 'Option C',
                answerD: 'Option D',
                correctAnswer: 'A',
                explanation: 'Explanation here'
            }
            : {
                type: 'TF',
                question: 'New true/false question?',
                correctAnswer: 'true',
                explanation: 'Explanation here'
            };

        setQuestions([...questions, newQuestion]);
    };

    const deleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: string, value: string) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value } as Question;
        setQuestions(updated);
    };

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
        if (showResults) return;
        setUserAnswers({ ...userAnswers, [questionIndex]: answer });
    };

    const gradeQuiz = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctAnswer) correct++;
        });
        setScore(correct);
        setShowResults(true);
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setScore(null);
        setShowResults(false);
    };

    const handleSave = () => {
        onSave({ quiz: { questions } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Interactive Quiz Editor</h1>
                    <p className="text-gray-600">Edit questions and test yourself</p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => addQuestion('MCQ')}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <Plus size={18} /> Add MCQ
                        </button>
                        <button
                            onClick={() => addQuestion('TF')}
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                        >
                            <Plus size={18} /> Add T/F
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 ml-auto"
                        >
                            <Save size={18} /> Save Quiz
                        </button>
                    </div>
                </div>

                {questions.map((question, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-xl p-6 mb-4">
                        {editingIndex === idx ? (
                            <EditMode
                                question={question}
                                index={idx}
                                onUpdate={updateQuestion}
                                onSave={() => setEditingIndex(null)}
                                onCancel={() => setEditingIndex(null)}
                            />
                        ) : (
                            <ViewMode
                                question={question}
                                index={idx}
                                userAnswer={userAnswers[idx]}
                                showResults={showResults}
                                onAnswerSelect={handleAnswerSelect}
                                onEdit={() => setEditingIndex(idx)}
                                onDelete={deleteQuestion}
                            />
                        )}
                    </div>
                ))}

                {questions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-xl p-6 text-center">
                        {!showResults ? (
                            <button
                                onClick={gradeQuiz}
                                disabled={Object.keys(userAnswers).length !== questions.length}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <div>
                                <div className="text-4xl font-bold text-blue-600 mb-2">
                                    {score}/{questions.length}
                                </div>
                                <div className="text-xl text-gray-600 mb-4">
                                    {score === questions.length ? 'Perfect Score!' :
                                        score! >= questions.length * 0.7 ? 'Great Job!' :
                                            score! >= questions.length * 0.5 ? 'Good Effort!' :
                                                'Keep Practicing!'}
                                </div>
                                <button
                                    onClick={resetQuiz}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface EditModeProps {
    question: Question;
    index: number;
    onUpdate: (index: number, field: string, value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

function EditMode({ question, index, onUpdate, onSave, onCancel }: EditModeProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-blue-600 font-bold">Question {index + 1} - Editing</span>
                <div className="flex gap-2">
                    <button onClick={onSave} className="text-green-600 hover:text-green-700">
                        <Save size={20} />
                    </button>
                    <button onClick={onCancel} className="text-red-600 hover:text-red-700">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <input
                type="text"
                value={question.question}
                onChange={(e) => onUpdate(index, 'question', e.target.value)}
                className="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 outline-none text-lg"
                placeholder="Question text"
            />

            {question.type === 'MCQ' ? (
                <div className="grid grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map(letter => (
                        <div key={letter} className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={question.correctAnswer === letter}
                                onChange={() => onUpdate(index, 'correctAnswer', letter)}
                                className="w-4 h-4"
                            />
                            <input
                                type="text"
                                value={question[`answer${letter}`]}
                                onChange={(e) => onUpdate(index, `answer${letter}`, e.target.value)}
                                className="flex-1 p-2 border-2 border-gray-300 rounded focus:border-blue-500 outline-none"
                                placeholder={`Option ${letter}`}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={question.correctAnswer === 'true'}
                            onChange={() => onUpdate(index, 'correctAnswer', 'true')}
                            className="w-4 h-4"
                        />
                        <span className="font-semibold">True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={question.correctAnswer === 'false'}
                            onChange={() => onUpdate(index, 'correctAnswer', 'false')}
                            className="w-4 h-4"
                        />
                        <span className="font-semibold">False</span>
                    </label>
                </div>
            )}

            <textarea
                value={question.explanation}
                onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
                className="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 outline-none"
                rows={2}
                placeholder="Explanation"
            />
        </div>
    );
}

interface ViewModeProps {
    question: Question;
    index: number;
    userAnswer?: string;
    showResults: boolean;
    onAnswerSelect: (index: number, answer: string) => void;
    onEdit: () => void;
    onDelete: (index: number) => void;
}

function ViewMode({ question, index, userAnswer, showResults, onAnswerSelect, onEdit, onDelete }: ViewModeProps) {
    const isCorrect = showResults && userAnswer === question.correctAnswer;
    const isIncorrect = showResults && userAnswer && userAnswer !== question.correctAnswer;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="text-blue-600 font-bold mb-2">Question {index + 1}</div>
                    <div className="text-xl font-semibold text-gray-800 mb-4">{question.question}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="text-blue-600 hover:text-blue-700">
                        <Edit2 size={20} />
                    </button>
                    <button onClick={() => onDelete(index)} className="text-red-600 hover:text-red-700">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {question.type === 'MCQ' ? (
                <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map(letter => {
                        const isSelected = userAnswer === letter;
                        const isCorrectAnswer = question.correctAnswer === letter;

                        return (
                            <div
                                key={letter}
                                onClick={() => onAnswerSelect(index, letter)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                    showResults && isCorrectAnswer ? 'bg-green-100 border-green-500' :
                                        showResults && isSelected && !isCorrectAnswer ? 'bg-red-100 border-red-500' :
                                            isSelected ? 'bg-blue-100 border-blue-500' :
                                                'border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                <span className="font-bold mr-2">{letter}.</span>
                                {question[`answer${letter}`]}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex gap-4 justify-center">
                    {(['true', 'false'] as const).map(answer => {
                        const isSelected = userAnswer === answer;
                        const isCorrectAnswer = question.correctAnswer === answer;

                        return (
                            <div
                                key={answer}
                                onClick={() => onAnswerSelect(index, answer)}
                                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer text-center font-semibold transition ${
                                    showResults && isCorrectAnswer ? 'bg-green-100 border-green-500' :
                                        showResults && isSelected && !isCorrectAnswer ? 'bg-red-100 border-red-500' :
                                            isSelected ? 'bg-blue-100 border-blue-500' :
                                                'border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                {answer.charAt(0).toUpperCase() + answer.slice(1)}
                            </div>
                        );
                    })}
                </div>
            )}

            {showResults && (
                <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <div className="font-bold mb-1">
                        {isCorrect ? 'Correct!' : isIncorrect ? 'Incorrect' : 'Not answered'}
                    </div>
                    <div className="text-sm">{question.explanation}</div>
                </div>
            )}
        </div>
    );
}
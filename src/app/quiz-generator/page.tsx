// app/quiz-generator/page.tsx
"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import EditableQuiz from './EditableQuiz'; // The component from the artifact

export default function QuizGeneratorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quizData, setQuizData] = useState(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1
    });

    const handleGenerateQuiz = async () => {
        if (!file) {
            setError('Please upload a PDF file first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('numQuestions', numQuestions.toString());

            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate quiz');
            }

            setQuizData(data.quizData);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuiz = (updatedQuiz) => {
        // Save to your backend/database
        console.log('Saving quiz:', updatedQuiz);
        // You can call an API to save the quiz here
        // For now, just update local state
        setQuizData(updatedQuiz);
        alert('Quiz saved successfully!');
    };

    // If quiz is generated, show the editable quiz component
    if (quizData) {
        return (
            <div>
                <div className="bg-white p-4 shadow-md">
                    <button
                        onClick={() => setQuizData(null)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                        ← Back to Upload
                    </button>
                </div>
                <EditableQuiz initialQuizData={quizData} onSave={handleSaveQuiz} />
            </div>
        );
    }

    // Show upload interface
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Quiz Generator
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Upload a PDF to automatically generate an interactive quiz
                    </p>

                    {/* Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                            isDragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                        {isDragActive ? (
                            <p className="text-blue-600 font-semibold">Drop the PDF here...</p>
                        ) : (
                            <div>
                                <p className="text-gray-700 font-semibold mb-2">
                                    Drag & drop a PDF file here, or click to browse
                                </p>
                                <p className="text-sm text-gray-500">PDF files only</p>
                            </div>
                        )}
                    </div>

                    {/* Selected File */}
                    {file && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="font-semibold text-gray-800">Selected File:</p>
                            <p className="text-gray-600">{file.name}</p>
                            <p className="text-sm text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    )}

                    {/* Number of Questions */}
                    <div className="mt-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 font-semibold">Error:</p>
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateQuiz}
                        disabled={!file || loading}
                        className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 rounded-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Generating Quiz...
                            </>
                        ) : (
                            <>Generate Quiz</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
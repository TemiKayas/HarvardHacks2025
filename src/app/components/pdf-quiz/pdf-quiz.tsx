"use client";

import { useState } from 'react';

interface PDFQuizProps {
  files: any[];
  onQuizGenerated?: (quizPath: string, analysis: any) => void;
}

export default function PDFQuiz({ files, onQuizGenerated }: PDFQuizProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [progress, setProgress] = useState('');

  const handleGenerateQuiz = async () => {
    if (!files || files.length === 0) {
      alert('Please upload PDF files first');
      return;
    }

    setIsGenerating(true);
    setProgress('Processing PDF files...');

    try {
      // Get the first PDF file
      const pdfFile = files.find(file => file.type === 'application/pdf');
      if (!pdfFile) {
        alert('No PDF files found');
        return;
      }

      if (!pdfFile.content) {
        alert('PDF content not available. Please re-upload the file.');
        return;
      }

      setProgress('Generating quiz...');

      // Call our API to generate the quiz
      const response = await fetch('/api/generate-pdf-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: pdfFile.content,
          numQuestions: numQuestions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const result = await response.json();

      setProgress('Quiz generated successfully!');

      // Call the callback if provided
      if (onQuizGenerated) {
        onQuizGenerated(result.quizPath, result.analysis);
      }

      // Open the quiz in a new tab
      window.open(result.quizPath, '_blank');

    } catch (error) {
      console.error('Error generating quiz:', error);
      setProgress('Error generating quiz. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        📄 Generate Quiz from PDF
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Number of Questions
          </label>
          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            disabled={isGenerating}
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={8}>8 Questions</option>
            <option value={10}>10 Questions</option>
          </select>
        </div>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {files.length > 0 ? (
            <p>✅ {files.length} PDF file(s) ready for processing</p>
          ) : (
            <p>⚠️ No PDF files uploaded</p>
          )}
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating || files.length === 0}
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{progress}</span>
            </div>
          ) : (
            'Generate Interactive Quiz'
          )}
        </button>

        {progress && !isGenerating && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{progress}</p>
          </div>
        )}
      </div>
    </div>
  );
}

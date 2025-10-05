"use client";

import { useState } from 'react';
import { Flashcard } from '../../lib/store';

interface FlashcardsDisplayProps {
  flashcards: Flashcard[];
  onClose?: () => void;
}

export default function FlashcardsDisplay({ flashcards, onClose }: FlashcardsDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 text-center">
        <p className="text-zinc-500">No flashcards available</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-0">Flashcards</h1>
            <p className="text-green-100">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="p-8 md:p-12 flex flex-col items-center">
        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-md perspective-1000 mb-8">
          <div
            onClick={handleFlip}
            className="relative w-full h-64 md:h-80 cursor-pointer transition-transform duration-500 transform-style-3d"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Front of card */}
            <div
              className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-800 border-2 border-green-500 dark:border-green-600 rounded-xl shadow-lg flex items-center justify-center p-8 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-4">
                  QUESTION
                </div>
                <p className="text-xl md:text-2xl font-medium text-zinc-900 dark:text-zinc-100">
                  {currentCard.front}
                </p>
                <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Click to flip
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-800 border-2 border-emerald-500 dark:border-emerald-600 rounded-xl shadow-lg flex items-center justify-center p-8 backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
                  ANSWER
                </div>
                <p className="text-xl md:text-2xl font-medium text-zinc-900 dark:text-zinc-100">
                  {currentCard.back}
                </p>
                <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Click to flip back
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={flashcards.length === 1}
            className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={handleFlip}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
          >
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </button>

          <button
            onClick={handleNext}
            disabled={flashcards.length === 1}
            className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Use ← → arrow keys or click buttons to navigate
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} total
        </div>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className="px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
        >
          Restart
        </button>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}

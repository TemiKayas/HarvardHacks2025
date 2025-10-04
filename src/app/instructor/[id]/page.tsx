"use client";

import { useClassStore } from '../../lib/store';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';

export default function InstructorDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classData = useClassStore((state) => state.classes.find(c => c.id === resolvedParams.id));
  
  // Mock stats data - in real implementation, this would come from a database
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedQuizzes: 0,
    averageScore: 0,
    participationRate: 0,
    recentActivity: []
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalStudents: 24,
      completedQuizzes: 18,
      averageScore: 87.5,
      participationRate: 75,
      recentActivity: [
        { student: "John Doe", action: "Completed Quiz", score: 92, time: "2 minutes ago" },
        { student: "Jane Smith", action: "Started Quiz", score: null, time: "5 minutes ago" },
        { student: "Mike Johnson", action: "Completed Quiz", score: 78, time: "8 minutes ago" },
        { student: "Sarah Wilson", action: "Completed Quiz", score: 95, time: "12 minutes ago" },
      ]
    });
  }, []);

  if (!classData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="text-center text-red-500">Error: Could not find data for class ID: {resolvedParams.id}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-zinc-200 dark:border-zinc-700">
        <Link href={`/class/${resolvedParams.id}`} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{classData.name} - Instructor Dashboard</h1>
      </div>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Completed Quizzes</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedQuizzes}</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.averageScore}%</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-2">Participation Rate</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.participationRate}%</p>
          </div>
        </div>

        {/* Student Responses */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-semibold">Student Responses</h2>
          </div>
          <div className="p-6">
            {classData.generatedContent?.studentResponses && classData.generatedContent.studentResponses.length > 0 ? (
              <div className="space-y-4">
                {classData.generatedContent.studentResponses.map((response, index) => (
                  <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{response.studentName}</h3>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{response.score}%</p>
                        <p className="text-sm text-zinc-500">
                          {new Date(response.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      <p>Answers submitted: {Object.keys(response.answers).length} questions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">No student responses yet</p>
            )}
          </div>
        </div>

        {/* Generated Content Summary */}
        {classData.generatedContent && (
          <div className="mt-8 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-semibold">Generated Content</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classData.generatedContent.quiz && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Quiz</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {classData.generatedContent.quiz.length} questions generated
                    </p>
                  </div>
                )}
                
                {classData.generatedContent.summary && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200">Summary</h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {classData.generatedContent.summary.length} characters
                    </p>
                  </div>
                )}
                
                {classData.generatedContent.keyPoints && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">Key Points</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      Key concepts extracted
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

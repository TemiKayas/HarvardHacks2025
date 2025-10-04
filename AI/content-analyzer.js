import { getContentFromSource } from './pdf-processor.js';

/**
 * Analyzes content to identify in-class activities, practice questions, and key learning elements
 */
export async function analyzeContent(contentSource) {
  try {
    console.log('🔍 Analyzing content for learning activities...');

    const content = await getContentFromSource(contentSource);

    const analysis = {
      totalLength: content.length,
      hasActivities: false,
      hasPracticeQuestions: false,
      hasExamples: false,
      hasKeyConcepts: false,
      contentTypes: [],
      suggestions: []
    };

    // Look for in-class activities
    const activityKeywords = [
      'exercise', 'activity', 'practice', 'problem', 'worksheet',
      'hands-on', 'lab', 'assignment', 'homework', 'quiz',
      'discussion', 'group work', 'collaborative', 'interactive'
    ];

    const activityMatches = activityKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (activityMatches.length > 0) {
      analysis.hasActivities = true;
      analysis.contentTypes.push('In-class activities');
      analysis.suggestions.push(`Found activity keywords: ${activityMatches.join(', ')}`);
    }

    // Look for practice questions
    const questionKeywords = [
      'question', 'problem', 'solve', 'calculate', 'determine',
      'what is', 'how many', 'which of', 'true or false',
      'multiple choice', 'fill in', 'complete'
    ];

    const questionMatches = questionKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (questionMatches.length > 0) {
      analysis.hasPracticeQuestions = true;
      analysis.contentTypes.push('Practice questions');
      analysis.suggestions.push(`Found question keywords: ${questionMatches.join(', ')}`);
    }

    // Look for examples
    const exampleKeywords = [
      'example', 'for instance', 'such as', 'case study',
      'demonstration', 'illustration', 'sample'
    ];

    const exampleMatches = exampleKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (exampleMatches.length > 0) {
      analysis.hasExamples = true;
      analysis.contentTypes.push('Examples and case studies');
    }

    // Look for key concepts
    const conceptKeywords = [
      'definition', 'theorem', 'principle', 'concept', 'theory',
      'important', 'key', 'fundamental', 'essential', 'critical'
    ];

    const conceptMatches = conceptKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (conceptMatches.length > 0) {
      analysis.hasKeyConcepts = true;
      analysis.contentTypes.push('Key concepts and definitions');
    }

    // Generate suggestions
    if (analysis.hasActivities) {
      analysis.suggestions.push('✅ Prioritize questions based on in-class activities');
    }

    if (analysis.hasPracticeQuestions) {
      analysis.suggestions.push('✅ Focus on practice questions and problems');
    }

    if (analysis.hasExamples) {
      analysis.suggestions.push('✅ Include questions about examples and case studies');
    }

    if (!analysis.hasActivities && !analysis.hasPracticeQuestions) {
      analysis.suggestions.push('⚠️ No obvious activities found - will focus on key concepts');
    }

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing content:', error);
    return {
      totalLength: 0,
      hasActivities: false,
      hasPracticeQuestions: false,
      hasExamples: false,
      hasKeyConcepts: false,
      contentTypes: [],
      suggestions: ['❌ Error analyzing content'],
      error: error.message
    };
  }
}

/**
 * Display content analysis results
 */
export function displayAnalysis(analysis) {
  console.log('\n📊 Content Analysis Results:');
  console.log(`📏 Content length: ${analysis.totalLength} characters`);
  console.log(`🎯 Content types found: ${analysis.contentTypes.length > 0 ? analysis.contentTypes.join(', ') : 'None identified'}`);

  if (analysis.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    analysis.suggestions.forEach(suggestion => console.log(`   ${suggestion}`));
  }

  if (analysis.error) {
    console.log(`❌ Analysis error: ${analysis.error}`);
  }

  console.log('');
}

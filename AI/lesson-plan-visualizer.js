import { generateLessonPlan } from './lesson-plan-generator.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgMagenta: '\x1b[45m'
};

function formatTextItem(item, index) {
  const title = `${colors.bgBlue}${colors.white} TEXT ${colors.reset} ${colors.blue}${colors.bright}${item.title}${colors.reset}`;
  const content = `${colors.dim}${item.content}${colors.reset}`;

  return `${index + 1}. ${title}\n\n   ${content}\n`;
}

function formatQuizItem(item, index) {
  const questionType = item.questionType === 'MCQ' ? 'Multiple Choice' : 'True/False';
  const title = `${colors.bgGreen}${colors.white} QUIZ ${colors.reset} ${colors.green}${colors.bright}${questionType}${colors.reset}`;
  const question = `${colors.bright}Q: ${item.question}${colors.reset}`;

  let options = '';
  if (item.questionType === 'MCQ') {
    options = `
   ${colors.yellow}A)${colors.reset} ${item.answerA}
   ${colors.yellow}B)${colors.reset} ${item.answerB}
   ${colors.yellow}C)${colors.reset} ${item.answerC}
   ${colors.yellow}D)${colors.reset} ${item.answerD}

   ${colors.green}Correct Answer: ${item.correctAnswer}${colors.reset}`;
  } else {
    options = `
   ${colors.yellow}True/False${colors.reset}

   ${colors.green}Correct Answer: ${item.correctAnswer}${colors.reset}`;
  }

  const explanation = `   ${colors.dim}💡 ${item.explanation}${colors.reset}`;

  return `${index + 1}. ${title}\n\n   ${question}\n${options}\n\n${explanation}\n`;
}

function formatPollItem(item, index) {
  const pollType = item.pollType === 'POLL_2' ? '2 Options' : '4 Options';
  const title = `${colors.bgMagenta}${colors.white} POLL ${colors.reset} ${colors.magenta}${colors.bright}${pollType}${colors.reset}`;
  const question = `${colors.bright}📊 ${item.question}${colors.reset}`;

  let options = `
   ${colors.cyan}A)${colors.reset} ${item.optionA}
   ${colors.cyan}B)${colors.reset} ${item.optionB}`;

  if (item.pollType === 'POLL_4') {
    options += `
   ${colors.cyan}C)${colors.reset} ${item.optionC}
   ${colors.cyan}D)${colors.reset} ${item.optionD}`;
  }

  return `${index + 1}. ${title}\n\n   ${question}\n${options}\n`;
}

function formatLessonPlan(lessonPlanData) {
  if (lessonPlanData.status !== 'success') {
    return `${colors.red}❌ Error: ${lessonPlanData.error}${colors.reset}`;
  }

  const { lessonPlan, metadata } = lessonPlanData;

  // Header
  let output = `\n${'='.repeat(80)}\n`;
  output += `${colors.bright}${colors.blue}📚 LESSON PLAN VISUALIZER${colors.reset}\n`;
  output += `${'='.repeat(80)}\n\n`;

  // Title and Description
  output += `${colors.bright}${colors.yellow}${lessonPlan.title}${colors.reset}\n`;
  output += `${colors.dim}${lessonPlan.description}${colors.reset}\n\n`;

  // Metadata
  output += `${colors.cyan}📋 Lesson Overview:${colors.reset}\n`;
  output += `   • Total Items: ${metadata.actualItemsGenerated}\n`;
  output += `   • PDF Size: ${(metadata.pdfSize / 1024).toFixed(1)} KB\n`;

  // Item type breakdown
  output += `   • Item Types: `;
  const typeBreakdown = Object.entries(metadata.itemTypes)
    .map(([type, count]) => `${count} ${type.replace('_', ' ')}`)
    .join(', ');
  output += `${typeBreakdown}\n\n`;

  output += `${'-'.repeat(80)}\n\n`;

  // Items
  lessonPlan.items.forEach((item, index) => {
    switch (item.type) {
      case 'text':
        output += formatTextItem(item, index);
        break;
      case 'quiz':
        output += formatQuizItem(item, index);
        break;
      case 'poll':
        output += formatPollItem(item, index);
        break;
    }
    output += `\n${'-'.repeat(40)}\n\n`;
  });

  // Footer
  output += `${colors.bright}${colors.green}✅ Lesson Plan Complete!${colors.reset}\n`;
  output += `Generated at: ${new Date(lessonPlanData.timestamp).toLocaleString()}\n`;

  return output;
}

async function visualizeLessonPlan(numItems = 8) {
  try {
    console.log(`${colors.yellow}🔄 Generating lesson plan...${colors.reset}`);
    const lessonPlanData = await generateLessonPlan(numItems);

    console.clear(); // Clear the console for a clean display
    console.log(formatLessonPlan(lessonPlanData));

  } catch (error) {
    console.error(`${colors.red}❌ Visualization error:${colors.reset}`, error);
  }
}

// Export for use in other files
export { visualizeLessonPlan, formatLessonPlan };

// Run if this file is executed directly
if (process.argv[1].endsWith('lesson-plan-visualizer.js')) {
  const numItems = process.argv[2] ? parseInt(process.argv[2]) : 8;
  visualizeLessonPlan(numItems);
}
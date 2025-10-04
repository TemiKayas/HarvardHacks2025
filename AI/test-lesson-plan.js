import { generateLessonPlan } from './lesson-plan-generator.js';

async function testLessonPlan() {
  try {
    console.log('📚 Testing Lesson Plan Generator\n');

    // Generate a lesson plan with 8 items
    console.log('=== Generating Lesson Plan (8 items) ===');
    const lessonPlan = await generateLessonPlan(8);

    console.log('\n📋 Lesson Plan Generated!\n');
    console.log(JSON.stringify(lessonPlan, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testLessonPlan();
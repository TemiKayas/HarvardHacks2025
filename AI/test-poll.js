import { generatePoll } from './poll-generator.js';

async function testPolls() {
  try {
    console.log('🗳️ Testing Poll Generator\n');

    // Test 2-option poll
    console.log('=== Testing 2-Option Poll ===');
    const poll2 = await generatePoll(2);
    console.log(JSON.stringify(poll2, null, 2));

    console.log('\n=== Testing 4-Option Poll ===');
    const poll4 = await generatePoll(4);
    console.log(JSON.stringify(poll4, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the tests
testPolls();
const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Test anxiety analyses endpoint
    const anxietyResponse = await fetch('http://localhost:5000/api/users/8b4be118-d696-41bd-85c5-729284cf0633/anxiety-analyses');
    const anxietyData = await anxietyResponse.json();
    
    console.log('=== ANXIETY ANALYSES ===');
    console.log(`Total count: ${anxietyData.length}`);
    if (anxietyData.length > 0) {
      const first = anxietyData[0];
      console.log('First item:');
      console.log('  anxiety_triggers:', first.anxiety_triggers || 'NULL/MISSING');
      console.log('  coping_strategies:', first.coping_strategies || 'NULL/MISSING');
      console.log('  personalized_response:', first.personalized_response ? first.personalized_response.substring(0, 50) + '...' : 'NULL/MISSING');
    }
    
    // Test intervention summaries endpoint
    const summariesResponse = await fetch('http://localhost:5000/api/users/8b4be118-d696-41bd-85c5-729284cf0633/intervention-summaries');
    const summariesData = await summariesResponse.json();
    
    console.log('\n=== INTERVENTION SUMMARIES ===');
    console.log(`Total count: ${summariesData.length}`);
    summariesData.forEach((summary, i) => {
      console.log(`\nSummary ${i + 1}:`);
      console.log('  conversation_count:', summary.conversation_count || 0);
      console.log('  key_points:', summary.key_points || 'EMPTY/NULL');
      console.log('  recommendations:', summary.recommendations || 'EMPTY/NULL');
      console.log('  limitations:', summary.limitations || 'EMPTY/NULL');
    });
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();
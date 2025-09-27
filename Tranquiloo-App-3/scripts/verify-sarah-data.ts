import { sqliteDatabase } from "../server/db";

function verifySarahData() {
  console.log("🔍 Verifying Sarah Johnson's data...\n");

  // Check anxiety analyses
  const anxietyData = sqliteDatabase.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN anxiety_triggers IS NOT NULL THEN 1 END) as with_triggers,
      COUNT(CASE WHEN coping_strategies IS NOT NULL THEN 1 END) as with_strategies,
      COUNT(CASE WHEN personalized_response IS NOT NULL THEN 1 END) as with_response
    FROM anxiety_analyses 
    WHERE user_id = '8b4be118-d696-41bd-85c5-729284cf0633'
  `).get();

  console.log("✅ ANXIETY ANALYSES:");
  console.log(`   Total: ${anxietyData.total}`);
  console.log(`   With triggers: ${anxietyData.with_triggers}`);
  console.log(`   With coping strategies: ${anxietyData.with_strategies}`);
  console.log(`   With personalized response: ${anxietyData.with_response}`);

  // Sample some triggers
  const sampleTrigger = sqliteDatabase.prepare(`
    SELECT anxiety_triggers, coping_strategies 
    FROM anxiety_analyses 
    WHERE user_id = '8b4be118-d696-41bd-85c5-729284cf0633' 
      AND anxiety_triggers IS NOT NULL
    LIMIT 1
  `).get();

  if (sampleTrigger) {
    console.log("\n   Sample triggers:", sampleTrigger.anxiety_triggers);
    console.log("   Sample strategies:", sampleTrigger.coping_strategies);
  }

  // Check intervention summaries
  const summaryData = sqliteDatabase.prepare(`
    SELECT 
      COUNT(*) as total,
      MIN(conversation_count) as min_conversations,
      MAX(conversation_count) as max_conversations,
      COUNT(CASE WHEN key_points IS NOT NULL THEN 1 END) as with_key_points,
      COUNT(CASE WHEN recommendations IS NOT NULL THEN 1 END) as with_recommendations,
      COUNT(CASE WHEN limitations IS NOT NULL THEN 1 END) as with_limitations
    FROM intervention_summaries 
    WHERE user_id = '8b4be118-d696-41bd-85c5-729284cf0633'
  `).get();

  console.log("\n✅ INTERVENTION SUMMARIES:");
  console.log(`   Total: ${summaryData.total}`);
  console.log(`   Conversation counts: ${summaryData.min_conversations} - ${summaryData.max_conversations}`);
  console.log(`   With key points: ${summaryData.with_key_points}`);
  console.log(`   With recommendations: ${summaryData.with_recommendations}`);
  console.log(`   With limitations: ${summaryData.with_limitations}`);

  // Sample intervention summary
  const sampleSummary = sqliteDatabase.prepare(`
    SELECT conversation_count, key_points, recommendations, limitations 
    FROM intervention_summaries 
    WHERE user_id = '8b4be118-d696-41bd-85c5-729284cf0633'
    ORDER BY conversation_count DESC
    LIMIT 1
  `).get();

  if (sampleSummary) {
    console.log("\n   Sample summary (highest conversations):");
    console.log("   Conversation count:", sampleSummary.conversation_count);
    console.log("   Key points:", sampleSummary.key_points ? JSON.parse(sampleSummary.key_points).length + " items" : "None");
    console.log("   Recommendations:", sampleSummary.recommendations ? JSON.parse(sampleSummary.recommendations).length + " items" : "None");
    console.log("   Limitations:", sampleSummary.limitations ? JSON.parse(sampleSummary.limitations).length + " items" : "None");
  }

  console.log("\n✨ Data verification complete!");
}

verifySarahData();
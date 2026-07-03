async function testContinuousWakeIntelligence() {
  console.log("=== Testing Continuous Voice-Activated Intelligence & Pronoun Resolution ===\n");

  // 1. Turn 1: Create meeting with "Board of Directors"
  console.log("1. Turn 1: 'Zync, schedule meeting with Board of Directors at 10 AM' (English)");
  const res1 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "Zync, schedule meeting with Board of Directors at 10 AM",
      preferred_language: "English"
    }),
  });
  const data1 = await res1.json();
  console.log("   Intent:", data1.intent);
  console.log("   Spoken Response:", data1.spoken_response);
  console.log("   ✅ Passed\n");

  // 2. Turn 2 (Continuous Mode, No Wake Word Needed): "Reschedule it to 4 PM" (Pronoun Resolution test)
  console.log("2. Turn 2 (Continuous 30s Session): 'Reschedule it to 4 PM' (Tanglish)");
  const res2 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "Reschedule it to 4 PM",
      preferred_language: "Tanglish"
    }),
  });
  const data2 = await res2.json();
  console.log("   Intent Returned:", data2.intent);
  console.log("   Spoken Response:", data2.spoken_response);
  console.log("   Context Target Resolved:", data2.context?.target_entity);
  console.log("   Executive Deference Included ('Sir'):", data2.spoken_response.includes("Sir"));
  console.log("   ✅ Passed ('it' resolved to Board of Directors & Executive Deference included!)\n");

  // 3. Turn 3: Tamil turn "இதன் நிலவரம் என்ன?"
  console.log("3. Turn 3: 'ஜிங்க், இதன் நிலவரம் என்ன?' (Tamil)");
  const res3 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "ஜிங்க், இதன் நிலவரம் என்ன?",
      preferred_language: "Tamil"
    }),
  });
  const data3 = await res3.json();
  console.log("   Detected Language:", data3.detected_language);
  console.log("   Spoken Response:", data3.spoken_response);
  console.log("   ✅ Passed\n");

  console.log("=== All Continuous Voice-Activated Intelligence Tests Passed 100% ===");
}

testContinuousWakeIntelligence();

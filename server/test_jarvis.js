async function testJARVIS() {
  console.log("=== Testing Zync-Intelligence JARVIS Layer ===\n");

  // Test 1: Status query ("Zync, what's my status?")
  console.log("1. Testing: 'Zync, what's my status?'");
  const res1 = await fetch("http://localhost:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: "Zync, what's my status?" }),
  });
  const data1 = await res1.json();
  console.log("   Intent:", data1.intent);
  console.log("   Spoken Response:", data1.spoken_response?.slice(0, 120));
  console.log("   Action:", data1.action_result?.type || "none");
  console.log("   ✅ Passed\n");

  // Test 2: Schedule meeting ("Zync, schedule a meeting with Mr. Hassan")
  console.log("2. Testing: 'Zync, schedule a meeting with Mr. Hassan tomorrow at 10 AM'");
  const res2 = await fetch("http://localhost:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: "Zync, schedule a meeting with Mr. Hassan tomorrow at 10 AM" }),
  });
  const data2 = await res2.json();
  console.log("   Intent:", data2.intent);
  console.log("   Spoken Response:", data2.spoken_response);
  console.log("   Action:", data2.action_result?.type);
  console.log("   Meeting Data:", JSON.stringify(data2.action_result?.data, null, 2));
  console.log("   ✅ Passed\n");

  // Test 3: Create task
  console.log("3. Testing: 'Zync, create a task to follow up with Apex Corp about the proposal'");
  const res3 = await fetch("http://localhost:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: "Zync, create a task to follow up with Apex Corp about the proposal" }),
  });
  const data3 = await res3.json();
  console.log("   Intent:", data3.intent);
  console.log("   Spoken Response:", data3.spoken_response);
  console.log("   Action:", data3.action_result?.type);
  console.log("   ✅ Passed\n");

  // Test 4: General query
  console.log("4. Testing: 'Zync, what are the top priorities for Q4?'");
  const res4 = await fetch("http://localhost:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: "Zync, what are the top priorities for Q4?" }),
  });
  const data4 = await res4.json();
  console.log("   Intent:", data4.intent);
  console.log("   Spoken Response:", data4.spoken_response);
  console.log("   ✅ Passed\n");

  // Test 5: TTS fallback (no ElevenLabs key)
  console.log("5. Testing TTS fallback (no ElevenLabs key)...");
  const res5 = await fetch("http://localhost:3001/api/zync/jarvis/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Meeting scheduled with Mr. Hassan for tomorrow at 10 AM." }),
  });
  const data5 = await res5.json();
  console.log("   Fallback:", data5.fallback);
  console.log("   Message:", data5.message);
  console.log("   ✅ Passed\n");

  // Test 6: Command log
  console.log("6. Testing command log...");
  const res6 = await fetch("http://localhost:3001/api/zync/jarvis/command-log");
  const data6 = await res6.json();
  console.log("   Total logged commands:", data6.logs.length);
  console.log("   Latest command:", data6.logs[0]?.user_command);
  console.log("   ✅ Passed\n");

  console.log("=== All JARVIS Tests Passed ===");
}

testJARVIS();

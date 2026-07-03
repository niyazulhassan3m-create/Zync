async function test6Modules() {
  console.log("=== Testing Zync powered by Lab-Y 6 Strategic Modules ===");

  console.log("\n1. Executive Voice (Voice-to-Action)...");
  const res1 = await fetch("http://localhost:3001/api/zync/voice-to-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_transcript: "Schedule strategic review with Apex Corp tomorrow at 2 PM regarding lead software architect." }),
  });
  console.log("Voice-to-Action Output:", await res1.json());

  console.log("\n2. Morning Pulse Briefing...");
  const res2 = await fetch("http://localhost:3001/api/zync/morning-pulse");
  console.log("Morning Pulse Output:", await res2.json());

  console.log("\n3. Stakeholder Sentiment Analysis...");
  const res3 = await fetch("http://localhost:3001/api/zync/analyze-sentiment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Candidate demonstrated exceptional executive presence and deep domain expertise.", candidate_name: "John Doe" }),
  });
  console.log("Sentiment Output:", await res3.json());

  console.log("\n4. Smart Auto-Drafting ('Execute Communication')...");
  const res4 = await fetch("http://localhost:3001/api/zync/auto-draft-communication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity_name: "Jane Smith", communication_type: "Email", topic: "Executive Offer Sync" }),
  });
  console.log("Auto-Draft Output:", await res4.json());

  console.log("\n5. Market Intelligence Overlay...");
  const res5 = await fetch("http://localhost:3001/api/zync/market-intelligence-overlay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity_name: "Jane Smith", roleCategory: "Technology" }),
  });
  console.log("Market Overlay Output:", await res5.json());

  console.log("\n6. Executive Progress Visualizer Metrics...");
  const res6 = await fetch("http://localhost:3001/api/zync/performance-metrics");
  console.log("Performance Ring Metrics:", await res6.json());
}

test6Modules();

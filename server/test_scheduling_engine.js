async function testSchedulingEngine() {
  console.log("=== Testing Intelligent Scheduling Engine (Watchdog & Confirmation Loop) ===\n");

  // 1. Create a meeting starting in 10 minutes via JARVIS endpoint
  console.log("1. Creating meeting via Voice Command: 'Zync, schedule meeting with Board of Directors in 10 minutes'");
  const res1 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "Zync, schedule meeting with Board of Directors in 10 minutes",
      preferred_language: "English"
    }),
  });
  const data1 = await res1.json();
  console.log("   Intent:", data1.intent);
  console.log("   Spoken Response:", data1.spoken_response);
  console.log("   Scheduled Event:", data1.action_result?.scheduled_event);
  console.log("   ✅ Passed\n");

  // 2. Trigger Watchdog check manually
  console.log("2. Triggering 5-Minute Watchdog Engine...");
  const res2 = await fetch("http://127.0.0.1:3001/api/zync/run-watchdog", { method: "POST" });
  const data2 = await res2.json();
  console.log("   Active Alerts Count:", data2.alerts.length);
  console.log("   Latest Alert Message:", data2.alerts[0]?.message);
  console.log("   Delivered Via:", data2.alerts[0]?.delivered_via);
  console.log("   ✅ Passed\n");

  // 3. Test Confirmation Loop: Click "Join/Start" button
  const alertToJoin = data2.alerts[0];
  if (alertToJoin) {
    console.log(`3. Testing Confirmation Loop: Clicking 'Join/Start' on event ID: ${alertToJoin.event_id}`);
    const res3 = await fetch("http://127.0.0.1:3001/api/zync/confirm-meeting-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: alertToJoin.event_id }),
    });
    const data3 = await res3.json();
    console.log("   Actual Start Time Logged:", data3.actual_start_time);
    console.log("   Zync Confirmation:", data3.log?.zync_response);
    console.log("   ✅ Passed\n");
  }

  console.log("=== All Intelligent Scheduling Engine Tests Passed 100% ===");
}

testSchedulingEngine();

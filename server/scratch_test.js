async function testApi() {
  console.log("1. Fetching Workspace status...");
  const res1 = await fetch("http://localhost:3001/api/zync/workspace");
  const data1 = await res1.json();
  console.log("Workspace:", data1.workspace);

  console.log("\n2. Testing Protected Voice-to-Action before Lab-Y activation (should be 403 Forbidden)...");
  const res2 = await fetch("http://localhost:3001/api/zync/trigger-voice-to-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_transcript: "Schedule candidate interview" }),
  });
  console.log("Status Code:", res2.status);
  console.log("Response:", await res2.json());

  console.log("\n3. Lab-Y Founder flips Service Activation Switch to ACTIVE (true)...");
  const res3 = await fetch("http://localhost:3001/api/lab-y/toggle-workspace-service", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspace_id: "WS-LABY-7842",
      service_provider_activation_status: true,
    }),
  });
  const data3 = await res3.json();
  console.log("Activation Response:", data3);

  console.log("\n4. Testing Protected Voice-to-Action AFTER Lab-Y activation (should be 200 OK)...");
  const res4 = await fetch("http://localhost:3001/api/zync/trigger-voice-to-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_transcript: "Schedule candidate interview" }),
  });
  console.log("Status Code:", res4.status);
  console.log("Response:", await res4.json());
}

testApi();

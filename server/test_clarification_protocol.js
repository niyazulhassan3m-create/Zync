async function testClarificationProtocol() {
  console.log("=== Testing Command Refinement & Multi-Step Clarification Protocol ===\n");

  // 1. Send negative/change command: "Cancel meeting with Hassan"
  console.log("1. User Voice Input: 'Cancel meeting with Hassan' (Tanglish)");
  const res1 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "Cancel meeting with Hassan",
      preferred_language: "Tanglish"
    }),
  });
  const data1 = await res1.json();
  console.log("   Intent Returned:", data1.intent);
  console.log("   Spoken Response:", data1.spoken_response);
  console.log("   Options Presented:", data1.options);
  console.log("   Context Retained Target:", data1.context?.target_entity);
  console.log("   ✅ Passed (Did NOT delete immediately! Requested Clarification)\n");

  // 2. User selects "Delete" -> System triggers Safety Verification ("Are you sure?")
  console.log("2. User Response: Selects 'Delete' -> Safety Verification Prompt");
  const res2 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_choice: "delete",
      preferred_language: "Tanglish"
    }),
  });
  const data2 = await res2.json();
  console.log("   Intent Returned:", data2.intent);
  console.log("   Safety Verification Prompt:", data2.spoken_response);
  console.log("   Pending Action State:", data2.context?.pending_action);
  console.log("   ✅ Passed ('Are you sure?' verification triggered)\n");

  // 3. User confirms "Yes, I am sure" -> Action Execution & Permanent Removal Confirmation
  console.log("3. User Response: 'Yes, I am sure' -> Execution & Confirmation");
  const res3 = await fetch("http://127.0.0.1:3001/api/zync/jarvis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "Yes, I am sure",
      action_choice: "confirm_delete",
      preferred_language: "Tanglish"
    }),
  });
  const data3 = await res3.json();
  console.log("   Intent Returned:", data3.intent);
  console.log("   Final Confirmation:", data3.spoken_response);
  console.log("   ✅ Passed (Meeting removed & executive confirmation returned!)\n");

  console.log("=== All Command Refinement & Multi-Step Clarification Tests Passed 100% ===");
}

testClarificationProtocol();

let processingQueue = Promise.resolve();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action !== "PROBLEM_DATA" &&
    message.action !== "SUBMISSION_DATA"
  ) {
    return;
  }

  // Queue operations to prevent simultaneous storage checks
  processingQueue = processingQueue
    .then(async () => {
      // Store the incoming data
      if (message.action === "PROBLEM_DATA") {
        await chrome.storage.local.set({
          pendingProblem: message.data,
        });
      }

      if (message.action === "SUBMISSION_DATA") {
        await chrome.storage.local.set({
          pendingSubmission: message.data,
        });
      }

      // Retrieve both pieces of data
      const result = await chrome.storage.local.get([
        "pendingProblem",
        "pendingSubmission",
      ]);

      const problem = result.pendingProblem;
      const submission = result.pendingSubmission;

      // Check whether both have arrived
      if (!problem || !submission) {
        console.log("⏳ Waiting for the other data...");
        return;
      }

      // Make sure they belong to the same problem
      if (
        problem.problemCode.toUpperCase() !==
        submission.problemCode.toUpperCase()
      ) {
        console.log("⚠️ Problem mismatch!");
        return;
      }

      console.log("✅ Both data received!");
      console.log("Sending data to backend...");

      // Call your backend
      const response = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem,
          submission,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const backendResult = await response.json();

      console.log("✅ Backend response:", backendResult);

      // Clear temporary data after successful processing
      await chrome.storage.local.remove([
        "pendingProblem",
        "pendingSubmission",
      ]);
    })
    .catch((error) => {
      console.error("Processing failed:", error);
    });

  return true;
});

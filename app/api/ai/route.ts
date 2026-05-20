async function autoDebugFix(initialError: string, memoryContext: string, projectContext: string) {
  const maxRetries = 3;
  let lastError = initialError;

  for (let i = 0; i < maxRetries; i++) {
    const fixRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        stream: false,
        prompt: `
You are fixing a Next.js build error.

MEMORY:
${memoryContext}

PROJECT:
${projectContext}

ERROR:
${lastError}

TASK:
Fix the issue by outputting ONLY JSON file patches:

[
  {
    "type": "write",
    "filePath": "path",
    "content": "full corrected file"
  }
]

No explanation.
        `,
      }),
    });

    const data = await fixRes.json();

    let parsed;

    try {
      parsed = JSON.parse(data.response);
    } catch {
      break;
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        await fetch("http://localhost:3000/api/ai-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              type: "write",
              filePath: item.filePath,
              content: item.content,
            },
          ]),
        });
      }
    }

    // re-run build after fix
    const testRes = await fetch("http://localhost:3000/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "npm run build" }),
    });

    const testData = await testRes.json();

    if (!testData.stderr && !testData.error) {
      return {
        success: true,
        fixed: true,
      };
    }

    lastError = testData.stderr || testData.error || "unknown error";
  }

  return {
    success: false,
    fixed: false,
    lastError,
  };
}
/**
 * POST /api/auto-debug
 *
 * Triggers a build via /api/terminal and returns the output.
 * LOCAL ONLY — returns 501 on Vercel (blocking builds are not
 * compatible with serverless function timeouts).
 *
 * Phase 2 will replace this with an async queue + polling architecture.
 */

const IS_VERCEL = process.env.VERCEL === "1";

export async function POST(req: Request) {
  if (IS_VERCEL) {
    return Response.json(
      {
        error:
          "auto-debug requires local runtime. " +
          "Blocking builds are not supported in Vercel serverless functions. " +
          "Phase 2 will provide async queued build support.",
        code: "LOCAL_ONLY",
      },
      { status: 501 }
    );
  }

  try {
    const { command = "npm run build" } = await req.json();

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const res = await fetch(`${baseUrl}/api/terminal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });

    const data = await res.json();

    return Response.json({
      command,
      stdout: data.stdout,
      stderr: data.stderr,
      error: data.error,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Auto debug failed" },
      { status: 500 }
    );
  }
}

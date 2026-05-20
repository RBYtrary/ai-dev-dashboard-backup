/**
 * AUTO-DEBUG ROUTE
 * Triggers the terminal API to run a build and returns output.
 *
 * Uses request URL to derive base URL — works on localhost, Vercel preview,
 * and production without any environment variable configuration.
 */
export async function POST(req: Request) {
  try {
    const { command = "npm run build" } = await req.json();

    // Derive base URL from incoming request — safe on all environments
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

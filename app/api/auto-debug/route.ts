export async function POST(req: Request) {
  try {
    const { command = "npm run build" } = await req.json();

    const res = await fetch("http://localhost:3000/api/terminal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
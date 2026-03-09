export async function POST(request: Request) {
  const payload = await request.json();

  return Response.json(
    {
      accepted: true,
      source: "demo",
      receivedAt: new Date().toISOString(),
      payload
    },
    { status: 202 }
  );
}


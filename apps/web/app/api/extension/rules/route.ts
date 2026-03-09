import { sampleBlocklists, sampleItems } from "@blacktube/shared";

export async function GET() {
  return Response.json({
    blocklists: sampleBlocklists,
    items: sampleItems,
    mode: "autoskip",
    source: "demo"
  });
}


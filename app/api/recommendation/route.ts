import { deterministicRecommendation } from "../../../lib/governance.mjs";

const MODEL = "gpt-5.6-sol";

function outputText(response: Record<string, unknown>) {
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output as Array<Record<string, unknown>>) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content as Array<Record<string, unknown>>) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

export async function POST(request: Request) {
  const record = await request.json() as Record<string, unknown>;
  const fallback = deterministicRecommendation(record);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ recommendation: fallback, engine: "Rules v1", mode: "deterministic", note: "GPT advisory is not configured; no model output was represented as authority." });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "developer", content: "You are an enterprise governance architect. Analyze evidence, but never grant authority. Repetition is a drift signal, not jurisdiction. Recommend the smallest reviewable next action. Do not invent owners, policies, or facts." },
          { role: "user", content: JSON.stringify(record) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "governance_recommendation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                rationale: { type: "string" },
                nextAction: { type: "string" },
                risk: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["headline", "rationale", "nextAction", "risk"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
    const body = await response.json() as Record<string, unknown>;
    const recommendation = JSON.parse(outputText(body));
    return Response.json({ recommendation, engine: MODEL, mode: "ai-advisory", responseId: body.id });
  } catch (error) {
    return Response.json({ recommendation: fallback, engine: "Rules v1", mode: "fallback", note: error instanceof Error ? error.message : "AI advisory unavailable" });
  }
}

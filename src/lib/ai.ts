// One function, two possible AI providers.
// The app uses whichever key is set in the environment:
//   GEMINI_API_KEY     -> Google Gemini (free tier available)
//   ANTHROPIC_API_KEY  -> Anthropic Claude
// Both are asked for the same MealPlanSchema, and both answers are validated
// the same way, so the rest of the app never knows which one ran.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { MealPlanSchema, type MealPlan } from "./types";

/** An error with a message that is safe to show the user, plus an HTTP status. */
export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function generateMealPlan(system: string, user: string, signal: AbortSignal): Promise<MealPlan> {
  if (process.env.GEMINI_API_KEY) return withGemini(system, user, signal);
  if (process.env.ANTHROPIC_API_KEY) return withClaude(system, user, signal);
  console.error("No AI key set: add GEMINI_API_KEY or ANTHROPIC_API_KEY");
  throw new AiError(500, "The server isn't set up correctly. (AI key)");
}

/* ---------- Google Gemini ---------- */
async function withGemini(system: string, user: string, signal: AbortSignal): Promise<MealPlan> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // Turn our Zod schema into plain JSON Schema, which Gemini understands.
  // Drop two fields Gemini doesn't need. Our own validation still runs afterwards.
  const jsonSchema = JSON.parse(
    JSON.stringify(z.toJSONSchema(MealPlanSchema), (key, value) =>
      key === "$schema" || key === "additionalProperties" ? undefined : value),
  );

  // Free-tier models are sometimes overloaded (HTTP 503) or out of quota (429).
  // So: try the main model twice, then a lighter model twice, with short pauses.
  // GEMINI_MODEL can override the list, e.g. "gemini-flash-latest,gemini-flash-lite-latest".
  const models = (process.env.GEMINI_MODEL || "gemini-flash-latest,gemini-flash-lite-latest")
    .split(",").map((m) => m.trim()).filter(Boolean);
  const attempts = models.flatMap((model) => [model, model]);
  let lastStatus = 0;

  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          abortSignal: signal,
        },
      });
      return validate(response.text);
    } catch (err) {
      if (signal.aborted) throw new AiError(499, "Stopped.");
      if (err instanceof AiError) throw err; // the answer came back but was unusable
      const status = err instanceof ApiError ? err.status : 0;
      lastStatus = status;
      if (status === 400 || status === 401 || status === 403) {
        console.error("Gemini rejected the request", model, status, (err as Error).message);
        throw new AiError(500, "The server isn't set up correctly. (AI key)");
      }
      console.warn(`Gemini attempt ${i + 1}/${attempts.length} failed`, model, status || (err as Error).message);
      const busy = status === 503 || status === 500 || status === 429;
      // A model that doesn't exist (404): skip its second try and move on.
      if (status === 404 && attempts[i + 1] === model) i++;
      else if (!busy && status !== 404) break; // unknown problem: don't keep hammering
      if (i + 1 < attempts.length) await pause(1500 * (i + 1), signal);
    }
  }

  if (lastStatus === 429) throw new AiError(429, "Today's free AI quota is used up. Try again later.");
  if (lastStatus === 503 || lastStatus === 500) throw new AiError(503, "Gemini is busy right now. Try again in a minute.");
  throw new AiError(502, "Planning failed. Try again in a moment.");
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

/* ---------- Anthropic Claude ---------- */
async function withClaude(system: string, user: string, signal: AbortSignal): Promise<MealPlan> {
  const anthropic = new Anthropic();
  try {
    const response = await anthropic.beta.messages.parse(
      {
        model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
        max_tokens: 16000,
        output_config: { effort: "medium", format: betaZodOutputFormat(MealPlanSchema) },
        // If the model ever declines a request, the API retries on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages: [{ role: "user", content: user }],
      },
      { signal },
    );
    if (response.stop_reason === "refusal") throw new AiError(422, "The AI couldn't plan with these settings. Try adjusting your preferences.");
    if (response.stop_reason === "max_tokens") throw new AiError(502, "The plan came back incomplete. Try again, or plan fewer dinners.");
    if (!response.parsed_output) throw new AiError(502, "The plan didn't come back in a usable form. Try again.");
    return response.parsed_output;
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Anthropic.APIUserAbortError) throw new AiError(499, "Stopped.");
    if (err instanceof Anthropic.RateLimitError) throw new AiError(429, "Too many requests right now. Wait a minute and try again.");
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key is missing or invalid");
      throw new AiError(500, "The server isn't set up correctly. (AI key)");
    }
    console.error("Claude call failed", err);
    throw new AiError(502, "Planning failed. Try again in a moment.");
  }
}

/* ---------- shared ---------- */
// Never trust AI output blindly: parse it and check it against the schema.
function validate(text: string | undefined): MealPlan {
  try {
    const result = MealPlanSchema.safeParse(JSON.parse(text ?? ""));
    if (result.success) return result.data;
    console.error("AI output failed validation", result.error.issues.slice(0, 3));
  } catch {
    console.error("AI output was not JSON");
  }
  throw new AiError(502, "The plan didn't come back in a usable form. Try again.");
}

// triage.ts — Single Azure OpenAI chat completion per item.
// JSON-mode response; strict shape validation; drop irrelevant items.
// See project-design.md §3.8.

import type { AzureOpenAI } from "openai";
import type { FeedItem, TriageResult } from "./types.js";

export const DEFAULT_TRIAGE_TEMPERATURE = 0;
export const DEFAULT_TRIAGE_MAX_TOKENS = 400;

export class MalformedTriageResponseError extends Error {
  public readonly rawPayload: string;
  public readonly issue: string;

  constructor(rawPayload: string, issue: string) {
    super(`Malformed Azure OpenAI triage response: ${issue}`);
    this.name = "MalformedTriageResponseError";
    this.rawPayload = rawPayload;
    this.issue = issue;
  }
}

/**
 * System prompt: MUST contain the literal word "JSON" (Azure JSON-mode
 * requirement; see investigation §1 gotcha 2) AND enumerate the four
 * required output fields.
 */
export const SYSTEM_PROMPT = [
  "You are an editorial triage assistant for a Claude Code knowledge hub aimed at bank colleagues who are learning Claude Code.",
  "For each news/blog item, decide whether it is relevant to that audience, then label it.",
  "",
  "Respond with a single JSON object and nothing else. The JSON object MUST have exactly these four fields:",
  '  - "relevant": boolean — true if useful for hub readers, false otherwise.',
  '  - "audience": one of "beginner" | "advanced" | "both".',
  '  - "topics": array of short kebab-case tags (e.g., "setup", "workflow", "github", "mcp", "claudemd"). Non-empty if relevant.',
  '  - "summary": a two-sentence plain-English summary of the item.',
  "",
  'Always return well-formed JSON. If the item is irrelevant, still return a complete JSON object with "relevant": false; the other fields may be defaults (audience "both", topics: [], summary: "Not relevant.").',
].join("\n");

const ALLOWED_AUDIENCE = new Set<string>(["beginner", "advanced", "both"]);

/**
 * Calls Azure OpenAI chat completions for one item. Returns:
 *  - TriageResult when the response is well-formed AND relevant === true
 *  - null when well-formed AND relevant === false (drop item, AC9)
 *
 * Throws MalformedTriageResponseError on shape mismatch (AC8 negative path).
 */
export async function triageItem(
  client: AzureOpenAI,
  deployment: string,
  item: FeedItem,
): Promise<TriageResult | null> {
  const userContent = buildUserContent(item);

  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: DEFAULT_TRIAGE_TEMPERATURE,
    max_tokens: DEFAULT_TRIAGE_MAX_TOKENS,
    response_format: { type: "json_object" },
  });

  const choice = response.choices?.[0];
  const rawContent = choice?.message?.content;
  if (typeof rawContent !== "string" || rawContent.length === 0) {
    throw new MalformedTriageResponseError(
      String(rawContent ?? ""),
      "empty or missing message content",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    throw new MalformedTriageResponseError(
      rawContent,
      `not valid JSON: ${String(err)}`,
    );
  }

  const validated = validate(parsed, rawContent);

  if (!validated.relevant) {
    return null;
  }

  return validated;
}

function buildUserContent(item: FeedItem): string {
  const parts: string[] = [];
  parts.push(`Feed: ${item.feedName}`);
  parts.push(`Title: ${item.title}`);
  if (item.link) parts.push(`Link: ${item.link}`);
  if (item.publishedAt) parts.push(`Published: ${item.publishedAt.toISOString()}`);
  if (item.rawContent) {
    // Truncate raw content to keep prompts cheap.
    const trimmed = item.rawContent.slice(0, 2000);
    parts.push("");
    parts.push("Content:");
    parts.push(trimmed);
  }
  return parts.join("\n");
}

function validate(parsed: unknown, raw: string): TriageResult {
  if (parsed === null || typeof parsed !== "object") {
    throw new MalformedTriageResponseError(raw, "response is not a JSON object");
  }
  const obj = parsed as Record<string, unknown>;

  const relevant = obj["relevant"];
  if (typeof relevant !== "boolean") {
    throw new MalformedTriageResponseError(raw, '"relevant" must be boolean');
  }

  const audience = obj["audience"];
  if (typeof audience !== "string" || !ALLOWED_AUDIENCE.has(audience)) {
    throw new MalformedTriageResponseError(
      raw,
      '"audience" must be one of "beginner" | "advanced" | "both"',
    );
  }

  const topics = obj["topics"];
  if (!Array.isArray(topics) || !topics.every((t) => typeof t === "string")) {
    throw new MalformedTriageResponseError(
      raw,
      '"topics" must be an array of strings',
    );
  }

  const summary = obj["summary"];
  if (typeof summary !== "string") {
    throw new MalformedTriageResponseError(raw, '"summary" must be a string');
  }

  return {
    relevant,
    audience: audience as TriageResult["audience"],
    topics: topics as string[],
    summary,
  };
}

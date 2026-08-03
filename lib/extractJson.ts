// Claude is instructed to return raw JSON, but occasionally wraps it in
// markdown code fences (```json ... ```) anyway. Strip those before parsing
// instead of assuming the response is always perfectly raw JSON.
export function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

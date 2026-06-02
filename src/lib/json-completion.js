export function extractJsonObjectText(value) {
  const text = String(value || '').trim()
  if (!text) return '{}'

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenced?.[1]) return fenced[1].trim()

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim()
  }

  return text
}

export function parseJsonCompletion(value, fallback = {}) {
  return JSON.parse(extractJsonObjectText(value) || JSON.stringify(fallback))
}

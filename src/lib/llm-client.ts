import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

type JsonCompletionOptions = {
  task?: 'cv_generation' | 'cv_revision'
  temperature?: number
  maxTokens?: number
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

function getAnthropicModel(task?: JsonCompletionOptions['task']) {
  if (task === 'cv_revision') {
    return process.env.ANTHROPIC_REVISION_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL
  }
  return process.env.ANTHROPIC_CV_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL
}

function getOpenAiModel(task?: JsonCompletionOptions['task']) {
  if (task === 'cv_revision') {
    return process.env.OPENAI_REVISION_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
  }
  return process.env.OPENAI_CV_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
}

function extractAnthropicText(response: Anthropic.Messages.Message) {
  return response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim()
}

export async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: JsonCompletionOptions = {}
) {
  const temperature = options.temperature ?? 0.25
  const maxTokens = options.maxTokens ?? 6000
  const anthropic = getAnthropicClient()

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: getAnthropicModel(options.task),
      max_tokens: maxTokens,
      temperature,
      system: `${systemPrompt}\n\nReturn ONLY valid JSON. Do not include markdown, prose, or code fences.`,
      messages: [{ role: 'user', content: userPrompt }],
    })

    return {
      provider: 'anthropic' as const,
      model: getAnthropicModel(options.task),
      text: extractAnthropicText(response),
    }
  }

  const openai = getOpenAiClient()
  if (!openai) {
    throw new Error('No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.')
  }

  const completion = await openai.chat.completions.create({
    model: getOpenAiModel(options.task),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  })

  return {
    provider: 'openai' as const,
    model: getOpenAiModel(options.task),
    text: completion.choices[0]?.message?.content || '{}',
  }
}

import test from 'node:test'
import assert from 'node:assert/strict'

import { extractJsonObjectText, parseJsonCompletion } from '../src/lib/json-completion.js'

test('extractJsonObjectText strips JSON code fences from model output', () => {
  assert.equal(extractJsonObjectText('```json\n{"ok":true}\n```'), '{"ok":true}')
  assert.deepEqual(parseJsonCompletion('```json\n{"ok":true}\n```'), { ok: true })
})

test('extractJsonObjectText recovers JSON surrounded by prose', () => {
  const output = 'Here is the result:\n{"optimizedCV":{"featuredProjects":[{"name":"Lumen UI"}]}}\nThanks'
  assert.equal(extractJsonObjectText(output), '{"optimizedCV":{"featuredProjects":[{"name":"Lumen UI"}]}}')
})

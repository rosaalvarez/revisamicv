import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: Record<string, any> = {}

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Test 1: SELECT
  const { data: selData, error: selError } = await supabaseAdmin
    .from('users')
    .select('id, tokens')
    .eq('email', 'rosita@test.com')
    .maybeSingle()
  results.select = selError 
    ? `ERROR: ${selError.code} - ${selError.message}` 
    : `OK - found: ${!!selData}`

  // Test 2: INSERT
  const testEmail = `test_${Date.now()}@debug.com`
  const { error: insError } = await supabaseAdmin
    .from('users')
    .insert({ email: testEmail, tokens: 0 })
    .select()
    .maybeSingle()
  results.insert = insError
    ? `ERROR: ${insError.code} - ${insError.message}`
    : 'OK'

  // Clean up
  if (!insError) {
    await supabaseAdmin.from('users').delete().eq('email', testEmail)
  }

  // Test 3: UPDATE
  const { error: updError } = await supabaseAdmin
    .from('users')
    .update({ tokens: 99 })
    .eq('email', 'rosita@test.com')
  results.update = updError
    ? `ERROR: ${updError.code} - ${updError.message}`
    : 'OK'

  // Revert
  await supabaseAdmin.from('users').update({ tokens: 0 }).eq('email', 'rosita@test.com')

  return NextResponse.json(results)
}
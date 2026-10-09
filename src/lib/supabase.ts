import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://dhsxejdegbspffuvdany.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoc3hlamRlZ2JzcGZmdXZkYW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTg0NzEsImV4cCI6MjEwNzA5NDQ3MX0.psGSm3o_RjkpxtcQ7y8fcprAo-xLCVR8UXYvHpDQ1Z8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

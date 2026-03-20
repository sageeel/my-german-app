import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kktqzigvrlftfssysxwv.supabase.co'
const supabaseAnonKey = 'sb_publishable_QEn7tZMurjtJAVPkCylIWA_594PZnce'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 브라우저 저장소 사용 안 함
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})
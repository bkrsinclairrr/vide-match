import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// A URL e a chave publicavel entram no bundle do navegador em qualquer cenario:
// sao identificadores publicos, nao segredos. Quem protege os dados e a RLS, nao o
// sigilo delas. Por isso a variavel de ambiente aqui serve para apontar outro projeto
// (preview, staging), e a ausencia dela nao pode derrubar o site inteiro — foi o que
// aconteceu quando o build de producao saiu sem as variaveis.
// O segredo de verdade e a serviceRole, que nunca sai da edge function.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mehmqibxzxfqdxqjnjad.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laG1xaWJ4enhmcWR4cWpuamFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTkwNzUsImV4cCI6MjA3MzY5NTA3NX0.8xbIsIoKavc1vAF_EubM-d7l_idPDqlJFHhVoTop26I';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
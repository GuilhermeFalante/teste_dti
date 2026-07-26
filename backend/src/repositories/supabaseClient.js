const { createClient } = require('@supabase/supabase-js');

function criarClienteSupabase() {
  const url = process.env.SUPABASE_URL;
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chaveServico) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos nas variáveis de ambiente do backend.',
    );
  }

  return createClient(url, chaveServico, {
    auth: { persistSession: false },
  });
}

module.exports = { criarClienteSupabase };

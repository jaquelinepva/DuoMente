// Run locally with SUPABASE_ACCESS_TOKEN supplied securely in the environment.
// This administrative token must never be deployed as an application variable.
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token)
  throw new Error('Defina SUPABASE_ACCESS_TOKEN no ambiente local. Não coloque o token no código.');
const endpoint = 'https://api.supabase.com/v1/projects/zctzankypfvcjlzaiaal/config/auth';
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const updated = await fetch(endpoint, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ password_hibp_enabled: true }),
});
if (!updated.ok) throw new Error(`Supabase recusou a alteração (HTTP ${updated.status}).`);
const response = await fetch(endpoint, { headers });
if (!response.ok) throw new Error(`Falha ao verificar configuração (HTTP ${response.status}).`);
const config = await response.json();
if (config.password_hibp_enabled !== true)
  throw new Error('Proteção ainda não confirmada. Não liberar usuários reais.');
console.log('Proteção contra senhas vazadas: ativada e verificada.');

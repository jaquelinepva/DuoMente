import { test, expect } from '@playwright/test';
test('landing e páginas públicas respondem sem erros', async ({ request }) => {
  for (const path of [
    '/',
    '/como-funciona',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/privacidade',
    '/termos',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text()).toContain('DuoMente');
  }
});
test('páginas protegidas redirecionam usuário não autenticado', async ({ request }) => {
  for (const path of [
    '/app',
    '/app/onboarding',
    '/app/diagnostico',
    '/app/diagnostico/relatorio',
    '/app/decisoes',
    '/app/acoes',
    '/app/empresa',
    '/app/equipe',
    '/app/configuracoes',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    expect(response.headers().location).toContain('/login');
  }
});
test('rotas fora do MVP não existem', async ({ request }) => {
  for (const path of ['/crm', '/dashboard', '/billing'])
    expect((await request.get(path)).status()).toBe(404);
});

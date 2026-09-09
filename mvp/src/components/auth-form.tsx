'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { browserDb } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
const schema = z.object({ email: z.email('Informe um e-mail válido.'), password: z.string() });
export function AuthForm({ mode }: { mode: 'login' | 'cadastro' | 'recuperar-senha' }) {
  const router = useRouter();
  const [message, setMessage] = useState(''),
    [recover, setRecover] = useState(false),
    [ready, setReady] = useState(mode !== 'recuperar-senha');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  useEffect(() => {
    const c = browserDb();
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      c.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) setMessage('Link inválido ou expirado. Solicite outro.');
        else if (mode === 'recuperar-senha') {
          setRecover(true);
          setValue('email', data.user?.email ?? '');
        } else router.replace('/app');
        setReady(true);
        window.history.replaceState({}, '', url.pathname);
      });
    } else void Promise.resolve().then(() => setReady(true));
    const { data } = c.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecover(true);
        setValue('email', session?.user.email ?? '');
      }
    });
    return () => data.subscription.unsubscribe();
  }, [mode, router, setValue]);
  return (
    <form
      className="stack"
      onSubmit={handleSubmit(async (value) => {
        setMessage('');
        const c = browserDb();
        if (mode === 'cadastro' || recover) {
          if (value.password.length < 10) {
            setMessage('Use uma senha com pelo menos 10 caracteres.');
            return;
          }
        }
        if (recover) {
          const { error } = await c.auth.updateUser({ password: value.password });
          setMessage(
            error
              ? 'Não foi possível atualizar a senha. Solicite outro link.'
              : 'Senha atualizada. Você já pode entrar.',
          );
          if (!error) router.push('/app');
          return;
        }
        if (mode === 'login') {
          const { error } = await c.auth.signInWithPassword(value);
          if (error)
            setMessage(
              'Não foi possível entrar. Verifique e-mail, senha e confirmação de cadastro.',
            );
          else {
            router.push('/app');
            router.refresh();
          }
        } else if (mode === 'cadastro') {
          const { error } = await c.auth.signUp({
            ...value,
            options: { emailRedirectTo: window.location.origin + '/login' },
          });
          setMessage(
            error
              ? 'Não foi possível concluir o cadastro. Tente novamente.'
              : 'Confira seu e-mail para confirmar o cadastro.',
          );
        } else {
          const { error } = await c.auth.resetPasswordForEmail(value.email, {
            redirectTo: window.location.origin + '/recuperar-senha',
          });
          setMessage(
            error
              ? 'Não foi possível enviar a solicitação agora. Tente novamente mais tarde.'
              : 'Se houver uma conta para esse e-mail, você receberá o link de recuperação.',
          );
        }
      })}
    >
      <label className="field">
        E-mail
        <input type="email" autoComplete="email" {...register('email')} />
      </label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      {(mode !== 'recuperar-senha' || recover) && (
        <label className="field">
          {recover ? 'Nova senha' : 'Senha'}
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            {...register('password')}
            minLength={mode === 'login' ? 1 : 10}
            required
          />
        </label>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      <Button disabled={isSubmitting || !ready}>
        {isSubmitting
          ? 'Aguarde…'
          : recover
            ? 'Atualizar senha'
            : mode === 'login'
              ? 'Entrar'
              : mode === 'cadastro'
                ? 'Criar minha conta'
                : 'Enviar link de recuperação'}
      </Button>
    </form>
  );
}

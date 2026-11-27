import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { type Session } from '@/entities/session';
import { getErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';

import { loginFormSchema, type LoginFormValues } from '../model/login-form';
import { useLogin } from '../model/use-login';
import styles from './login-form.module.css';

type LoginFormProps = {
  onSuccess?: (session: Session) => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  });
  const loginMutation = useLogin({ onSuccess });

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit((values) => loginMutation.submit(values))}
      noValidate
    >
      <TextField
        label="아이디"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {loginMutation.isError && (
        <p role="alert" className={styles.error}>
          {getErrorMessage(loginMutation.error)}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth disabled={loginMutation.isPending}>
        {loginMutation.isPending ? '로그인 중…' : '로그인'}
      </Button>
    </form>
  );
}

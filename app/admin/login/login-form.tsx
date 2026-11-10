'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="login-form">
      <label>
        Password
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="a-btn a-btn-primary" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}

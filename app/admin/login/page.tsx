import { redirect } from 'next/navigation';
import { Brand } from '@/components/site/brand';
import { adminConfigured, isAdmin } from '@/lib/auth';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  return (
    <div className="login">
      <Brand />
      <h1>Studio admin</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="notice">
          Admin is disabled. Set the <code>ADMIN_PASSWORD</code> environment variable on the server and restart.
        </p>
      )}
    </div>
  );
}

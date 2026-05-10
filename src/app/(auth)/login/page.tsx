import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Log In | Fantasy Stocks' };

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted mt-1 text-sm">Sign in to your Fantasy Stocks account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function ResendActivationForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState(emailParam || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-activation`, {
        email,
      });
      setMessage(response.data.message || 'New activation link sent! Please check your email.');
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      
      if (error.response?.status === 429) {
        setMessage('⏰ Please wait before requesting another activation email.');
      } else {
        setMessage(`❌ ${error.response?.data?.message || 'Failed to resend activation email'}`);
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Resend Activation Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a new activation link
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className={`text-sm text-center p-3 rounded ${
              success 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Resend Activation Email'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
            >
              Already activated? Sign in →
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResendActivationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResendActivationForm />
    </Suspense>
  );
}

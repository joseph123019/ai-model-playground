'use client';

import { useState, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(true);

  const handleResend = async () => {
    if (!email) return;
    
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-activation`, {
        email,
      });
      setMessage('✅ New activation link sent! Please check your email.');
      setCanResend(false);
      
      // Re-enable button after 5 minutes
      setTimeout(() => {
        setCanResend(true);
      }, 5 * 60 * 1000);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 429) {
        setMessage('⏰ Please wait before requesting another email.');
        setCanResend(false);
        setTimeout(() => setCanResend(true), 5 * 60 * 1000);
      } else {
        setMessage(`❌ ${error.response?.data?.message || 'Failed to resend activation email'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registration Successful!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ✅ Your account has been created
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <p className="text-gray-700">
              <strong>Please check your email to activate your account.</strong>
            </p>

            {email && (
              <p className="text-sm text-gray-500">
                Activation email sent to: <strong>{email}</strong>
              </p>
            )}

            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Didn&apos;t receive the email? Check your spam folder or request a new one:
              </p>

              <button
                onClick={handleResend}
                disabled={!canResend || loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend Activation Email'}
              </button>

              {message && (
                <div className="mt-4 text-sm text-center">
                  {message}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <a
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Already activated? Sign in →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterSuccessContent />
    </Suspense>
  );
}

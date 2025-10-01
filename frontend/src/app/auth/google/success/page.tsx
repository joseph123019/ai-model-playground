'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  useEffect(() => {
    console.log('🔍 Google success page loaded');
    const token = searchParams.get('token');
    const userData = searchParams.get('user');
    
    console.log('📝 Token exists:', !!token);
    console.log('👤 User data exists:', !!userData);
    
    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        console.log('✅ User parsed:', user.email);
        login(token, user);
        console.log('✅ Login successful, redirecting to home...');
      } catch (error) {
        console.error('❌ Failed to parse user data:', error);
        localStorage.setItem('token', token);
      }
      
      // Redirect to home
      setTimeout(() => {
        console.log('🔄 Redirecting to /');
        router.push('/');
      }, 1000);
    } else {
      console.log('⚠️ Missing token or user data, redirecting to login');
      router.push('/login');
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GoogleSuccessContent />
    </Suspense>
  );
}

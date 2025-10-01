'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Response {
  id: string;
  model: string;
  content: string;
  tokens: number;
  cost: number;
  status: string;
  duration: number;
  createdAt: string;
}

interface Session {
  id: string;
  prompt: string;
  createdAt: string;
  responses: Response[];
  totalTokens: number;
  totalCost: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSessions(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchSessions();
  }, [authLoading, isAuthenticated, router, fetchSessions]);

  const viewSession = async (sessionId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedSession(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load session');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFastestModel = (responses: Response[]) => {
    return responses.reduce((fastest, r) =>
      r.duration && (!fastest.duration || r.duration < fastest.duration) ? r : fastest
    , responses[0]);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">Comparison History</h1>
              <Link
                href="/"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Back to Playground
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Comparisons Yet</h2>
            <p className="text-gray-600 mb-4">Start your first AI model comparison!</p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Go to Playground
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Past Comparisons ({sessions.length})
              </h2>
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                {sessions.map((session) => {
                  const fastest = getFastestModel(session.responses);
                  return (
                    <div
                      key={session.id}
                      onClick={() => viewSession(session.id)}
                      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        selectedSession?.id === session.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                        {session.prompt}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {formatDate(session.createdAt)}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-x-2">
                          <span className="text-gray-600">📝 {session.totalTokens.toLocaleString()}</span>
                          <span className="text-gray-600">💲 ${session.totalCost.toFixed(4)}</span>
                        </div>
                        {fastest.duration && (
                          <span className="text-blue-600">⚡ {(fastest.duration / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-1">
                        {session.responses.map((r, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${
                              r.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {r.model.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Detail */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Prompt</h2>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedSession.prompt}</p>
                    <p className="text-sm text-gray-500 mt-2">{formatDate(selectedSession.createdAt)}</p>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-lg font-bold text-indigo-600">
                        {selectedSession.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Tokens</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        ${selectedSession.totalCost.toFixed(6)}
                      </div>
                      <div className="text-xs text-gray-600">Total Cost</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-bold text-blue-600">
                        {getFastestModel(selectedSession.responses).model}
                      </div>
                      <div className="text-xs text-gray-600">⚡ Fastest</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {selectedSession.responses.length}
                      </div>
                      <div className="text-xs text-gray-600">Models</div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Responses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSession.responses.map((response) => (
                        <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{response.model}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                response.status === 'complete'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {response.status}
                            </span>
                          </div>
                          <div className="mb-3 text-xs text-gray-600 space-y-1">
                            <div>📝 Tokens: {response.tokens?.toLocaleString()}</div>
                            <div>💲 Cost: ${response.cost?.toFixed(6)}</div>
                            {response.duration && (
                              <div>⏱️ Time: {(response.duration / 1000).toFixed(2)}s</div>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-900 max-h-60 overflow-y-auto">
                            <ReactMarkdown>{response.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Comparison</h2>
                  <p className="text-gray-600">Click on a past comparison to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

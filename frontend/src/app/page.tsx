'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReactMarkdown from 'react-markdown';

type SelectionMode = 'cheapest' | 'fastest-cheapest' | 'premium' | 'manual';

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('cheapest');
  const [manualOpenAI, setManualOpenAI] = useState('gpt-4o-mini');
  const [manualAnthropic, setManualAnthropic] = useState('claude-sonnet-4-20250514');
  const [selectedModels, setSelectedModels] = useState({ openai: 'GPT-4o Mini', anthropic: 'Claude Sonnet 4' });
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { connected, responses, statuses, finalMetrics, startComparison, reset } = useWebSocket();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth check is complete AND user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Update selected models when mode changes
  useEffect(() => {
    const modelMap: Record<SelectionMode, { openai: string; anthropic: string }> = {
      'cheapest': { openai: 'GPT-4o Mini', anthropic: 'Claude Sonnet 4' },
      'fastest-cheapest': { openai: 'GPT-4o Mini', anthropic: 'Claude Sonnet 4' },
      'premium': { openai: 'GPT-4o', anthropic: 'Claude Opus 4' },
      'manual': { openai: manualOpenAI === 'gpt-4o' ? 'GPT-4o' : 'GPT-4o Mini', 
                  anthropic: manualAnthropic === 'claude-opus-4-20250514' ? 'Claude Opus 4' : 'Claude Sonnet 4' },
    };
    setSelectedModels(modelMap[selectionMode]);
  }, [selectionMode, manualOpenAI, manualAnthropic]);

  // Reset comparing state when both models complete or error
  useEffect(() => {
    const statusValues = Object.values(statuses);
    
    if (isComparing && statusValues.length >= 2) {
      const allComplete = statusValues.every(status => 
        status === 'complete' || status === 'error'
      );
      if (allComplete) {
        setIsComparing(false);
      }
    }
  }, [statuses, isComparing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isComparing) return;

    setIsComparing(true);
    reset();
    
    const payload: {
      prompt: string;
      selectionMode: SelectionMode;
      manualModels?: { openai: string; anthropic: string };
    } = { prompt: prompt.trim(), selectionMode };
    
    if (selectionMode === 'manual') {
      payload.manualModels = { openai: manualOpenAI, anthropic: manualAnthropic };
    }
    
    startComparison(payload);
  };

  const handleReset = () => {
    setPrompt('');
    setIsComparing(false);
    reset();
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, the useEffect will redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold text-gray-900">AI Model Playground</h1>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${connected ? 'text-green-700' : 'text-red-700'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Link
                href="/history"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
              >
                <span>📚</span>
                <span>History</span>
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
        {/* Model Selection */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Selection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selection Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selection Mode
              </label>
              <select
                value={selectionMode}
                onChange={(e) => setSelectionMode(e.target.value as SelectionMode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isComparing}
              >
                <option value="cheapest">Auto: Cheapest (GPT-4o Mini + Claude Sonnet 4)</option>
                <option value="fastest-cheapest">Auto: Fastest & Cheapest (GPT-4o Mini + Claude Sonnet 4)</option>
                <option value="premium">Auto: Premium (GPT-4o + Claude Opus 4)</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>

            {/* Manual Selection Dropdowns */}
            {selectionMode === 'manual' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI Model
                  </label>
                  <select
                    value={manualOpenAI}
                    onChange={(e) => setManualOpenAI(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isComparing}
                  >
                    <option value="gpt-4o">GPT-4o (Premium)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Budget)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anthropic Model
                  </label>
                  <select
                    value={manualAnthropic}
                    onChange={(e) => setManualAnthropic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isComparing}
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Standard)</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4 (Premium)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Selected Models Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm font-medium text-blue-600">
              ✓ Selected: <span className="font-semibold">{selectedModels.openai}</span> vs <span className="font-semibold">{selectedModels.anthropic}</span>
            </p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your prompt
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none shadow-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ask both AI models a question..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isComparing}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={!prompt.trim() || isComparing}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium"
              >
                {isComparing ? 'Comparing...' : 'Start Comparison'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* AI Responses - Always show 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* OpenAI Model Column */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedModels.openai}</h3>
              <div className="mt-2 flex items-center space-x-2">
                {statuses[selectedModels.openai] === 'typing' && (
                  <span className="text-sm text-blue-600">🤔 Thinking…</span>
                )}
                {statuses[selectedModels.openai] === 'streaming' && (
                  <span className="text-sm text-indigo-600">💬 Streaming response…</span>
                )}
                {statuses[selectedModels.openai] === 'complete' && (
                  <span className="text-sm text-green-600">✅ Complete</span>
                )}
                {statuses[selectedModels.openai] === 'error' && (
                  <span className="text-sm text-red-600">❌ Error</span>
                )}
                {!statuses[selectedModels.openai] && (
                  <span className="text-sm text-gray-400">⏸️ Waiting for response…</span>
                )}
              </div>
              {responses[selectedModels.openai] && (
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <div>
                    <span>📝 Tokens: {responses[selectedModels.openai].tokens?.toLocaleString()}</span>
                    <span className="ml-4">💲 Cost: ${responses[selectedModels.openai].cost?.toFixed(6)}</span>
                  </div>
                  {responses[selectedModels.openai]?.duration && (
                    <div>
                      <span>⏱️ Response Time: {((responses[selectedModels.openai]?.duration || 0) / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {statuses[selectedModels.openai] === 'error' ? (
                <div className="text-red-600 font-medium">
                  ❌ Failed to get response from {selectedModels.openai}. Please try again.
                </div>
              ) : responses[selectedModels.openai] ? (
                <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                  <ReactMarkdown>{responses[selectedModels.openai].content}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  {statuses[selectedModels.openai] === 'typing' ? '🤔 Thinking…' : 'Waiting for response…'}
                </div>
              )}
            </div>
          </div>

          {/* Anthropic Model Column */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedModels.anthropic}</h3>
              <div className="mt-2 flex items-center space-x-2">
                {statuses[selectedModels.anthropic] === 'typing' && (
                  <span className="text-sm text-blue-600">🤔 Thinking…</span>
                )}
                {statuses[selectedModels.anthropic] === 'streaming' && (
                  <span className="text-sm text-indigo-600">💬 Streaming response…</span>
                )}
                {statuses[selectedModels.anthropic] === 'complete' && (
                  <span className="text-sm text-green-600">✅ Complete</span>
                )}
                {statuses[selectedModels.anthropic] === 'error' && (
                  <span className="text-sm text-red-600">❌ Error</span>
                )}
                {!statuses[selectedModels.anthropic] && (
                  <span className="text-sm text-gray-400">⏸️ Waiting for response…</span>
                )}
              </div>
              {responses[selectedModels.anthropic] && (
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <div>
                    <span>📝 Tokens: {responses[selectedModels.anthropic].tokens?.toLocaleString()}</span>
                    <span className="ml-4">💲 Cost: ${responses[selectedModels.anthropic].cost?.toFixed(6)}</span>
                  </div>
                  {responses[selectedModels.anthropic]?.duration && (
                    <div>
                      <span>⏱️ Response Time: {((responses[selectedModels.anthropic]?.duration || 0) / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {statuses[selectedModels.anthropic] === 'error' ? (
                <div className="text-red-600 font-medium">
                  ❌ Failed to get response from {selectedModels.anthropic}. Please try again.
                </div>
              ) : responses[selectedModels.anthropic] ? (
                <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                  <ReactMarkdown>{responses[selectedModels.anthropic].content}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  {statuses[selectedModels.anthropic] === 'typing' ? '🤔 Thinking…' : 'Waiting for response…'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final Metrics */}
        {Object.keys(responses).length >= 2 && finalMetrics && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Comparison Complete</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {finalMetrics.totals.tokens.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">📝 Total Tokens</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${finalMetrics.totals.cost.toFixed(6)}
                </div>
                <div className="text-sm text-gray-600 mt-1">💲 Total Cost</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {finalMetrics.totals.fastestModel}
                </div>
                <div className="text-sm text-gray-600 mt-1">⚡ Fastest Model</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(finalMetrics.totals.fastestDuration / 1000).toFixed(2)}s
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {Object.entries(responses).reduce((max, [name, r]) => 
                    (r.tokens || 0) > (responses[max]?.tokens || 0) ? name : max, Object.keys(responses)[0]
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">📈 Most Tokens</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
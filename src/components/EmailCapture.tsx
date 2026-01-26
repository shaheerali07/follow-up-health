'use client';

import { useState } from 'react';
import { CalculatorInputs, CalculationResults, DriverCode } from '@/types';

interface EmailCaptureProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  drivers: DriverCode[];
}

export default function EmailCapture({ inputs, results, drivers }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          results,
          drivers,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Failed to send. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-emerald rounded-full text-white text-xl">
            ✓
          </div>
          <div>
            <p className="font-semibold text-navy">Snapshot Sent!</p>
            <p className="text-sm text-slate">Check your inbox for your personalized report.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-navy mb-2">
        Get Your Full Snapshot
      </h3>
      <p className="text-sm text-slate mb-4">
        Receive a personalized report with actionable recommendations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
            disabled={status === 'loading'}
          />
          {status === 'error' && errorMessage && (
            <p className="text-sm text-rose mt-1">{errorMessage}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-3 px-4 bg-teal text-white font-medium rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Sending...' : 'Send My Snapshot'}
        </button>
      </form>

      <p className="text-xs text-slate mt-3 text-center">
        We&apos;ll never share your email with third parties.
      </p>
    </div>
  );
}

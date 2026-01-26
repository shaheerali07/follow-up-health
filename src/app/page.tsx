'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import InputsPanel from '@/components/InputsPanel';
import ResultsDashboard from '@/components/ResultsDashboard';
import { CalculatorInputs } from '@/types';
import { calculateResults } from '@/lib/scoring';

const DEFAULT_INPUTS: CalculatorInputs = {
  monthlyInquiries: 100,
  responseTime: '5-30',
  followUpDepth: '2-3',
  patientValue: '250-500',
  afterHours: 'sometimes',
};

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => calculateResults(inputs), [inputs]);

  const handleInputChange = (newInputs: CalculatorInputs) => {
    setInputs(newInputs);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Auto-scroll to results on first interaction (mobile only)
  useEffect(() => {
    if (hasInteracted && resultsRef.current && window.innerWidth < 768) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasInteracted]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-navy">
                Follow-Up Health Dashboard
              </h1>
              <p className="text-sm text-slate hidden sm:block">
                Assess your clinic&apos;s follow-up operations
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full">
              <span className="w-2 h-2 bg-teal rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-teal">Live Results</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <InputsPanel inputs={inputs} onChange={handleInputChange} />
          </div>

          {/* Right Column - Results */}
          <div ref={resultsRef}>
            <ResultsDashboard inputs={inputs} results={results} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate text-center">
            © {new Date().getFullYear()} Follow-Up Health Dashboard. All calculations are estimates based on industry benchmarks.
          </p>
        </div>
      </footer>
    </div>
  );
}

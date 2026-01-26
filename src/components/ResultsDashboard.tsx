'use client';

import { useMemo } from 'react';
import KPICard from './KPICard';
import LeakageDrivers from './LeakageDrivers';
import ScoreChart from './ScoreChart';
import EmailCapture from './EmailCapture';
import { CalculatorInputs, CalculationResults, SeverityLevel } from '@/types';
import { getTopDrivers, getTopDriverCodes } from '@/lib/drivers';

interface ResultsDashboardProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
}

function getSeverityVariant(severity: SeverityLevel): 'success' | 'warning' | 'danger' {
  switch (severity) {
    case 'Low':
      return 'success';
    case 'Moderate':
      return 'warning';
    case 'High':
    case 'Severe':
      return 'danger';
  }
}

function getGradeVariant(grade: string): 'success' | 'warning' | 'danger' {
  if (grade.startsWith('A') || grade.startsWith('B')) return 'success';
  if (grade.startsWith('C')) return 'warning';
  return 'danger';
}

export default function ResultsDashboard({ inputs, results }: ResultsDashboardProps) {
  const drivers = useMemo(() => getTopDrivers(inputs), [inputs]);
  const driverCodes = useMemo(() => getTopDriverCodes(inputs), [inputs]);

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Your Grade"
          value={results.grade}
          subtitle={`Score: ${results.gradeScore}/100`}
          variant={getGradeVariant(results.grade)}
        />
        <KPICard
          title="Revenue at Risk"
          value={
            <span className="text-xl sm:text-2xl">
              {formatCurrency(results.revenueAtRisk.low)} - {formatCurrency(results.revenueAtRisk.high)}
            </span>
          }
          subtitle="Monthly estimate"
          variant="danger"
        />
        <KPICard
          title="Severity"
          value={results.severity}
          subtitle={`${results.dropoffPercent}% drop-off rate`}
          variant={getSeverityVariant(results.severity)}
        />
      </div>

      {/* Leakage Drivers */}
      <LeakageDrivers drivers={drivers} />

      {/* Score Chart */}
      <ScoreChart scores={results.scores} />

      {/* Recommendations */}
      <div className="p-5 bg-teal-50 rounded-xl border border-teal-100">
        <h3 className="text-lg font-semibold text-navy mb-3">
          💡 Quick Wins
        </h3>
        <ul className="space-y-2 text-sm text-slate">
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Aim to respond within 5 minutes during business hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Set up automated follow-up sequences (4-6 touches recommended)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Consider after-hours answering service for evenings/weekends</span>
          </li>
        </ul>
      </div>

      {/* Email Capture */}
      <EmailCapture inputs={inputs} results={results} drivers={driverCodes} />
    </div>
  );
}

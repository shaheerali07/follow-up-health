'use client';

import { Driver } from '@/types';

interface LeakageDriversProps {
  drivers: Driver[];
}

const driverIcons: Record<string, string> = {
  slowResponse: '⏱️',
  followUpEarly: '📉',
  afterHoursGaps: '🌙',
  limitedVisibility: '👁️',
};

export default function LeakageDrivers({ drivers }: LeakageDriversProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy">Top Leakage Drivers</h3>
      <div className="grid gap-3">
        {drivers.map((driver, index) => (
          <div
            key={driver.code}
            className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-rose-50 rounded-lg text-lg">
              {driverIcons[driver.code] || '⚠️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-rose bg-rose-100 px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                <h4 className="font-medium text-navy truncate">{driver.title}</h4>
              </div>
              <p className="text-sm text-slate mt-1">{driver.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

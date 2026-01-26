import {
  ResponseTime,
  FollowUpDepth,
  AfterHoursCoverage,
  Driver,
  DriverCode,
  CalculatorInputs,
} from '@/types';

// Driver Definitions
export const DRIVERS: Record<DriverCode, Driver> = {
  slowResponse: {
    code: 'slowResponse',
    title: 'Slow Response Window',
    description: 'Responses after 30 minutes lose attention fast.',
  },
  followUpEarly: {
    code: 'followUpEarly',
    title: 'Follow-Up Ends Too Early',
    description: 'Most inquiries need 2-6 touches to convert.',
  },
  afterHoursGaps: {
    code: 'afterHoursGaps',
    title: 'After-Hours Coverage Gaps',
    description: "Missed evenings/weekends create silent drop-off.",
  },
  limitedVisibility: {
    code: 'limitedVisibility',
    title: 'Limited Visibility',
    description: "When follow-up isn't tracked, leakage becomes invisible.",
  },
};

// Weight calculation for each driver
const SPEED_WEIGHTS: Record<ResponseTime, number> = {
  under5: 0,
  '5-30': 0,
  '30-2h': 1,
  sameday: 2,
  nextday: 3,
};

const PERSISTENCE_WEIGHTS: Record<FollowUpDepth, number> = {
  '4-6': 0,
  '2-3': 0,
  '1': 2,
  notsure: 3,
};

const COVERAGE_WEIGHTS: Record<AfterHoursCoverage, number> = {
  yes: 0,
  sometimes: 1,
  no: 2,
};

// Visibility driver appears when "Not sure" is selected
const VISIBILITY_WEIGHTS: Record<FollowUpDepth, number> = {
  '4-6': 0,
  '2-3': 0,
  '1': 0,
  notsure: 2,
};

interface WeightedDriver {
  code: DriverCode;
  weight: number;
}

/**
 * Calculate weights for all drivers based on inputs
 */
function calculateDriverWeights(inputs: CalculatorInputs): WeightedDriver[] {
  const weights: WeightedDriver[] = [];

  // Speed driver (Slow Response)
  const speedWeight = SPEED_WEIGHTS[inputs.responseTime];
  if (speedWeight > 0) {
    weights.push({ code: 'slowResponse', weight: speedWeight });
  }

  // Persistence driver (Follow-Up Ends Too Early)
  const persistenceWeight = PERSISTENCE_WEIGHTS[inputs.followUpDepth];
  if (persistenceWeight > 0) {
    weights.push({ code: 'followUpEarly', weight: persistenceWeight });
  }

  // Coverage driver (After-Hours Gaps)
  const coverageWeight = COVERAGE_WEIGHTS[inputs.afterHours];
  if (coverageWeight > 0) {
    weights.push({ code: 'afterHoursGaps', weight: coverageWeight });
  }

  // Visibility driver (Limited Visibility)
  const visibilityWeight = VISIBILITY_WEIGHTS[inputs.followUpDepth];
  if (visibilityWeight > 0) {
    weights.push({ code: 'limitedVisibility', weight: visibilityWeight });
  }

  return weights;
}

/**
 * Get top 3 drivers based on inputs
 * If fewer than 3 drivers have non-zero weights, fill with default drivers
 */
export function getTopDrivers(inputs: CalculatorInputs): Driver[] {
  const weights = calculateDriverWeights(inputs);

  // Sort by weight descending
  weights.sort((a, b) => b.weight - a.weight);

  // Take top 3 unique drivers
  const selectedCodes = weights.slice(0, 3).map((w) => w.code);

  // If fewer than 3, add fallback drivers
  const fallbackOrder: DriverCode[] = [
    'slowResponse',
    'followUpEarly',
    'afterHoursGaps',
    'limitedVisibility',
  ];

  for (const fallback of fallbackOrder) {
    if (selectedCodes.length >= 3) break;
    if (!selectedCodes.includes(fallback)) {
      selectedCodes.push(fallback);
    }
  }

  // Convert codes to full driver objects
  return selectedCodes.slice(0, 3).map((code) => DRIVERS[code]);
}

/**
 * Get driver codes only (for storage)
 */
export function getTopDriverCodes(inputs: CalculatorInputs): DriverCode[] {
  return getTopDrivers(inputs).map((d) => d.code);
}

'use client';

import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: {
    value: 'text-navy',
    bg: 'bg-white',
  },
  success: {
    value: 'text-emerald',
    bg: 'bg-emerald-50',
  },
  warning: {
    value: 'text-amber',
    bg: 'bg-amber-50',
  },
  danger: {
    value: 'text-rose',
    bg: 'bg-rose-50',
  },
};

export default function KPICard({
  title,
  value,
  subtitle,
  variant = 'default',
}: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} rounded-xl p-5 shadow-sm border border-gray-100`}>
      <p className="text-sm font-medium text-slate mb-1">{title}</p>
      <p className={`text-3xl font-bold ${styles.value}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-slate mt-1">{subtitle}</p>
      )}
    </div>
  );
}

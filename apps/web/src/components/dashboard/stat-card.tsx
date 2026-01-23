'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TrendUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export type StatCardVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: StatCardVariant;
  className?: string;
}

const variantStyles: Record<StatCardVariant, { bg: string; text: string; icon: string }> = {
  default: {
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    icon: 'text-gray-500',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-900',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    icon: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    icon: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    icon: 'text-blue-500',
  },
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendValue,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={cn('mt-1 text-2xl font-semibold', styles.text)}>{value}</p>
            {trend && trendValue && (
              <div
                className={cn(
                  'mt-2 flex items-center gap-1 text-sm',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn('rounded-lg p-2', styles.bg)}>
              <div className={styles.icon}>{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

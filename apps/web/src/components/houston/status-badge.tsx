'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal',
  {
    variants: {
      variant: {
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        pending: 'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'pending',
    },
  }
)

export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'pending'

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: string
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, status, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant }), className)}
        {...props}
      >
        {status}
      </span>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

export { StatusBadge, statusBadgeVariants }

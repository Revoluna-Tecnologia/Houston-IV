'use client'

import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from './date-picker'
import { DateRangePicker } from './date-range-picker'

export type FilterType = 'text' | 'select' | 'date' | 'dateRange'

export interface SelectOption {
  label: string
  value: string
}

export interface FilterConfig {
  id: string
  label: string
  type: FilterType
  placeholder?: string
  options?: SelectOption[]
  className?: string
}

export interface FilterValues {
  [key: string]: string | Date | DateRange | undefined
}

export interface FiltersProps {
  filters: FilterConfig[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  className?: string
}

function Filters({ filters, values, onChange, className }: FiltersProps) {
  const handleChange = (id: string, value: FilterValues[string]) => {
    onChange({ ...values, [id]: value })
  }

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder}
            value={(values[filter.id] as string) || ''}
            onChange={(e) => handleChange(filter.id, e.target.value)}
            className={cn('w-full', filter.className)}
          />
        )

      case 'select':
        return (
          <Select
            value={(values[filter.id] as string) || ''}
            onValueChange={(value) => handleChange(filter.id, value)}
          >
            <SelectTrigger className={cn('w-full', filter.className)}>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'date':
        return (
          <DatePicker
            value={values[filter.id] as Date | undefined}
            onChange={(date) => handleChange(filter.id, date)}
            placeholder={filter.placeholder}
          />
        )

      case 'dateRange':
        return (
          <DateRangePicker
            value={values[filter.id] as DateRange | undefined}
            onChange={(range) => handleChange(filter.id, range)}
            placeholder={filter.placeholder}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {filters.map((filter) => (
        <div key={filter.id} className="flex flex-col gap-1.5">
          <label className="text-sm font-normal text-gray-700">
            {filter.label}
          </label>
          {renderFilter(filter)}
        </div>
      ))}
    </div>
  )
}

export { Filters }

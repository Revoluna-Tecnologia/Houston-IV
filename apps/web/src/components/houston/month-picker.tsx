'use client'

import * as React from 'react'
import { format, setMonth, setYear } from 'date-fns'
import { useTranslations } from 'next-intl'
import { useDateLocale } from '@/lib/date-locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const CalendarIcon = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ChevronLeftIcon = () => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export interface MonthPickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
}

function MonthPicker({
  value,
  onChange,
  placeholder,
  className,
}: MonthPickerProps) {
  const t = useTranslations('Common')
  const tg = useTranslations('Grades')
  const dateLocale = useDateLocale()

  const MONTHS = [
    t('months.january'), t('months.february'), t('months.march'),
    t('months.april'), t('months.may'), t('months.june'),
    t('months.july'), t('months.august'), t('months.september'),
    t('months.october'), t('months.november'), t('months.december'),
  ]

  const defaultPlaceholder = tg('form.selectMonth')

  const [open, setOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(() =>
    value ? value.getFullYear() : new Date().getFullYear()
  )

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(new Date(), viewYear), monthIndex)
    onChange?.(newDate)
    setOpen(false)
  }

  const handlePreviousYear = () => {
    setViewYear((prev) => prev - 1)
  }

  const handleNextYear = () => {
    setViewYear((prev) => prev + 1)
  }

  const selectedMonth = value?.getMonth()
  const selectedYear = value?.getFullYear()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[200px] justify-start text-left font-normal',
            !value && 'text-gray-500',
            className
          )}
        >
          <CalendarIcon />
          {value
            ? format(value, 'MMMM yyyy', { locale: dateLocale })
            : placeholder || defaultPlaceholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousYear}
            className="h-7 w-7"
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm font-normal">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextYear}
            className="h-7 w-7"
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected =
              selectedMonth === index && selectedYear === viewYear
            return (
              <Button
                key={month}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  'h-9 text-sm',
                  isSelected && 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {month.substring(0, 3)}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MonthPicker }

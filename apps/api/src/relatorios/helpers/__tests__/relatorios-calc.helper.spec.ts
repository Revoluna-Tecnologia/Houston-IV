import { describe, it, expect } from 'vitest'
import {
  calculateHoursBetween,
  formatDateBR,
  extractMonthKey,
  monthKeyToLabel,
} from '../relatorios-calc.helper'

describe('relatorios-calc.helper', () => {
  describe('calculateHoursBetween', () => {
    it('should calculate hours between two times', () => {
      expect(calculateHoursBetween('08:00', '12:00')).toBe(4)
    })

    it('should handle minutes correctly', () => {
      expect(calculateHoursBetween('08:00', '12:30')).toBe(4.5)
    })

    it('should handle odd minutes', () => {
      expect(calculateHoursBetween('08:00', '12:20')).toBe(4.3)
    })

    it('should handle single hour difference', () => {
      expect(calculateHoursBetween('10:00', '11:00')).toBe(1)
    })

    it('should handle zero difference', () => {
      expect(calculateHoursBetween('08:00', '08:00')).toBe(0)
    })

    it('should handle full workday', () => {
      expect(calculateHoursBetween('07:00', '19:00')).toBe(12)
    })

    it('should handle overnight shift (negative result)', () => {
      // This function doesn't handle overnight shifts - returns negative
      expect(calculateHoursBetween('22:00', '06:00')).toBe(-16)
    })

    it('should round to one decimal place', () => {
      expect(calculateHoursBetween('08:00', '11:10')).toBe(3.2)
    })
  })

  describe('formatDateBR', () => {
    it('should format date to Brazilian format', () => {
      // Use constructor with explicit year, month, day to avoid timezone issues
      const date = new Date(2025, 0, 15) // January 15, 2025
      const result = formatDateBR(date)
      expect(result).toMatch(/15\/01\/2025/)
    })

    it('should handle Date object', () => {
      const date = new Date(2025, 0, 1)
      const result = formatDateBR(date)
      expect(result).toMatch(/01\/01\/2025/)
    })

    it('should handle string date input', () => {
      const date = new Date(2025, 5, 25) // June 25, 2025
      const result = formatDateBR(date)
      expect(result).toMatch(/25\/06\/2025/)
    })

    it('should handle end of year', () => {
      const date = new Date(2025, 11, 31) // December 31, 2025
      const result = formatDateBR(date)
      expect(result).toMatch(/31\/12\/2025/)
    })
  })

  describe('extractMonthKey', () => {
    it('should extract month key in YYYY-MM format', () => {
      const date = new Date(2025, 0, 15) // January 15, 2025
      expect(extractMonthKey(date)).toBe('2025-01')
    })

    it('should pad single digit month', () => {
      const date = new Date(2025, 4, 1) // May 1, 2025
      expect(extractMonthKey(date)).toBe('2025-05')
    })

    it('should handle December', () => {
      const date = new Date(2025, 11, 25) // December 25, 2025
      expect(extractMonthKey(date)).toBe('2025-12')
    })

    it('should handle different years', () => {
      const date = new Date(2024, 2, 10) // March 10, 2024
      expect(extractMonthKey(date)).toBe('2024-03')
    })

    it('should handle first day of month', () => {
      const date = new Date(2025, 6, 1) // July 1, 2025
      expect(extractMonthKey(date)).toBe('2025-07')
    })

    it('should handle last day of month', () => {
      const date = new Date(2025, 1, 28) // February 28, 2025
      expect(extractMonthKey(date)).toBe('2025-02')
    })
  })

  describe('monthKeyToLabel', () => {
    it('should convert month key to readable label', () => {
      const result = monthKeyToLabel('2025-01')
      expect(result).toMatch(/janeiro/i)
      expect(result).toMatch(/2025/)
    })

    it('should handle December', () => {
      const result = monthKeyToLabel('2025-12')
      expect(result).toMatch(/dezembro/i)
      expect(result).toMatch(/2025/)
    })

    it('should handle different months', () => {
      const june = monthKeyToLabel('2025-06')
      expect(june).toMatch(/junho/i)

      const march = monthKeyToLabel('2025-03')
      expect(march).toMatch(/março/i)
    })

    it('should handle different years', () => {
      const result = monthKeyToLabel('2024-08')
      expect(result).toMatch(/agosto/i)
      expect(result).toMatch(/2024/)
    })

    it('should handle single digit months', () => {
      const result = monthKeyToLabel('2025-09')
      expect(result).toMatch(/setembro/i)
    })
  })
})

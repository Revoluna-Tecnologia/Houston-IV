import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the real cn function by unmocking and importing directly
vi.unmock('../utils')

describe('cn utility function', () => {
  // Import fresh after unmocking
  let cn: (...inputs: unknown[]) => string

  beforeEach(async () => {
    vi.resetModules()
    const utils = await import('../utils')
    cn = utils.cn
  })

  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active')
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('should merge tailwind classes correctly', () => {
    // twMerge should keep the last conflicting class
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle objects with truthy/falsy values', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle mixed inputs', () => {
    expect(cn('base', ['array-class'], { conditional: true })).toBe('base array-class conditional')
  })

  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-lg', 'lg:text-xl')).toBe('text-sm md:text-lg lg:text-xl')
  })

  it('should handle hover and focus states', () => {
    expect(cn('hover:bg-blue-500', 'focus:ring-2')).toBe('hover:bg-blue-500 focus:ring-2')
  })
})

import { describe, it, expect } from 'vitest'
import { IsCPFConstraint } from '../cpf.validator'

describe('IsCPFConstraint', () => {
  const validator = new IsCPFConstraint()

  describe('validate', () => {
    describe('valid CPFs', () => {
      it('should validate a valid CPF', () => {
        // Known valid CPF: 529.982.247-25
        expect(validator.validate('52998224725')).toBe(true)
      })

      it('should validate another valid CPF', () => {
        // Known valid CPF: 123.456.789-09
        expect(validator.validate('12345678909')).toBe(true)
      })

      it('should accept CPF with formatting', () => {
        expect(validator.validate('529.982.247-25')).toBe(true)
      })

      it('should accept CPF with different formatting', () => {
        expect(validator.validate('123 456 789 09')).toBe(true)
      })

      it('should return true for empty string (optional field)', () => {
        expect(validator.validate('')).toBe(true)
      })

      it('should return true for null/undefined (optional field)', () => {
        expect(validator.validate(null as unknown as string)).toBe(true)
        expect(validator.validate(undefined as unknown as string)).toBe(true)
      })
    })

    describe('invalid CPFs', () => {
      it('should reject CPF with wrong length', () => {
        expect(validator.validate('1234567890')).toBe(false) // 10 digits
        expect(validator.validate('123456789012')).toBe(false) // 12 digits
      })

      it('should reject CPF with all same digits', () => {
        expect(validator.validate('00000000000')).toBe(false)
        expect(validator.validate('11111111111')).toBe(false)
        expect(validator.validate('22222222222')).toBe(false)
        expect(validator.validate('33333333333')).toBe(false)
        expect(validator.validate('44444444444')).toBe(false)
        expect(validator.validate('55555555555')).toBe(false)
        expect(validator.validate('66666666666')).toBe(false)
        expect(validator.validate('77777777777')).toBe(false)
        expect(validator.validate('88888888888')).toBe(false)
        expect(validator.validate('99999999999')).toBe(false)
      })

      it('should reject CPF with invalid first check digit', () => {
        // 529.982.247-25 is valid, changing first check digit
        expect(validator.validate('52998224715')).toBe(false)
      })

      it('should reject CPF with invalid second check digit', () => {
        // 529.982.247-25 is valid, changing second check digit
        expect(validator.validate('52998224726')).toBe(false)
      })

      it('should reject random invalid CPF', () => {
        expect(validator.validate('12345678901')).toBe(false)
        expect(validator.validate('12345678900')).toBe(false)
      })

      it('should reject CPF with letters', () => {
        expect(validator.validate('529982247AB')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle CPF starting with zeros', () => {
        // Valid CPF: 000.000.001-91
        expect(validator.validate('00000000191')).toBe(true)
      })

      it('should handle CPF with special characters', () => {
        expect(validator.validate('529/982/247/25')).toBe(true)
      })
    })
  })

  describe('defaultMessage', () => {
    it('should return Portuguese error message', () => {
      expect(validator.defaultMessage()).toBe('CPF inválido')
    })
  })
})

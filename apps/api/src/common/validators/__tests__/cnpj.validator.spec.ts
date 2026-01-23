import { describe, it, expect } from 'vitest'
import { IsCNPJConstraint } from '../cnpj.validator'

describe('IsCNPJConstraint', () => {
  const validator = new IsCNPJConstraint()

  describe('validate', () => {
    describe('valid CNPJs', () => {
      it('should validate a valid CNPJ', () => {
        // Known valid CNPJ: 11.222.333/0001-81
        expect(validator.validate('11222333000181')).toBe(true)
      })

      it('should validate another valid CNPJ', () => {
        // Known valid CNPJ: 11.444.777/0001-61
        expect(validator.validate('11444777000161')).toBe(true)
      })

      it('should accept CNPJ with formatting', () => {
        expect(validator.validate('11.222.333/0001-81')).toBe(true)
      })

      it('should accept CNPJ with different formatting', () => {
        expect(validator.validate('11 222 333 0001 81')).toBe(true)
      })

      it('should return true for empty string (optional field)', () => {
        expect(validator.validate('')).toBe(true)
      })

      it('should return true for null/undefined (optional field)', () => {
        expect(validator.validate(null as unknown as string)).toBe(true)
        expect(validator.validate(undefined as unknown as string)).toBe(true)
      })
    })

    describe('invalid CNPJs', () => {
      it('should reject CNPJ with wrong length', () => {
        expect(validator.validate('1122233300018')).toBe(false) // 13 digits
        expect(validator.validate('112223330001811')).toBe(false) // 15 digits
      })

      it('should reject CNPJ with all same digits', () => {
        expect(validator.validate('00000000000000')).toBe(false)
        expect(validator.validate('11111111111111')).toBe(false)
        expect(validator.validate('22222222222222')).toBe(false)
        expect(validator.validate('33333333333333')).toBe(false)
        expect(validator.validate('44444444444444')).toBe(false)
        expect(validator.validate('55555555555555')).toBe(false)
        expect(validator.validate('66666666666666')).toBe(false)
        expect(validator.validate('77777777777777')).toBe(false)
        expect(validator.validate('88888888888888')).toBe(false)
        expect(validator.validate('99999999999999')).toBe(false)
      })

      it('should reject CNPJ with invalid first check digit', () => {
        // 11.222.333/0001-81 is valid, changing first check digit
        expect(validator.validate('11222333000191')).toBe(false)
      })

      it('should reject CNPJ with invalid second check digit', () => {
        // 11.222.333/0001-81 is valid, changing second check digit
        expect(validator.validate('11222333000182')).toBe(false)
      })

      it('should reject random invalid CNPJ', () => {
        expect(validator.validate('12345678901234')).toBe(false)
        expect(validator.validate('98765432109876')).toBe(false)
      })

      it('should reject CNPJ with letters', () => {
        expect(validator.validate('112223330001AB')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle CNPJ starting with zeros', () => {
        // Valid CNPJ: 00.360.305/0001-04
        expect(validator.validate('00360305000104')).toBe(true)
      })

      it('should handle CNPJ with special characters', () => {
        expect(validator.validate('11/222/333/0001/81')).toBe(true)
      })

      it('should handle branch CNPJ', () => {
        // CNPJ with branch number: 11.222.333/0002-62
        expect(validator.validate('11222333000262')).toBe(true)
      })
    })
  })

  describe('defaultMessage', () => {
    it('should return Portuguese error message', () => {
      expect(validator.defaultMessage()).toBe('CNPJ inválido')
    })
  })
})

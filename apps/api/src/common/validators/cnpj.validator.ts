import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsCNPJConstraint implements ValidatorConstraintInterface {
  validate(cnpj: string): boolean {
    if (!cnpj) return true // Optional field, let @IsOptional handle it

    // Remove non-numeric characters
    const cleanCnpj = cnpj.replace(/\D/g, '')

    // Must have 14 digits
    if (cleanCnpj.length !== 14) return false

    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1+$/.test(cleanCnpj)) return false

    // Validate first check digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights1[i]
    }
    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder
    if (digit1 !== parseInt(cleanCnpj.charAt(12))) return false

    // Validate second check digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights2[i]
    }
    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder
    if (digit2 !== parseInt(cleanCnpj.charAt(13))) return false

    return true
  }

  defaultMessage(): string {
    return 'CNPJ inválido'
  }
}

export function IsCNPJ(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCNPJConstraint,
    })
  }
}

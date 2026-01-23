import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsCPFConstraint implements ValidatorConstraintInterface {
  validate(cpf: string): boolean {
    if (!cpf) return true // Optional field, let @IsOptional handle it

    // Remove non-numeric characters
    const cleanCpf = cpf.replace(/\D/g, '')

    // Must have 11 digits
    if (cleanCpf.length !== 11) return false

    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1+$/.test(cleanCpf)) return false

    // Validate check digits
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false

    return true
  }

  defaultMessage(): string {
    return 'CPF inválido'
  }
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCPFConstraint,
    })
  }
}

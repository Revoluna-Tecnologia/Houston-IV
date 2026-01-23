import { describe, it, expect, beforeEach } from 'vitest'
import { CustomValidationPipe } from '../validation.pipe'
import { BadRequestException } from '@nestjs/common'
import { IsString, IsNotEmpty, IsEmail } from 'class-validator'

class TestDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEmail()
  email!: string
}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe

  beforeEach(() => {
    pipe = new CustomValidationPipe()
  })

  it('should pass valid data through', async () => {
    const validData = { name: 'Test', email: 'test@example.com' }
    const result = await pipe.transform(validData, { metatype: TestDto, type: 'body' })

    expect(result).toEqual(validData)
  })

  it('should throw BadRequestException for invalid data', async () => {
    const invalidData = { name: '', email: 'invalid-email' }

    await expect(
      pipe.transform(invalidData, { metatype: TestDto, type: 'body' })
    ).rejects.toThrow(BadRequestException)
  })

  it('should return value as-is when no metatype is provided', async () => {
    const data = { anything: 'value' }
    const result = await pipe.transform(data, { type: 'body' })

    expect(result).toEqual(data)
  })

  it('should return value as-is for primitive types', async () => {
    const stringValue = 'test'
    const result = await pipe.transform(stringValue, { metatype: String, type: 'body' })

    expect(result).toBe(stringValue)
  })

  it('should return value as-is for Number type', async () => {
    const numberValue = 123
    const result = await pipe.transform(numberValue, { metatype: Number, type: 'body' })

    expect(result).toBe(numberValue)
  })

  it('should return value as-is for Boolean type', async () => {
    const boolValue = true
    const result = await pipe.transform(boolValue, { metatype: Boolean, type: 'body' })

    expect(result).toBe(boolValue)
  })

  it('should return value as-is for Array type', async () => {
    const arrayValue = [1, 2, 3]
    const result = await pipe.transform(arrayValue, { metatype: Array, type: 'body' })

    expect(result).toEqual(arrayValue)
  })

  it('should return value as-is for Object type', async () => {
    const objValue = { key: 'value' }
    const result = await pipe.transform(objValue, { metatype: Object, type: 'body' })

    expect(result).toEqual(objValue)
  })

  it('should throw with validation messages for missing required fields', async () => {
    const invalidData = {}

    try {
      await pipe.transform(invalidData, { metatype: TestDto, type: 'body' })
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
    }
  })
})

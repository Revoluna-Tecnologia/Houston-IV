import { describe, it, expect } from 'vitest'
import { IS_PUBLIC_KEY, Public } from '../public.decorator'

describe('Public Decorator', () => {
  it('should export IS_PUBLIC_KEY constant', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic')
  })

  it('should return a decorator function', () => {
    const decorator = Public()
    expect(typeof decorator).toBe('function')
  })

  it('should set metadata on target', () => {
    class TestController {
      @Public()
      testMethod() {
        return 'test'
      }
    }

    const metadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.testMethod
    )
    expect(metadata).toBe(true)
  })

  it('should work on class methods', () => {
    class AnotherController {
      @Public()
      publicRoute() {
        return 'public'
      }

      privateRoute() {
        return 'private'
      }
    }

    const publicMetadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      AnotherController.prototype.publicRoute
    )
    const privateMetadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      AnotherController.prototype.privateRoute
    )

    expect(publicMetadata).toBe(true)
    expect(privateMetadata).toBeUndefined()
  })
})

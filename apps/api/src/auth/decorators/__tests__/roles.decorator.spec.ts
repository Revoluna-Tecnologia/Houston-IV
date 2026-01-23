import { describe, it, expect } from 'vitest'
import { RequireRoles, RequireMinRole, ROLES_KEY, MIN_ROLE_KEY } from '../roles.decorator'
import { AppRole } from '../../types/auth.types'
import { Reflector } from '@nestjs/core'

describe('Roles decorators', () => {
  describe('RequireRoles', () => {
    it('should set metadata with single role', () => {
      const decorator = RequireRoles(AppRole.ADMINISTRADOR)

      // Create test class with decorated method
      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const roles = reflector.get<AppRole[]>(ROLES_KEY, TestController.prototype.testMethod)

      expect(roles).toEqual([AppRole.ADMINISTRADOR])
    })

    it('should set metadata with multiple roles', () => {
      const decorator = RequireRoles(AppRole.GESTOR, AppRole.COORDENADOR)

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const roles = reflector.get<AppRole[]>(ROLES_KEY, TestController.prototype.testMethod)

      expect(roles).toEqual([AppRole.GESTOR, AppRole.COORDENADOR])
    })

    it('should set metadata with all roles', () => {
      const decorator = RequireRoles(
        AppRole.ADMINISTRADOR,
        AppRole.MODERADOR,
        AppRole.GESTOR,
        AppRole.COORDENADOR,
        AppRole.ESCALISTA
      )

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const roles = reflector.get<AppRole[]>(ROLES_KEY, TestController.prototype.testMethod)

      expect(roles).toHaveLength(5)
    })

    it('should set empty array when called with no roles', () => {
      const decorator = RequireRoles()

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const roles = reflector.get<AppRole[]>(ROLES_KEY, TestController.prototype.testMethod)

      expect(roles).toEqual([])
    })
  })

  describe('RequireMinRole', () => {
    it('should set min role metadata', () => {
      const decorator = RequireMinRole(AppRole.GESTOR)

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const minRole = reflector.get<AppRole>(MIN_ROLE_KEY, TestController.prototype.testMethod)

      expect(minRole).toBe(AppRole.GESTOR)
    })

    it('should set administrador as min role', () => {
      const decorator = RequireMinRole(AppRole.ADMINISTRADOR)

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const minRole = reflector.get<AppRole>(MIN_ROLE_KEY, TestController.prototype.testMethod)

      expect(minRole).toBe(AppRole.ADMINISTRADOR)
    })

    it('should set escalista as min role', () => {
      const decorator = RequireMinRole(AppRole.ESCALISTA)

      class TestController {
        testMethod() {}
      }
      decorator(TestController.prototype, 'testMethod', Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod')!)

      const reflector = new Reflector()
      const minRole = reflector.get<AppRole>(MIN_ROLE_KEY, TestController.prototype.testMethod)

      expect(minRole).toBe(AppRole.ESCALISTA)
    })
  })

  describe('ROLES_KEY constant', () => {
    it('should be "roles"', () => {
      expect(ROLES_KEY).toBe('roles')
    })
  })

  describe('MIN_ROLE_KEY constant', () => {
    it('should be "minRole"', () => {
      expect(MIN_ROLE_KEY).toBe('minRole')
    })
  })
})

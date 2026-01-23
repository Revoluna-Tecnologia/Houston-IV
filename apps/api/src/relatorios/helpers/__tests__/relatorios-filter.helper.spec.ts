import { describe, it, expect } from 'vitest'
import { buildVagaFilterWhere, buildGradeFilterWhere } from '../relatorios-filter.helper'
import type { RelatorioFiltrosDto } from '../../dto'

describe('relatorios-filter.helper', () => {
  describe('buildVagaFilterWhere', () => {
    it('should return empty object when no filters provided', () => {
      const filtros: RelatorioFiltrosDto = {}
      const result = buildVagaFilterWhere(filtros)
      expect(result).toEqual({})
    })

    it('should add medicoId to where clause', () => {
      const filtros: RelatorioFiltrosDto = {
        medicoId: 'medico-uuid-123',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.medicoId).toBe('medico-uuid-123')
    })

    it('should add hospitalId to nested vaga where', () => {
      const filtros: RelatorioFiltrosDto = {
        hospitalId: 'hospital-uuid-123',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.vaga).toBeDefined()
      expect((result.vaga as Record<string, unknown>).hospitalId).toBe('hospital-uuid-123')
    })

    it('should add setorId to nested vaga where', () => {
      const filtros: RelatorioFiltrosDto = {
        setorId: 'setor-uuid-123',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.vaga).toBeDefined()
      expect((result.vaga as Record<string, unknown>).setorId).toBe('setor-uuid-123')
    })

    it('should add dataInicio as gte date filter', () => {
      const filtros: RelatorioFiltrosDto = {
        dataInicio: '2025-01-01',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.vaga).toBeDefined()
      const vagaWhere = result.vaga as Record<string, unknown>
      const dateRange = vagaWhere.data as Record<string, unknown>
      expect(dateRange.gte).toEqual(new Date('2025-01-01'))
    })

    it('should add dataFim as lte date filter', () => {
      const filtros: RelatorioFiltrosDto = {
        dataFim: '2025-01-31',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.vaga).toBeDefined()
      const vagaWhere = result.vaga as Record<string, unknown>
      const dateRange = vagaWhere.data as Record<string, unknown>
      expect(dateRange.lte).toEqual(new Date('2025-01-31'))
    })

    it('should handle both dataInicio and dataFim together', () => {
      const filtros: RelatorioFiltrosDto = {
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      }
      const result = buildVagaFilterWhere(filtros)
      const vagaWhere = result.vaga as Record<string, unknown>
      const dateRange = vagaWhere.data as Record<string, unknown>
      expect(dateRange.gte).toEqual(new Date('2025-01-01'))
      expect(dateRange.lte).toEqual(new Date('2025-01-31'))
    })

    it('should combine all filters', () => {
      const filtros: RelatorioFiltrosDto = {
        medicoId: 'medico-uuid',
        hospitalId: 'hospital-uuid',
        setorId: 'setor-uuid',
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31',
      }
      const result = buildVagaFilterWhere(filtros)

      expect(result.medicoId).toBe('medico-uuid')
      expect(result.vaga).toBeDefined()

      const vagaWhere = result.vaga as Record<string, unknown>
      expect(vagaWhere.hospitalId).toBe('hospital-uuid')
      expect(vagaWhere.setorId).toBe('setor-uuid')

      const dateRange = vagaWhere.data as Record<string, unknown>
      expect(dateRange.gte).toEqual(new Date('2025-01-01'))
      expect(dateRange.lte).toEqual(new Date('2025-12-31'))
    })

    it('should not add vaga key when no nested filters', () => {
      const filtros: RelatorioFiltrosDto = {
        medicoId: 'medico-uuid',
      }
      const result = buildVagaFilterWhere(filtros)
      expect(result.vaga).toBeUndefined()
    })
  })

  describe('buildGradeFilterWhere', () => {
    it('should return empty object when no filters provided', () => {
      const filtros: RelatorioFiltrosDto = {}
      const result = buildGradeFilterWhere(filtros)
      expect(result).toEqual({})
    })

    it('should add hospitalId directly', () => {
      const filtros: RelatorioFiltrosDto = {
        hospitalId: 'hospital-uuid-123',
      }
      const result = buildGradeFilterWhere(filtros)
      expect(result.hospitalId).toBe('hospital-uuid-123')
    })

    it('should add setorId directly', () => {
      const filtros: RelatorioFiltrosDto = {
        setorId: 'setor-uuid-123',
      }
      const result = buildGradeFilterWhere(filtros)
      expect(result.setorId).toBe('setor-uuid-123')
    })

    it('should add dataInicio as gte filter', () => {
      const filtros: RelatorioFiltrosDto = {
        dataInicio: '2025-01-01',
      }
      const result = buildGradeFilterWhere(filtros)
      expect(result.dataInicio).toEqual({ gte: new Date('2025-01-01') })
    })

    it('should add dataFim as lte filter', () => {
      const filtros: RelatorioFiltrosDto = {
        dataFim: '2025-12-31',
      }
      const result = buildGradeFilterWhere(filtros)
      expect(result.dataFim).toEqual({ lte: new Date('2025-12-31') })
    })

    it('should combine all filters', () => {
      const filtros: RelatorioFiltrosDto = {
        hospitalId: 'hospital-uuid',
        setorId: 'setor-uuid',
        dataInicio: '2025-01-01',
        dataFim: '2025-06-30',
      }
      const result = buildGradeFilterWhere(filtros)

      expect(result.hospitalId).toBe('hospital-uuid')
      expect(result.setorId).toBe('setor-uuid')
      expect(result.dataInicio).toEqual({ gte: new Date('2025-01-01') })
      expect(result.dataFim).toEqual({ lte: new Date('2025-06-30') })
    })

    it('should not add medicoId (grade filter does not use it)', () => {
      const filtros: RelatorioFiltrosDto = {
        medicoId: 'medico-uuid',
        hospitalId: 'hospital-uuid',
      }
      const result = buildGradeFilterWhere(filtros)
      expect(result.medicoId).toBeUndefined()
      expect(result.hospitalId).toBe('hospital-uuid')
    })

    it('should handle partial date filters', () => {
      const filtrosOnlyStart: RelatorioFiltrosDto = {
        dataInicio: '2025-03-01',
      }
      const resultStart = buildGradeFilterWhere(filtrosOnlyStart)
      expect(resultStart.dataInicio).toEqual({ gte: new Date('2025-03-01') })
      expect(resultStart.dataFim).toBeUndefined()

      const filtrosOnlyEnd: RelatorioFiltrosDto = {
        dataFim: '2025-09-30',
      }
      const resultEnd = buildGradeFilterWhere(filtrosOnlyEnd)
      expect(resultEnd.dataInicio).toBeUndefined()
      expect(resultEnd.dataFim).toEqual({ lte: new Date('2025-09-30') })
    })
  })
})

import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface FolhaPagamento {
  medicoId: string
  medicoNome: string
  totalVagas: number
  totalHoras: number
  valorTotal: number
}

interface GradeRelatorio {
  gradeId: string
  gradeNome: string
  hospital: string
  setor: string
  totalSlots: number
  slotsPreenchidos: number
  slotsVazios: number
}

interface Produtividade {
  medicoId: string
  medicoNome: string
  vagasRealizadas: number
  horasTrabalhadas: number
  taxaPresenca: number
}

interface FiltrosDisponiveis {
  hospitais: { id: string; nome: string }[]
  setores: { id: string; nome: string }[]
  medicos: { id: string; nome: string }[]
  meses: { valor: string; label: string }[]
}

describe('Relatorios Integration', () => {
  describe('Filtros Disponíveis', () => {
    it('should get available filters', async () => {
      const filtros = await apiRequest<FiltrosDisponiveis>('/relatorios/filtros')

      expect(filtros.hospitais).toBeDefined()
      expect(filtros.setores).toBeDefined()
      expect(filtros.medicos).toBeDefined()
      expect(filtros.meses).toBeDefined()
      expect(Array.isArray(filtros.hospitais)).toBe(true)
    })
  })

  describe('Folha de Pagamento', () => {
    it('should get folha pagamento report', async () => {
      const response = await apiRequest<FolhaPagamento[]>('/relatorios/folha-pagamento')

      expect(Array.isArray(response)).toBe(true)
      response.forEach((item) => {
        expect(item.medicoId).toBeDefined()
        expect(item.medicoNome).toBeDefined()
        expect(typeof item.totalVagas).toBe('number')
        expect(typeof item.valorTotal).toBe('number')
      })
    })

    it('should filter folha pagamento by hospital', async () => {
      const filtros = await apiRequest<FiltrosDisponiveis>('/relatorios/filtros')

      if (filtros.hospitais.length > 0) {
        const hospitalId = filtros.hospitais[0].id
        const response = await apiRequest<FolhaPagamento[]>(
          `/relatorios/folha-pagamento?hospitalId=${hospitalId}`
        )

        expect(Array.isArray(response)).toBe(true)
      }
    })

    it('should filter folha pagamento by date range', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      const response = await apiRequest<FolhaPagamento[]>(
        `/relatorios/folha-pagamento?startDate=${startDate}&endDate=${endDate}`
      )

      expect(Array.isArray(response)).toBe(true)
    })
  })

  describe('Grades Report', () => {
    it('should get grades report', async () => {
      const response = await apiRequest<GradeRelatorio[]>('/relatorios/grades')

      expect(Array.isArray(response)).toBe(true)
      response.forEach((item) => {
        expect(item.gradeId).toBeDefined()
        expect(item.hospital).toBeDefined()
        expect(item.setor).toBeDefined()
        expect(typeof item.totalSlots).toBe('number')
        expect(typeof item.slotsPreenchidos).toBe('number')
      })
    })

    it('should filter grades by hospital', async () => {
      const filtros = await apiRequest<FiltrosDisponiveis>('/relatorios/filtros')

      if (filtros.hospitais.length > 0) {
        const hospitalId = filtros.hospitais[0].id
        const response = await apiRequest<GradeRelatorio[]>(
          `/relatorios/grades?hospitalId=${hospitalId}`
        )

        expect(Array.isArray(response)).toBe(true)
      }
    })
  })

  describe('Produtividade Report', () => {
    it('should get produtividade report', async () => {
      const response = await apiRequest<Produtividade[]>('/relatorios/produtividade')

      expect(Array.isArray(response)).toBe(true)
      response.forEach((item) => {
        expect(item.medicoId).toBeDefined()
        expect(item.medicoNome).toBeDefined()
        expect(typeof item.vagasRealizadas).toBe('number')
        expect(typeof item.taxaPresenca).toBe('number')
      })
    })

    it('should filter produtividade by medico', async () => {
      const filtros = await apiRequest<FiltrosDisponiveis>('/relatorios/filtros')

      if (filtros.medicos.length > 0) {
        const medicoId = filtros.medicos[0].id
        const response = await apiRequest<Produtividade[]>(
          `/relatorios/produtividade?medicoId=${medicoId}`
        )

        expect(Array.isArray(response)).toBe(true)
      }
    })
  })
})

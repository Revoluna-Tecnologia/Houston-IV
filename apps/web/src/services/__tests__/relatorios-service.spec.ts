import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RelatoriosService } from '../relatorios-service'
import { apiClient } from '../api-client'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('RelatoriosService', () => {
  let service: RelatoriosService

  const mockFolhaPagamento = [
    {
      escalistaId: 'escalista-1',
      escalistaNome: 'João Silva',
      totalHoras: 120,
      valorHora: 50.0,
      valorTotal: 6000.0,
      turnos: 15,
    },
    {
      escalistaId: 'escalista-2',
      escalistaNome: 'Maria Santos',
      totalHoras: 80,
      valorHora: 60.0,
      valorTotal: 4800.0,
      turnos: 10,
    },
  ]

  const mockGradeRelatorio = [
    {
      gradeId: 'grade-1',
      gradeNome: 'Grade Janeiro',
      hospitalNome: 'Hospital Central',
      setorNome: 'UTI',
      totalVagas: 30,
      vagasPreenchidas: 25,
      percentualOcupacao: 83.33,
    },
  ]

  const mockProdutividade = [
    {
      escalistaId: 'escalista-1',
      escalistaNome: 'João Silva',
      turnosRealizados: 15,
      turnosCancelados: 1,
      horasExtras: 8,
      avaliacaoMedia: 4.5,
    },
  ]

  const mockFiltrosDisponiveis = {
    hospitais: [
      { id: 'hospital-1', nome: 'Hospital Central' },
      { id: 'hospital-2', nome: 'Hospital Norte' },
    ],
    setores: [
      { id: 'setor-1', nome: 'UTI' },
      { id: 'setor-2', nome: 'Emergência' },
    ],
    especialidades: [
      { id: 'esp-1', nome: 'Cardiologia' },
      { id: 'esp-2', nome: 'Pediatria' },
    ],
    periodos: [
      { value: '2025-01', label: 'Janeiro 2025' },
      { value: '2025-02', label: 'Fevereiro 2025' },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RelatoriosService()
  })

  describe('getFolhaPagamento', () => {
    it('should fetch folha de pagamento without filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFolhaPagamento)

      const result = await service.getFolhaPagamento()

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/folha-pagamento', undefined)
      expect(result).toEqual(mockFolhaPagamento)
      expect(result).toHaveLength(2)
    })

    it('should fetch folha de pagamento with date filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFolhaPagamento)

      const filtros = { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
      const result = await service.getFolhaPagamento(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/folha-pagamento', filtros)
      expect(result).toEqual(mockFolhaPagamento)
    })

    it('should fetch folha de pagamento with hospital filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockFolhaPagamento[0]])

      const filtros = { hospitalId: 'hospital-1' }
      const result = await service.getFolhaPagamento(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/folha-pagamento', filtros)
      expect(result).toHaveLength(1)
    })

    it('should fetch folha de pagamento with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFolhaPagamento)

      const filtros = {
        hospitalId: 'hospital-1',
        setorId: 'setor-1',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      }
      const result = await service.getFolhaPagamento(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/folha-pagamento', filtros)
      expect(result).toEqual(mockFolhaPagamento)
    })

    it('should return empty array when no data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])

      const result = await service.getFolhaPagamento()

      expect(result).toEqual([])
    })
  })

  describe('getGrades', () => {
    it('should fetch grades relatorio without filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockGradeRelatorio)

      const result = await service.getGrades()

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/grades', undefined)
      expect(result).toEqual(mockGradeRelatorio)
    })

    it('should fetch grades relatorio with hospital filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockGradeRelatorio)

      const filtros = { hospitalId: 'hospital-1' }
      const result = await service.getGrades(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/grades', filtros)
      expect(result).toEqual(mockGradeRelatorio)
    })

    it('should fetch grades relatorio with date range', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockGradeRelatorio)

      const filtros = { dataInicio: '2025-01-01', dataFim: '2025-03-31' }
      const result = await service.getGrades(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/grades', filtros)
      expect(result).toEqual(mockGradeRelatorio)
    })

    it('should fetch grades relatorio with status filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockGradeRelatorio)

      const filtros = { status: 'publicada' }
      const result = await service.getGrades(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/grades', filtros)
      expect(result).toEqual(mockGradeRelatorio)
    })
  })

  describe('getProdutividade', () => {
    it('should fetch produtividade without filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProdutividade)

      const result = await service.getProdutividade()

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/produtividade', undefined)
      expect(result).toEqual(mockProdutividade)
    })

    it('should fetch produtividade with escalista filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProdutividade)

      const filtros = { escalistaId: 'escalista-1' }
      const result = await service.getProdutividade(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/produtividade', filtros)
      expect(result).toEqual(mockProdutividade)
    })

    it('should fetch produtividade with period filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProdutividade)

      const filtros = { periodo: '2025-01' }
      const result = await service.getProdutividade(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/produtividade', filtros)
      expect(result).toEqual(mockProdutividade)
    })

    it('should fetch produtividade with all filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProdutividade)

      const filtros = {
        escalistaId: 'escalista-1',
        hospitalId: 'hospital-1',
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      }
      const result = await service.getProdutividade(filtros)

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/produtividade', filtros)
      expect(result).toEqual(mockProdutividade)
    })
  })

  describe('getFiltrosDisponiveis', () => {
    it('should fetch available filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFiltrosDisponiveis)

      const result = await service.getFiltrosDisponiveis()

      expect(apiClient.get).toHaveBeenCalledWith('/relatorios/filtros')
      expect(result).toEqual(mockFiltrosDisponiveis)
    })

    it('should return filter structure with hospitals', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFiltrosDisponiveis)

      const result = await service.getFiltrosDisponiveis()

      expect(result.hospitais).toBeDefined()
      expect(result.hospitais).toHaveLength(2)
      expect(result.hospitais[0]).toHaveProperty('id')
      expect(result.hospitais[0]).toHaveProperty('nome')
    })

    it('should return filter structure with setores', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFiltrosDisponiveis)

      const result = await service.getFiltrosDisponiveis()

      expect(result.setores).toBeDefined()
      expect(result.setores).toHaveLength(2)
    })

    it('should return filter structure with especialidades', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFiltrosDisponiveis)

      const result = await service.getFiltrosDisponiveis()

      expect(result.especialidades).toBeDefined()
      expect(result.especialidades).toHaveLength(2)
    })

    it('should return filter structure with periodos', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFiltrosDisponiveis)

      const result = await service.getFiltrosDisponiveis()

      expect(result.periodos).toBeDefined()
      expect(result.periodos).toHaveLength(2)
      expect(result.periodos[0]).toHaveProperty('value')
      expect(result.periodos[0]).toHaveProperty('label')
    })

    it('should handle empty filters response', async () => {
      const emptyFilters = {
        hospitais: [],
        setores: [],
        especialidades: [],
        periodos: [],
      }
      vi.mocked(apiClient.get).mockResolvedValue(emptyFilters)

      const result = await service.getFiltrosDisponiveis()

      expect(result.hospitais).toHaveLength(0)
      expect(result.setores).toHaveLength(0)
    })
  })
})

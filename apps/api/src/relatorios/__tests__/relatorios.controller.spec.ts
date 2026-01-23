import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelatoriosController } from '../relatorios.controller'

describe('RelatoriosController', () => {
  let controller: RelatoriosController

  const mockService = {
    getFolhaPagamento: vi.fn(),
    getGrades: vi.fn(),
    getProdutividade: vi.fn(),
    getFiltrosDisponiveis: vi.fn(),
  }

  beforeEach(() => {
    controller = new RelatoriosController(mockService as never)
    vi.clearAllMocks()
  })

  describe('getFolhaPagamento', () => {
    it('should return folha de pagamento', async () => {
      const response = [
        {
          medicoId: 'medico-1',
          medicoNome: 'Dr. Teste',
          totalVagas: 5,
          totalHoras: 20,
          valorTotal: 5000,
          pagamentos: [],
        },
      ]
      mockService.getFolhaPagamento.mockResolvedValue(response)

      const result = await controller.getFolhaPagamento({})

      expect(result).toEqual(response)
      expect(mockService.getFolhaPagamento).toHaveBeenCalledWith({})
    })

    it('should pass filters to service', async () => {
      const filtros = { dataInicio: '2025-01-01', medicoId: 'medico-1' }
      mockService.getFolhaPagamento.mockResolvedValue([])

      await controller.getFolhaPagamento(filtros)

      expect(mockService.getFolhaPagamento).toHaveBeenCalledWith(filtros)
    })
  })

  describe('getGrades', () => {
    it('should return grades', async () => {
      const response = [
        {
          gradeId: 'grade-1',
          gradeNome: 'Grade Janeiro',
          hospital: 'Hospital A',
          setor: 'UTI',
          periodo: '01/01/2025 - 31/01/2025',
          totalSlots: 10,
          slotsPreenchidos: 8,
          slotsVazios: 2,
        },
      ]
      mockService.getGrades.mockResolvedValue(response)

      const result = await controller.getGrades({})

      expect(result).toEqual(response)
      expect(mockService.getGrades).toHaveBeenCalledWith({})
    })

    it('should pass filters to service', async () => {
      const filtros = { hospitalId: 'hospital-1', setorId: 'setor-1' }
      mockService.getGrades.mockResolvedValue([])

      await controller.getGrades(filtros)

      expect(mockService.getGrades).toHaveBeenCalledWith(filtros)
    })
  })

  describe('getProdutividade', () => {
    it('should return produtividade', async () => {
      const response = [
        {
          medicoId: 'medico-1',
          medicoNome: 'Dr. Teste',
          vagasRealizadas: 10,
          horasTrabalhadas: 40,
          taxaPresenca: 95,
          valorRecebido: 10000,
        },
      ]
      mockService.getProdutividade.mockResolvedValue(response)

      const result = await controller.getProdutividade({})

      expect(result).toEqual(response)
      expect(mockService.getProdutividade).toHaveBeenCalledWith({})
    })

    it('should pass filters to service', async () => {
      const filtros = { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
      mockService.getProdutividade.mockResolvedValue([])

      await controller.getProdutividade(filtros)

      expect(mockService.getProdutividade).toHaveBeenCalledWith(filtros)
    })
  })

  describe('getFiltrosDisponiveis', () => {
    it('should return available filters', async () => {
      const response = {
        hospitais: [{ id: 'h1', nome: 'Hospital A' }],
        setores: [{ id: 's1', nome: 'UTI' }],
        medicos: [{ id: 'm1', nome: 'Dr. Teste' }],
        meses: [{ valor: '2025-01', label: 'janeiro de 2025' }],
      }
      mockService.getFiltrosDisponiveis.mockResolvedValue(response)

      const result = await controller.getFiltrosDisponiveis()

      expect(result).toEqual(response)
      expect(mockService.getFiltrosDisponiveis).toHaveBeenCalled()
    })
  })
})

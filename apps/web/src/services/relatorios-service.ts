import { apiClient } from './api-client';
import type {
  FolhaPagamentoItem,
  GradeRelatorio,
  ProdutividadeItem,
  FiltrosDisponiveis,
  RelatorioFiltros,
} from './types';

class RelatoriosService {
  async getFolhaPagamento(filtros?: RelatorioFiltros): Promise<FolhaPagamentoItem[]> {
    return apiClient.get<FolhaPagamentoItem[]>('/relatorios/folha-pagamento', filtros as Record<string, unknown>);
  }

  async getGrades(filtros?: RelatorioFiltros): Promise<GradeRelatorio[]> {
    return apiClient.get<GradeRelatorio[]>('/relatorios/grades', filtros as Record<string, unknown>);
  }

  async getProdutividade(filtros?: RelatorioFiltros): Promise<ProdutividadeItem[]> {
    return apiClient.get<ProdutividadeItem[]>('/relatorios/produtividade', filtros as Record<string, unknown>);
  }

  async getFiltrosDisponiveis(): Promise<FiltrosDisponiveis> {
    return apiClient.get<FiltrosDisponiveis>('/relatorios/filtros');
  }
}

export const relatoriosService = new RelatoriosService();
export { RelatoriosService };

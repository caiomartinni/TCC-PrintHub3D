import api from './api';

export interface FinanceiroResumo {
  saldoDisponivel: number;
  receitaMes: number;
  totalSacado: number;
}

export interface SaqueItem {
  id: string;
  banco: string;
  ultimosDigitos: string;
  valor: number;
  dataConclusao: string;
  status: 'CONCLUIDO';
}

export const financeiroService = {
  async getResumo() {
    const { data } = await api.get('/financeiro/resumo');
    return data.data as FinanceiroResumo;
  },

  async getSaques(page = 1, limit = 5) {
    const { data } = await api.get('/financeiro/saques', { params: { page, limit } });
    return data as {
      data: SaqueItem[];
      pagination: { total: number; page: number; limit: number; pages: number };
    };
  },
};

import api from './api';

export interface PreferenceData {
  preferenceId: string;
  publicKey:    string;
  orderId:      string;
  amount:       number;
  title:        string;
}

export interface PaymentResult {
  paymentId:    number | string;
  status:       string;
  statusDetail: string;
  orderId:      string;
}

export const paymentService = {
  async createPreference(orderId: string): Promise<PreferenceData> {
    const { data } = await api.post('/payments/preference', { orderId });
    return data.data as PreferenceData;
  },

  async processPayment(orderId: string, formData: Record<string, unknown>): Promise<PaymentResult> {
    const { data } = await api.post('/payments/process', { orderId, formData });
    return data.data as PaymentResult;
  },

  async getStatus(paymentId: string): Promise<{
    paymentId: string; status: string; statusDetail: string;
    amount: number; description: string; externalRef: string;
  }> {
    const { data } = await api.get(`/payments/status/${paymentId}`);
    return data.data;
  },
};

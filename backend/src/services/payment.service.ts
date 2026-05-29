// Mercado Pago Split Marketplace - Pre-integration service
// Configure MERCADO_PAGO_ACCESS_TOKEN to enable

export interface PaymentData {
  orderId: string;
  amount: number;
  description: string;
  payerEmail: string;
  makerId?: string;
  platformFeeRate?: number;
}

export interface PaymentResult {
  externalId: string;
  status: string;
  checkoutUrl?: string;
  pixCode?: string;
  boletoUrl?: string;
}

export interface SplitConfig {
  makerId: string;
  makerAccessToken: string;
  platformFeeRate: number;
}

class PaymentService {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env['MERCADO_PAGO_ACCESS_TOKEN'] || '';
  }

  async createCheckout(data: PaymentData): Promise<PaymentResult> {
    // TODO: Integrate Mercado Pago Checkout Pro
    // POST https://api.mercadopago.com/checkout/preferences
    console.log('[PaymentService] createCheckout - not yet integrated', data);
    return {
      externalId: `mock_${Date.now()}`,
      status: 'pending',
      checkoutUrl: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${Date.now()}`,
    };
  }

  async createSplitPayment(data: PaymentData, split: SplitConfig): Promise<PaymentResult> {
    // TODO: Integrate Mercado Pago Marketplace Split
    // Uses marketplace access token with application_fee
    console.log('[PaymentService] createSplitPayment - not yet integrated', { data, split });
    const makerAmount = data.amount * (1 - split.platformFeeRate);
    const platformFee = data.amount * split.platformFeeRate;
    return {
      externalId: `mock_split_${Date.now()}`,
      status: 'pending',
      checkoutUrl: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_split_${Date.now()}`,
    };
    void makerAmount;
    void platformFee;
  }

  async getPaymentStatus(externalId: string): Promise<string> {
    // TODO: GET https://api.mercadopago.com/v1/payments/{id}
    console.log('[PaymentService] getPaymentStatus - not yet integrated', externalId);
    return 'pending';
  }

  async processWebhook(body: Record<string, unknown>): Promise<void> {
    // TODO: Process Mercado Pago webhooks
    // Validate webhook signature with MERCADO_PAGO_WEBHOOK_SECRET
    console.log('[PaymentService] processWebhook', body);
  }

  async refund(externalId: string, amount?: number): Promise<void> {
    // TODO: POST https://api.mercadopago.com/v1/payments/{id}/refunds
    console.log('[PaymentService] refund - not yet integrated', { externalId, amount });
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }
}

export const paymentService = new PaymentService();

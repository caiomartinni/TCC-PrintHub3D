export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

export const formatDateTime = (date: string | Date): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));

export const formatDistance = (km: number): string =>
  km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;

export const truncate = (str: string, n: number): string =>
  str.length > n ? `${str.slice(0, n)}...` : str;

export const getInitials = (name: string): string =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const orderStatusLabel: Record<string, string> = {
  PENDING: 'Aguardando', CONFIRMED: 'Confirmado', PRINTING: 'Imprimindo',
  QUALITY_CHECK: 'Controle de Qualidade', SHIPPED: 'Enviado',
  DELIVERED: 'Entregue', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

export const quoteStatusLabel: Record<string, string> = {
  OPEN: 'Aberto', PENDING: 'Aguardando', ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado', EXPIRED: 'Expirado',
};

export const makerStatusLabel: Record<string, string> = {
  PENDING: 'Pendente', ACTIVE: 'Ativo', SUSPENDED: 'Suspenso', REJECTED: 'Rejeitado',
};

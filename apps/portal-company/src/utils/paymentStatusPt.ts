import type { PaymentStatus } from '@/types/companyPayment'

export const paymentStatusPt: Record<PaymentStatus, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  FAILED:    'Falha',
  CANCELLED: 'Cancelado',
}

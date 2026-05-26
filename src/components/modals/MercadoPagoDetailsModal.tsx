import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import { maskBRL } from '../../lib/utils';

interface MercadoPagoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: {
    status: string;
    status_detail?: string;
    payment_method_id?: string;
    date_created?: string;
    date_approved?: string;
    transaction_amount?: number;
  } | null;
  paymentId: string;
}

export function MercadoPagoDetailsModal({
  isOpen,
  onClose,
  details,
  paymentId
}: MercadoPagoDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !details) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapMPStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Pendente (Aguardando pagamento)',
      approved: 'Aprovado (Pago)',
      authorized: 'Autorizado (Em análise)',
      in_process: 'Em processo (Em análise de segurança)',
      in_mediation: 'Em disputa (Mediação aberta)',
      rejected: 'Rejeitado (Pagamento recusado)',
      cancelled: 'Cancelado (Expirado ou cancelado manualmente)',
      refunded: 'Devolvido (Reembolsado)',
      charged_back: 'Contestado (Chargeback)'
    };
    return statuses[status] || status;
  };

  const mapMPStatusDetail = (detail: string) => {
    const detailsMap: Record<string, string> = {
      accredited: 'O pagamento foi creditado e aprovado com sucesso.',
      pending_contingency: 'O pagamento está em análise preventiva de segurança do Mercado Pago.',
      pending_waiting_payment: 'O cliente gerou o código Pix/boleto, mas ainda não realizou o pagamento no banco.',
      pending_waiting_transfer: 'O cliente gerou o Pix, mas não realizou o pagamento.',
      cc_rejected_bad_filled_card_number: 'O número do cartão de crédito digitado é inválido.',
      cc_rejected_bad_filled_date: 'A data de validade do cartão foi digitada incorretamente.',
      cc_rejected_bad_filled_other: 'Os dados do cartão foram preenchidos incorretamente.',
      cc_rejected_bad_filled_security_code: 'O código de segurança (CVV) do cartão está incorreto.',
      cc_rejected_blacklist: 'O cartão está bloqueado ou na lista negra de segurança do emissor.',
      cc_rejected_call_for_authorize: 'O pagamento exige autorização prévia por telefone com o banco emissor.',
      cc_rejected_card_disabled: 'O cartão está inativo. O comprador precisa ativá-lo ou usar outro cartão.',
      cc_rejected_card_error: 'Ocorreu um erro genérico ao tentar processar as informações do cartão.',
      cc_rejected_duplicated_payment: 'Este pagamento foi recusado porque já existe uma transação idêntica em andamento.',
      cc_rejected_high_risk: 'Recusado pelo sistema de prevenção de fraudes (alto risco de segurança).',
      cc_rejected_insufficient_amount: 'Limite de crédito ou saldo insuficiente no cartão.',
      cc_rejected_invalid_installments: 'O número de parcelas escolhido não é suportado por este cartão.',
      cc_rejected_max_attempts: 'Limite de tentativas de processamento com este cartão excedido.',
      cc_rejected_other_reason: 'O banco emissor do cartão de crédito recusou a transação sem informar o motivo específico.'
    };
    return detailsMap[detail] || detail;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending':
      case 'authorized':
      case 'in_process':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'rejected':
      case 'cancelled':
      case 'charged_back':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />;
      case 'pending':
      case 'authorized':
      case 'in_process':
        return <Clock className="w-10 h-10 text-yellow-500" strokeWidth={1.5} />;
      default:
        return <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />;
    }
  };

  const formatBRL = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#111] border border-white/10 w-full max-w-lg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[3rem] overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8 md:p-10 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center mb-6 shadow-2xl transition-transform hover:scale-105 border ${getStatusColor(details.status)}`}>
              {getStatusIcon(details.status)}
            </div>

            <p className="text-brand-orange text-[9px] uppercase tracking-[0.4em] font-black mb-2 italic opacity-60">DETALHES DO GATEWAY</p>
            <h3 className="text-xl font-serif italic text-white mb-6 text-center leading-tight">
              Consulta Mercado Pago
            </h3>

            <div className="w-full space-y-4 mb-8">
              {/* ID de Pagamento */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-white/40 mb-1 font-bold">ID do Pagamento (MP)</p>
                  <p className="text-sm font-mono text-white font-semibold">{paymentId}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                  title="Copiar ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Status e Justificativa */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <p className="text-[8px] uppercase tracking-wider text-white/40 mb-2 font-bold">Status & Justificativa Real-Time</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border ${getStatusColor(details.status)}`}>
                      {mapMPStatus(details.status)}
                    </span>
                    {details.status_detail && (
                      <span className="text-[9px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {details.status_detail}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed font-medium italic mt-1 bg-white/[0.01] border-l-2 border-brand-orange/60 pl-3 py-1">
                    {mapMPStatusDetail(details.status_detail || '')}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-white/40">
                    <DollarSign className="w-3.5 h-3.5" />
                    <p className="text-[8px] uppercase tracking-wider font-bold">Valor</p>
                  </div>
                  <p className="text-base font-bold text-brand-orange font-display">
                    {formatBRL(details.transaction_amount)}
                  </p>
                </div>

                {/* Método */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-white/40">
                    <CreditCard className="w-3.5 h-3.5" />
                    <p className="text-[8px] uppercase tracking-wider font-bold">Método</p>
                  </div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {details.payment_method_id || 'Pix'}
                  </p>
                </div>

                {/* Data Criado */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-1.5 text-white/40">
                    <Calendar className="w-3.5 h-3.5" />
                    <p className="text-[8px] uppercase tracking-wider font-bold">Criado em</p>
                  </div>
                  <p className="text-xs text-white/70 font-mono">
                    {formatDate(details.date_created)}
                  </p>
                </div>

                {/* Data Aprovado */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-1.5 text-white/40">
                    <Calendar className="w-3.5 h-3.5" />
                    <p className="text-[8px] uppercase tracking-wider font-bold">Aprovado em</p>
                  </div>
                  <p className="text-xs text-white/70 font-mono">
                    {formatDate(details.date_approved)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 bg-brand-orange hover:bg-brand-dark text-white text-[10px] uppercase tracking-[0.4em] font-black transition-all rounded-2xl shadow-xl active:scale-95 text-center"
            >
              Fechar Detalhes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { verifyMercadoPagoSignature } from '../_shared/mercadoPagoSignature.ts';

const response = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return response(405, { error: 'Método não permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !accessToken || !webhookSecret) {
    console.error('O webhook Pix não está configurado no servidor.');
    return response(503, { error: 'Webhook não configurado.' });
  }

  const url = new URL(request.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } };
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return response(400, { error: 'Corpo inválido.' });
    }
    body = parsed;
  } catch (error) {
    console.error('O webhook do Mercado Pago enviou um corpo inválido.', error);
    return response(400, { error: 'Corpo inválido.' });
  }

  const topic = url.searchParams.get('type') ?? body.type;
  if (topic !== 'payment') return response(200, { received: true });

  const paymentId = url.searchParams.get('data.id')
    ?? url.searchParams.get('id')
    ?? String(body.data?.id ?? '');
  if (!/^\d+$/.test(paymentId)) return response(400, { error: 'Identificador de pagamento inválido.' });

  const signatureIsValid = await verifyMercadoPagoSignature(
    webhookSecret,
    request.headers.get('x-signature'),
    request.headers.get('x-request-id'),
    paymentId
  );
  if (!signatureIsValid) return response(401, { error: 'Assinatura inválida.' });

  let paymentResponse: Response;
  try {
    paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error('Falha ao consultar o pagamento no Mercado Pago.', error);
    return response(502, { error: 'Não foi possível consultar o pagamento.' });
  }
  if (!paymentResponse.ok) {
    console.error('O Mercado Pago recusou a consulta do pagamento.', paymentResponse.status);
    return response(502, { error: 'Não foi possível consultar o pagamento.' });
  }

  let payment;
  try {
    payment = await paymentResponse.json();
  } catch (error) {
    console.error('A consulta do pagamento devolveu JSON inválido.', error);
    return response(502, { error: 'Resposta de pagamento inválida.' });
  }
  if (String(payment?.id) !== paymentId) {
    console.error('O identificador do pagamento não corresponde à consulta.', paymentId);
    return response(502, { error: 'O Mercado Pago devolveu um pagamento diferente.' });
  }

  const purchaseId = payment?.external_reference;
  const metadata = payment?.metadata;
  const amountIsValid = payment?.transaction_amount === 2.99
    && payment?.currency_id === 'BRL'
    && payment?.payment_method_id === 'pix';
  if (typeof purchaseId !== 'string' || metadata?.purchase_id !== purchaseId
    || typeof metadata?.user_id !== 'string' || typeof metadata?.item_id !== 'string' || !amountIsValid) {
    console.error('Os dados do pagamento não correspondem à compra esperada.', paymentId);
    return response(400, { error: 'Dados de pagamento incompatíveis.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: purchase, error: purchaseError } = await admin
    .from('store_purchases')
    .select('id, user_id, item_id, amount, currency, provider_payment_id, status')
    .eq('id', purchaseId)
    .maybeSingle();
  if (purchaseError) {
    console.error('Falha ao localizar a compra do webhook.', purchaseError);
    return response(503, { error: 'Não foi possível localizar a compra.' });
  }
  if (!purchase || purchase.user_id !== metadata.user_id || purchase.item_id !== metadata.item_id
    || Number(purchase.amount) !== 2.99 || purchase.currency !== 'BRL'
    || (purchase.provider_payment_id && purchase.provider_payment_id !== String(payment.id))) {
    return response(400, { error: 'A compra não corresponde ao pagamento.' });
  }

  if (payment.status !== 'approved') {
    if (['rejected', 'cancelled'].includes(payment.status) && purchase.status === 'pending') {
      const { error } = await admin
        .from('store_purchases')
        .update({ status: payment.status, provider_payment_id: String(payment.id), updated_at: new Date().toISOString() })
        .eq('id', purchase.id);
      if (error) {
        console.error('Falha ao atualizar o status da compra.', error);
        return response(503, { error: 'Não foi possível atualizar a compra.' });
      }
    }
    return response(200, { received: true });
  }

  const { error: updateError } = await admin
    .from('store_purchases')
    .update({
      status: 'approved',
      provider_payment_id: String(payment.id),
      updated_at: new Date().toISOString(),
      paid_at: payment.date_approved ?? new Date().toISOString()
    })
    .eq('id', purchase.id);
  if (updateError) {
    console.error('Falha ao liberar a ferramenta após o pagamento.', updateError);
    return response(503, { error: 'Não foi possível confirmar a compra.' });
  }

  return response(200, { received: true });
});

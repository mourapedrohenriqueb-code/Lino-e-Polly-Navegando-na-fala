import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

const storeItems: Record<string, string> = {
  'syllable-guide': 'Mapa das sílabas',
  'slow-voice': 'Voz em ritmo tranquilo',
  'first-sound': 'Lupa do primeiro som',
  'double-listen': 'Fone de repetição',
  'review-book': 'Caderno de revisão',
  'focus-compass': 'Bússola do foco'
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Método não permitido.' });
  if (Number(request.headers.get('Content-Length') ?? 0) > 16000) {
    return jsonResponse(413, { error: 'A solicitação excede o tamanho permitido.' });
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(401, { error: 'Entre na sua conta para comprar uma ferramenta.' });
  }
  if (!accessToken) return jsonResponse(503, { error: 'O pagamento Pix ainda não foi configurado.' });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  let authResult;
  try {
    authResult = await userClient.auth.getUser();
  } catch (error) {
    console.error('Falha ao validar a sessão para pagamento.', error);
    return jsonResponse(503, { error: 'Não foi possível validar sua sessão.' });
  }
  const { data: { user }, error: authError } = authResult;
  if (authError || !user) return jsonResponse(401, { error: 'Sua sessão expirou. Entre novamente.' });

  let body: { itemId?: unknown; payerEmail?: unknown };
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse(400, { error: 'A solicitação precisa ser um objeto JSON.' });
    }
    body = parsed;
  } catch {
    return jsonResponse(400, { error: 'A solicitação precisa ser JSON válido.' });
  }

  if (typeof body.itemId !== 'string' || !Object.hasOwn(storeItems, body.itemId)) {
    return jsonResponse(400, { error: 'Esta ferramenta não está disponível para compra.' });
  }
  const itemId = body.itemId;
  const itemName = storeItems[itemId];

  const payerEmail = typeof body.payerEmail === 'string' ? body.payerEmail.trim() : user.email;
  if (!payerEmail || payerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    return jsonResponse(400, { error: 'Informe um e-mail válido para identificar o pagamento.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: previousPurchase, error: previousPurchaseError } = await admin
    .from('store_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('status', 'approved')
    .maybeSingle();
  if (previousPurchaseError) {
    console.error('Falha ao consultar compras anteriores.', previousPurchaseError);
    return jsonResponse(503, { error: 'Não foi possível verificar as compras anteriores.' });
  }
  if (previousPurchase) return jsonResponse(409, { error: 'Esta ferramenta já foi liberada na sua conta.' });

  const { data: purchase, error: insertError } = await admin
    .from('store_purchases')
    .insert({ user_id: user.id, item_id: itemId })
    .select('id')
    .single();
  if (insertError || !purchase) {
    console.error('Falha ao registrar a intenção de compra.', insertError);
    return jsonResponse(503, { error: 'Não foi possível iniciar esta compra.' });
  }

  const cancelPendingPurchase = async () => {
    const { error } = await admin
      .from('store_purchases')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', purchase.id);
    if (error) console.error('Não foi possível cancelar a intenção de compra.', error);
  };

  const paymentUrl = 'https://api.mercadopago.com/v1/payments';
  let paymentResponse: Response;
  try {
    paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': purchase.id
      },
      body: JSON.stringify({
        transaction_amount: 2.99,
        description: itemName,
        payment_method_id: 'pix',
        payer: { email: payerEmail },
        external_reference: purchase.id,
        metadata: { purchase_id: purchase.id, user_id: user.id, item_id: itemId },
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`
      })
    });
  } catch (error) {
    console.error('Falha de conexão com o Mercado Pago.', error);
    await cancelPendingPurchase();
    return jsonResponse(502, { error: 'O Mercado Pago está indisponível. Tente novamente.' });
  }

  let payment;
  try {
    payment = await paymentResponse.json();
  } catch (error) {
    console.error('O Mercado Pago devolveu uma resposta inválida.', error);
    await cancelPendingPurchase();
    return jsonResponse(502, { error: 'O Mercado Pago devolveu uma resposta inválida.' });
  }
  const transactionData = payment?.point_of_interaction?.transaction_data;
  if (!paymentResponse.ok || typeof payment?.id !== 'number'
    || payment.payment_method_id !== 'pix' || typeof transactionData?.qr_code !== 'string'
    || typeof transactionData?.qr_code_base64 !== 'string') {
    console.error('O Mercado Pago não criou o Pix.', paymentResponse.status, payment);
    await cancelPendingPurchase();
    return jsonResponse(502, { error: 'Não foi possível criar o Pix. Confira sua conta do Mercado Pago.' });
  }

  const { error: updateError } = await admin
    .from('store_purchases')
    .update({ provider_payment_id: String(payment.id), updated_at: new Date().toISOString() })
    .eq('id', purchase.id);
  if (updateError) {
    console.error('Não foi possível vincular o pagamento à compra.', updateError);
    return jsonResponse(503, { error: 'O Pix foi criado, mas não foi possível salvar a compra. Procure o suporte antes de pagar.' });
  }

  return jsonResponse(200, {
    purchaseId: purchase.id,
    itemId,
    qrCode: transactionData.qr_code,
    qrCodeBase64: transactionData.qr_code_base64,
    ticketUrl: transactionData.ticket_url ?? null
  });
});

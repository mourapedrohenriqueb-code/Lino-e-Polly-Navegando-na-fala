import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Método não permitido.' });
  if (Number(request.headers.get('Content-Length') ?? 0) > 64000) {
    return jsonResponse(413, { error: 'A solicitação excede o tamanho permitido.' });
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const googleApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  if (!authorization || !supabaseUrl || !anonKey) return jsonResponse(401, { error: 'Entre na sua conta para usar a tradução.' });
  if (!googleApiKey) return jsonResponse(503, { error: 'A tradução ainda não foi configurada no servidor.' });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  let authResult;
  try {
    authResult = await supabase.auth.getUser();
  } catch (error) {
    console.error('Falha ao validar a sessão para tradução.', error);
    return jsonResponse(503, { error: 'Não foi possível validar sua sessão.' });
  }
  const { data: { user }, error: authError } = authResult;
  if (authError || !user) return jsonResponse(401, { error: 'Sua sessão expirou. Entre novamente.' });

  let body: { action?: string; target?: string; texts?: unknown };
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse(400, { error: 'O corpo da solicitação precisa ser um objeto JSON.' });
    }
    body = parsed;
  } catch {
    return jsonResponse(400, { error: 'O corpo da solicitação precisa ser JSON válido.' });
  }

  let quota;
  try {
    quota = await supabase.rpc('consume_translation_quota');
  } catch (error) {
    console.error('Falha ao validar limite diário de tradução.', error);
    return jsonResponse(503, { error: 'Não foi possível validar o limite de tradução.' });
  }
  if (quota.error) {
    console.error('Falha ao validar limite diário de tradução.', quota.error);
    return jsonResponse(503, { error: 'Não foi possível validar o limite de tradução.' });
  }
  if (!quota.data) return jsonResponse(429, { error: 'Limite diário de traduções atingido. Tente novamente amanhã.' });

  const target = body.target;
  if (!target || !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8}){0,2}$/.test(target)) {
    return jsonResponse(400, { error: 'O idioma de destino é inválido.' });
  }

  const endpoint = new URL('https://translation.googleapis.com/language/translate/v2');
  let googleResponse: Response;
  try {
    if (body.action === 'languages') {
      endpoint.pathname += '/languages';
      endpoint.searchParams.set('target', 'pt-BR');
      googleResponse = await fetch(endpoint, {
        headers: { 'X-goog-api-key': googleApiKey }
      });
    } else if (body.action === 'translate') {
      if (!Array.isArray(body.texts) || body.texts.length < 1 || body.texts.length > 40) {
        return jsonResponse(400, { error: 'Envie entre 1 e 40 textos por solicitação.' });
      }
      const texts = body.texts.filter((text): text is string => typeof text === 'string');
      if (texts.length !== body.texts.length || texts.some((text) => text.length > 2000) || texts.join('').length > 12000) {
        return jsonResponse(400, { error: 'Os textos excedem o tamanho permitido.' });
      }
      googleResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': googleApiKey
        },
        body: JSON.stringify({ q: texts, source: 'pt', target, format: 'text' })
      });
    } else {
      return jsonResponse(400, { error: 'Ação de tradução desconhecida.' });
    }
  } catch (error) {
    console.error('Falha de conexão com o serviço de tradução.', error);
    return jsonResponse(502, { error: 'O serviço de tradução está indisponível no momento.' });
  }

  if (!googleResponse.ok) {
    console.error('O serviço Google Translation retornou um erro.', googleResponse.status);
    return jsonResponse(502, { error: 'O serviço de tradução recusou a solicitação.' });
  }

  let result;
  try {
    result = await googleResponse.json();
  } catch (error) {
    console.error('A resposta do serviço de tradução não era JSON válido.', error);
    return jsonResponse(502, { error: 'O serviço de tradução devolveu uma resposta inválida.' });
  }
  if (body.action === 'languages') {
    const languages = result?.data?.languages;
    if (!Array.isArray(languages)) return jsonResponse(502, { error: 'A lista de idiomas veio em formato inválido.' });
    return jsonResponse(200, { languages: languages.map((language) => ({ code: language.language, name: language.name })) });
  }

  const translations = result?.data?.translations;
  if (!Array.isArray(translations)) return jsonResponse(502, { error: 'A resposta de tradução veio em formato inválido.' });
  return jsonResponse(200, { translations: translations.map((item) => item.translatedText) });
});

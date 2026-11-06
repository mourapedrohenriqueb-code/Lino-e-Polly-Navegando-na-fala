# Lino e Polly Navegando na Fala

Jogo educativo de fala com mapa de ilhas, atividades de pronúncia e os mascotes Lino e Polly.

## Recursos e limites atuais

- Seis ilhas: alfabeto, sílabas frequentes, palavras, frases, textos e livros infantis.
- Os bancos incluem mais de 300 palavras, mais de 400 frases e 500 textos distintos.
- O questionário tem 20 perguntas de observação para sugerir uma ilha inicial; a sugestão libera esse ponto de partida. Ele não fornece diagnóstico e não substitui uma avaliação fonoaudiológica.
- Sem configuração externa, o progresso é salvo neste navegador e neste dispositivo. Com Supabase configurado, é possível entrar por link de e-mail ou código SMS e sincronizar o progresso.
- A voz e o reconhecimento dependem dos recursos e das vozes disponíveis no navegador. O reconhecimento de fala pode variar por aparelho, microfone e ambiente.
- Os livros abrem em bibliotecas digitais externas. Os links levam a obras originais em domínio público, principalmente em inglês; traduções podem ter direitos autorais próprios.
- A tradução de textos visíveis usa Google Cloud Translation por uma função Supabase. A lista inclui os idiomas suportados pelo Google; não representa todos os idiomas existentes. Conteúdo enviado para tradução é processado pelo Google.
- Cada exemplo reconhecido rende 30 XP e 15 moedas. A loja troca moedas por ferramentas de prática: divisão silábica, voz mais lenta, pista da letra inicial, repetição do modelo, rodada de foco e caderno de revisão. As ferramentas compradas são salvas junto ao progresso.
- A tela de progresso resume tentativas, reconhecimentos, precisão, atividade por ilha, conquistas e exemplos guardados para rever. Esses dados descrevem o uso do jogo e não são uma avaliação clínica.
- A área **Aventura** acrescenta capítulos opcionais, missão diária sem penalidade, personalização visual, jogos de rimas e memória, modo para ouvir primeiro, orientações para cuidadores e controles de acessibilidade.
- A Ilha do Alfabeto apresenta as 26 letras em 13 pares consecutivos. O progresso antigo de letras individuais é convertido para os pares correspondentes ao abrir o jogo.
- Cada exemplo precisa ser reconhecido para avançar; depois de iniciar pela ilha sugerida, a próxima ilha é liberada quando todos os exemplos da ilha atual forem concluídos.
- Para letras e pares, o reconhecimento aceita letras e alguns nomes falados em português, como “bê” e “cê”, na ordem apresentada. O funcionamento depende do reconhecimento de voz disponível no navegador e no aparelho.

## Acessar o aplicativo

Depois que a publicação do GitHub Pages concluir, o aplicativo estará disponível em:

https://mourapedrohenriqueb-code.github.io/Lino-e-Polly-Navegando-na-fala/

## Executar localmente

```sh
npm install
npm run dev
```

Para executar os testes:

```sh
npm run test
```

## Configurar login e tradução

1. Crie um projeto Supabase e aplique o SQL em `supabase/migrations/20261022000000_profiles_and_translation_quota.sql`.
2. Ative os provedores de e-mail e SMS em **Authentication → Providers**. Para telefones, configure um provedor SMS e use números no formato internacional, como `+5511999999999`. Adicione a URL do GitHub Pages à lista de URLs de redirecionamento permitidas.
3. Copie `.env.example` para `.env.local` no desenvolvimento e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A chave anon/publicável pode estar no cliente; nunca use a service-role key no navegador.
4. Publique a função de tradução com a Supabase CLI e configure a chave do Google apenas como segredo da função:

   ```sh
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   npx supabase functions deploy translate
   npx supabase secrets set GOOGLE_TRANSLATE_API_KEY=SUA_CHAVE
   ```

5. Para o GitHub Pages, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como Actions secrets do repositório. A chave do Google fica somente nos secrets da função Supabase, nunca nos secrets do frontend.
6. Para ativar compras Pix de R$ 2,99 por ferramenta, crie e configure uma aplicação de vendedor no Mercado Pago e registre uma chave Pix nessa conta. Configure o webhook para eventos de pagamento com a URL `https://SEU_PROJECT_REF.supabase.co/functions/v1/mercadopago-webhook` e copie o segredo de assinatura do Mercado Pago. Em seguida, aplique a migração e publique as funções:

   ```sh
   npx supabase db push
   npx supabase secrets set MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN MP_WEBHOOK_SECRET=SEU_SEGREDO_DO_WEBHOOK
   npx supabase functions deploy create-pix-payment
   npx supabase functions deploy mercadopago-webhook --no-verify-jwt
   ```

   Guarde `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` apenas nos secrets do Supabase. Depois de testar um pagamento no ambiente de teste do Mercado Pago, cadastre `VITE_PIX_ENABLED=true` como GitHub Actions secret e publique novamente para mostrar a opção Pix na loja. A ferramenta só é liberada depois que o webhook valida a assinatura e confirma o pagamento aprovado no Mercado Pago; a chave Pix exibida na tela de doação permanece separada.

O banco aplica políticas RLS para que cada pessoa leia e altere apenas o próprio progresso. A tradução exige login e tem limite de 30 solicitações por conta/dia. Google Cloud Translation pode gerar custos; configure alertas e limites de uso no Google Cloud.

## Publicação

O workflow em `.github/workflows/deploy.yml` compila e publica o aplicativo no GitHub Pages sempre que há uma atualização na branch `main`. O site publica `robots.txt` e `sitemap.xml` para ajudar os mecanismos de busca a encontrá-lo.

Para solicitar indexação no Google, verifique a propriedade do site no [Google Search Console](https://search.google.com/search-console) e envie o sitemap:

`https://mourapedrohenriqueb-code.github.io/Lino-e-Polly-Navegando-na-fala/sitemap.xml`

A indexação e a posição nos resultados dependem do Google e não podem ser garantidas pelo aplicativo.

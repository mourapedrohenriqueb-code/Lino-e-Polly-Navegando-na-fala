# Lino e Polly Navegando na Fala

Jogo educativo de fala com mapa de ilhas, atividades de pronúncia e os mascotes Lino e Polly.

## Recursos e limites atuais

- Seis ilhas: alfabeto, sílabas frequentes, palavras, frases, textos e livros infantis.
- Os bancos incluem mais de 300 palavras, mais de 400 frases e 500 textos distintos.
- O questionário tem 20 perguntas de observação para sugerir uma atividade inicial. Ele não fornece diagnóstico e não substitui uma avaliação fonoaudiológica.
- Sem configuração externa, o progresso é salvo neste navegador e neste dispositivo. Com Supabase configurado, é possível entrar por link de e-mail ou código SMS e sincronizar o progresso.
- A voz e o reconhecimento dependem dos recursos e das vozes disponíveis no navegador. O reconhecimento de fala pode variar por aparelho, microfone e ambiente.
- Os livros abrem em bibliotecas digitais externas. Os links levam a obras originais em domínio público, principalmente em inglês; traduções podem ter direitos autorais próprios.
- A tradução de textos visíveis usa Google Cloud Translation por uma função Supabase. A lista inclui os idiomas suportados pelo Google; não representa todos os idiomas existentes. Conteúdo enviado para tradução é processado pelo Google.
- Cada exemplo reconhecido rende 30 XP e 15 moedas. A loja troca moedas por ferramentas de prática: divisão silábica, voz mais lenta, pista da letra inicial, repetição do modelo, rodada de foco e caderno de revisão. As ferramentas compradas são salvas junto ao progresso.
- A tela de progresso resume tentativas, reconhecimentos, precisão, atividade por ilha, conquistas e exemplos guardados para rever. Esses dados descrevem o uso do jogo e não são uma avaliação clínica.

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

O banco aplica políticas RLS para que cada pessoa leia e altere apenas o próprio progresso. A tradução exige login e tem limite de 30 solicitações por conta/dia. Google Cloud Translation pode gerar custos; configure alertas e limites de uso no Google Cloud.

## Publicação

O workflow em `.github/workflows/deploy.yml` compila e publica o aplicativo no GitHub Pages sempre que há uma atualização na branch `main`.

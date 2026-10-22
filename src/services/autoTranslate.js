const textCache = new Map();
const pendingTranslations = new Map();
const translatedNodes = new Map();

function isTranslatableTextNode(node) {
  const parent = node.parentElement;
  if (!parent || !node.nodeValue?.trim()) return false;
  if (parent.closest('script,style,svg,canvas,input,textarea,select,option,.feedback,.profile,.accountSignedIn,.accountForm,[aria-hidden="true"],[data-no-translate]')) return false;
  return true;
}

export async function translateTexts(client, language, texts) {
  const uniqueTexts = [...new Set(texts)];
  for (let offset = 0; offset < uniqueTexts.length; offset += 40) {
    const batch = uniqueTexts.slice(offset, offset + 40);
    const missing = batch.filter((text) => {
      const key = `${language}:${text}`;
      return !textCache.has(key) && !pendingTranslations.has(key);
    });
    let request;
    if (missing.length) {
      request = client.functions.invoke('translate', {
        body: { action: 'translate', target: language, texts: missing }
      }).then(({ data, error }) => {
        if (error) throw error;
        if (!Array.isArray(data?.translations) || data.translations.length !== missing.length) {
          throw new Error('O serviço de tradução devolveu uma resposta incompleta.');
        }
        missing.forEach((text, index) => {
          textCache.set(`${language}:${text}`, data.translations[index]);
        });
      });
      missing.forEach((text) => pendingTranslations.set(`${language}:${text}`, request));
    }
    try {
      await Promise.all(batch
        .filter((text) => !textCache.has(`${language}:${text}`))
        .map((text) => pendingTranslations.get(`${language}:${text}`)));
    } finally {
      missing.forEach((text) => {
        const key = `${language}:${text}`;
        if (pendingTranslations.get(key) === request) pendingTranslations.delete(key);
      });
    }
  }
  return texts.map((text) => textCache.get(`${language}:${text}`) ?? text);
}

export function observeAndTranslate(root, client, language, onError) {
  if (!root || !client || language === 'pt-BR') return () => {};

  let disposed = false;
  let timer;
  let isTranslating = false;
  let shouldTranslateAgain = false;

  const translatePage = async () => {
    if (disposed || isTranslating) {
      shouldTranslateAgain = true;
      return;
    }
    isTranslating = true;
    shouldTranslateAgain = false;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (const node of translatedNodes.keys()) {
      if (!root.contains(node)) translatedNodes.delete(node);
    }
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!isTranslatableTextNode(node)) continue;
      const known = translatedNodes.get(node);
      const source = known && node.nodeValue === known.translated
        ? known.source
        : node.nodeValue.trim();
      if (source) nodes.push({ node, source });
    }

    try {
      const translated = await translateTexts(client, language, nodes.map(({ source }) => source));
      nodes.forEach(({ node, source }, index) => {
        const translatedText = translated[index];
        if (translatedText && translatedText !== source && root.contains(node) && node.nodeValue !== translatedText) {
          translatedNodes.set(node, { source, translated: translatedText });
          node.nodeValue = translatedText;
        }
      });
    } catch (error) {
      console.error('Não foi possível traduzir o conteúdo da tela.', error);
      onError(error instanceof Error ? error.message : 'Falha ao traduzir o conteúdo.');
    } finally {
      isTranslating = false;
      if (shouldTranslateAgain && !disposed) scheduleTranslation();
    }
  };

  const scheduleTranslation = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(translatePage, 80);
  };
  const observer = new MutationObserver(scheduleTranslation);
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  scheduleTranslation();

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    observer.disconnect();
    for (const [node, known] of translatedNodes) {
      if (root.contains(node) && node.nodeValue === known.translated) node.nodeValue = known.source;
    }
  };
}

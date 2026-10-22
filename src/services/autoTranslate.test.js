import { describe, expect, test, vi } from 'vitest';
import { translateTexts } from './autoTranslate';

describe('tradução de textos em lotes', () => {
  test('mantém a ordem da resposta e divide listas grandes em lotes aceitos pelo servidor', async () => {
    const client = {
      functions: {
        invoke: vi.fn(async (_name, { body }) => ({
          data: { translations: body.texts.map((text) => `en:${text}`) },
          error: null
        }))
      }
    };
    const texts = Array.from({ length: 41 }, (_, index) => `auto-translate-test-${index}`);

    const result = await translateTexts(client, 'en', texts);

    expect(result).toEqual(texts.map((text) => `en:${text}`));
    expect(client.functions.invoke).toHaveBeenCalledTimes(2);
  });

  test('expõe explicitamente uma resposta inválida do serviço', async () => {
    const client = {
      functions: {
        invoke: vi.fn(async () => ({
          data: { translations: [] },
          error: null
        }))
      }
    };

    await expect(translateTexts(client, 'fr', ['texto de teste inválido']))
      .rejects.toThrow('O serviço de tradução devolveu uma resposta incompleta.');
  });

  test('reutiliza traduções em memória para evitar solicitações repetidas', async () => {
    const client = {
      functions: {
        invoke: vi.fn(async (_name, { body }) => ({
          data: { translations: body.texts.map((text) => `cached:${text}`) },
          error: null
        }))
      }
    };
    const text = 'cache-test-unique-phrase';

    await translateTexts(client, 'de', [text]);
    const repeated = await translateTexts(client, 'de', [text]);

    expect(repeated).toEqual([`cached:${text}`]);
    expect(client.functions.invoke).toHaveBeenCalledTimes(1);
  });
});

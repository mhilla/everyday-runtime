import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { hasGermanTranslation, translate } from 'src/ui/i18n';

const UI_DIR = join(process.cwd(), 'src/ui');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (name === '__tests__') {
      return [];
    }

    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.tsx?$/.test(name)
        ? [path]
        : [];
  });

// Every literal passed to t('…') in the UI must have a German entry.
const literalKeys = () =>
  sourceFiles(UI_DIR).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)].map((match) => ({
      file,
      key: match[1].replace(/\\'/g, "'"),
    })),
  );

describe('UI translations', () => {
  it('has a German translation for every UI text', () => {
    const keys = literalKeys();
    const missing = keys.filter(({ key }) => !hasGermanTranslation(key));

    expect(keys.length).toBeGreaterThan(80);
    expect(missing).toEqual([]);
  });

  it('interpolates values and falls back to English', () => {
    expect(translate('de', '{name} added to your list', { name: 'Milch' })).toBe('Milch auf die Liste gesetzt');
    expect(translate('en', '{name} added to your list', { name: 'Milk' })).toBe('Milk added to your list');
    expect(translate('de', 'Some untranslated text')).toBe('Some untranslated text');
  });
});

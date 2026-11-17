/**
 * Czech typography: a one-letter preposition or conjunction (k, s, v, z, o, u, a, i)
 * must not be left at the end of a line. Tying it to the following word with a
 * non-breaking space keeps the pair together wherever the text happens to wrap.
 *
 * The copy itself stays plain (ordinary spaces in the locale files); the ties are
 * added when it is loaded, so nobody has to type or preserve invisible characters.
 */
const NBSP = ' ';
const SHORT_WORD = /(^|[\s(„])([ksvzouai]) (?=\S)/gi;

export function tieShortWords(text: string): string {
  // Two passes: in a run such as "a v Praze" the first match consumes the space
  // that introduces the next short word, so that one is only tied the second time.
  return text.replaceAll(SHORT_WORD, `$1$2${NBSP}`).replaceAll(SHORT_WORD, `$1$2${NBSP}`);
}

export function tieShortWordsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return tieShortWords(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => tieShortWordsDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, tieShortWordsDeep(item)]),
    ) as T;
  }
  return value;
}

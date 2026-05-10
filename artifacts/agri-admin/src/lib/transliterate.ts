const BASE_URL = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

const cache = new Map<string, string>();

function isLatinWord(w: string): boolean {
  return /^[a-zA-Z][a-zA-Z'./-]*$/.test(w);
}

export function hasLatinText(value: string): boolean {
  if (!value) return false;
  return value.split(/\s+/).some(isLatinWord);
}

export async function transliterateText(
  text: string,
  lang: "mr" | "hi"
): Promise<string> {
  if (!text || lang === "en") return text;

  const cacheKey = `${lang}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const parts = text.split(/(\s+)/);
  const latinIndices: number[] = [];
  const latinWords: string[] = [];

  parts.forEach((part, i) => {
    if (isLatinWord(part)) {
      latinIndices.push(i);
      latinWords.push(part.toLowerCase());
    }
  });

  if (!latinWords.length) {
    cache.set(cacheKey, text);
    return text;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/transliterate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: latinWords, lang }),
    });

    if (!res.ok) {
      cache.set(cacheKey, text);
      return text;
    }

    const data = (await res.json()) as { results: string[] };
    const results = data.results ?? [];

    const resultParts = [...parts];
    latinIndices.forEach((idx, i) => {
      if (results[i]) resultParts[idx] = results[i];
    });

    const translated = resultParts.join("");
    cache.set(cacheKey, translated);
    return translated;
  } catch {
    cache.set(cacheKey, text);
    return text;
  }
}

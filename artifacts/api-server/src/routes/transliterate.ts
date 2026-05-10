import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ITC: Record<string, string> = {
  mr: "mr-t-i0-und",
  hi: "hi-t-i0-und",
};

async function transliterateWord(word: string, itc: string): Promise<string> {
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${itc}&num=1&ie=utf-8&oe=utf-8`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return word;
  const data = await res.json() as unknown[];
  // Response shape: ["SUCCESS", [[ inputWord, [suggestion, ...], [], {...} ]]]
  const firstResult = (data[1] as Array<Array<string[]>>)?.[0];
  return firstResult?.[1]?.[0] ?? word;
}

router.post("/transliterate", async (req, res) => {
  const { words, lang } = req.body as { words?: string[]; lang?: string };

  if (!Array.isArray(words) || !words.length || !lang) {
    res.status(400).json({ error: "words (array) and lang are required" });
    return;
  }

  const itc = ITC[lang];
  if (!itc) {
    res.status(400).json({ error: `Unsupported lang: ${lang}` });
    return;
  }

  try {
    const results = await Promise.all(
      words.map((w) => transliterateWord(w, itc))
    );
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;

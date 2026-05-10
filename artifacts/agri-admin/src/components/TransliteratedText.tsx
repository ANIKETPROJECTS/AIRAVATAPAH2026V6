import { useState, useEffect, useRef } from "react";
import { transliterateText, hasLatinText } from "@/lib/transliterate";

interface Props {
  value: string;
  lang: "mr" | "hi" | "en";
}

export function TransliteratedText({ value, lang }: Props) {
  const [display, setDisplay] = useState(value);
  const lastKey = useRef("");

  useEffect(() => {
    if (!value) { setDisplay(value); return; }
    if (lang === "en" || !hasLatinText(value)) { setDisplay(value); return; }

    const key = `${lang}:${value}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    let cancelled = false;
    transliterateText(value, lang).then((result) => {
      if (!cancelled) setDisplay(result);
    });
    return () => { cancelled = true; };
  }, [value, lang]);

  return <>{display}</>;
}

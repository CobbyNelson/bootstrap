#!/usr/bin/env python3
"""
Wrap untranslated copy in a translator call, at exactly the sites check-i18n
reports.

    python3 scripts/wrap-i18n.py components/home/hero.tsx ...

Why this can be mechanical at all: check-i18n blanks comments by replacing them
with the SAME NUMBER of spaces, so an index into its cleaned text is also an
index into the real source. This script rebuilds that cleaned text, finds the
same matches, and edits the original at those offsets — so what gets wrapped is
by construction what the check complains about, not an approximation of it.

Whitespace around a text node is preserved verbatim. That is not tidiness: JSX
keeps a space between an expression and an inline element on the same line, and
dropping it silently joins two words. Reproducing the surrounding whitespace
exactly means the rendered output cannot shift.

Replacements are applied right-to-left so that earlier offsets stay valid.
"""
import json
import re
import sys

PROPS = ("title|subtitle|label|description|placeholder|heading|eyebrow|caption|summary|alt|"
         "desc|tag|subject|intro|empty|overall|delta|blurb|note|hint|cta|message|error")


def cleaned_source(src: str) -> str:
    """check-i18n's comment blanking, length-preserving so offsets still map."""
    out = re.sub(r"/\*[\s\S]*?\*/", lambda m: " " * len(m.group(0)), src)
    out = re.sub(r"(^|[^:])//[^\n]*", lambda m: " " * len(m.group(0)), out, flags=re.M)
    return out


ENTITIES = {
    "&amp;": "&", "&apos;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">",
    "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…",
    "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”",
}


def js(text: str) -> str:
    """A JS string literal, with any surrounding space lifted OUT of the call.

    `"New to Assets & Capital? "` carries a trailing space that separates it
    from the link beside it. Left inside the key, that space is invisible in the
    admin editor and the first translator to retype the sentence drops it,
    joining two words in French only. Outside the call it is code, and cannot be
    edited away.
    """
    lead = text[: len(text) - len(text.lstrip(" "))]
    trail = text[len(text.rstrip(" ")) :]
    core = json.dumps(text.strip(), ensure_ascii=False)
    parts = ([json.dumps(lead)] if lead else []) + [f"{{FN}}({core})"] + ([json.dumps(trail)] if trail else [])
    return " + ".join(parts)


def decode_entities(s: str) -> str:
    """Mirror of check-i18n's decoder.

    Decoding is required for correctness, not just for detection: inside a tl()
    call the text is a JavaScript string, where `&apos;` would render as five
    literal characters instead of an apostrophe.
    """
    return re.sub(r"&[a-z]+;", lambda m: ENTITIES.get(m.group(0), m.group(0)), s)


TW = re.compile(
    r"^(bg|text|border|ring|from|to|via|hover|focus|active|group|peer|dark|sm|md|lg|xl|"
    r"p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min|max|flex|grid|col|row|gap|space|"
    r"rounded|shadow|opacity|z|inset|top|bottom|left|right|translate|scale|rotate|"
    r"transition|duration|ease|animate|font|leading|tracking|overflow|cursor|select|"
    r"outline|underline|items|justify|self|place|order|object|fill|stroke)[-:]"
)


def is_copy(s: str) -> bool:
    t = decode_entities(s).strip()
    if any(TW.match(tok) for tok in t.split()):
        return False
    if len(t) < 4:
        return False
    if not re.search(r"[a-z]{2}", t):
        return False
    if re.fullmatch(r"[a-z][a-z0-9-]*", t):
        return False
    if re.fullmatch(r"[a-z]{2,3}_[a-z_]+", t):
        return False
    if re.fullmatch(r"[a-z]+[A-Z][A-Za-z]*", t):
        return False
    if re.match(r"^[#$€£₵]", t) or re.match(r"^\d", t):
        return False
    if re.match(r"^https?:|^/|^@", t):
        return False
    if re.search(r"[;={}()\[\]]|=>|\+\+|&&|\|\|", t):
        return False
    if re.search(r"\b(const|let|return|function|await|async|import|export|typeof)\b", t):
        return False
    if re.fullmatch(r"[&|]\s*[A-Z][A-Za-z]*", t):
        return False
    return bool(re.search(r"\s", t)) or bool(re.match(r"^[A-Z]", t))


def exempt_lines(src: str) -> set:
    out = set()
    for i, line in enumerate(src.split("\n")):
        if "i18n-exempt" in line:
            out.add(i + 1)
            out.add(i + 2)
    return out


def line_of(src: str, idx: int) -> int:
    return src.count("\n", 0, idx) + 1


def wrap(path: str, fn: str) -> int:
    src = open(path, encoding="utf-8").read()
    clean = cleaned_source(src)
    assert len(clean) == len(src), f"{path}: offset map broken"
    skip = exempt_lines(src)
    edits = []

    for m in re.finditer(r">([^<>{}]+)<", clean):
        raw = m.group(1)
        if not is_copy(re.sub(r"\s+", " ", raw)) or line_of(src, m.start()) in skip:
            continue
        # Keep the original padding; only the words move inside the call.
        lead = raw[: len(raw) - len(raw.lstrip())]
        trail = raw[len(raw.rstrip()) :]
        text = decode_entities(re.sub(r"\s+", " ", raw.strip()))
        edits.append((m.start(1), m.end(1), f'{lead}{{' + js(text).replace('{FN}', fn) + '}' + trail))

    # Literals inside a JSX expression: `{saved ? "Saved" : "Save"}`. Each
    # branch is replaced independently, so a half-wrapped ternary
    # (`? tl("x") : "y"`) is completed rather than skipped.
    STR = r'"((?:[^"\\]|\\.){4,}?)"'
    BRANCH = rf"(?:tl\([^)]*\)|t\.tl\([^)]*\)|{STR})"
    for m in re.finditer(rf"\?\s*{BRANCH}\s*:\s*{BRANCH}", clean):
        for gi in (1, 2):
            if m.group(gi) is None:
                continue
            if not is_copy(m.group(gi)) or line_of(src, m.start()) in skip:
                continue
            edits.append((m.start(gi) - 1, m.end(gi) + 1, js(decode_entities(m.group(gi))).replace("{FN}", fn)))

    for m in re.finditer(rf"&&\s*{STR}\s*([)}}])", clean):
        if not is_copy(m.group(1)) or line_of(src, m.start()) in skip:
            continue
        edits.append((m.start(1) - 1, m.end(1) + 1, js(decode_entities(m.group(1))).replace("{FN}", fn)))

    for m in re.finditer(rf'({PROPS})=(\{{?)"([^"]{{4,}})"(\}}?)', clean):
        if not is_copy(m.group(3)) or line_of(src, m.start()) in skip:
            continue
        edits.append((m.start(), m.end(), f'{m.group(1)}={{' + js(decode_entities(m.group(3))).replace('{FN}', fn) + '}'))

    for start, end, text in sorted(edits, reverse=True):
        src = src[:start] + text + src[end:]

    if edits:
        open(path, "w", encoding="utf-8").write(src)
    return len(edits)


if __name__ == "__main__":
    fn = "t.tl" if "--server" in sys.argv else "tl"
    total = 0
    for path in [a for a in sys.argv[1:] if not a.startswith("--")]:
        n = wrap(path, fn)
        total += n
        print(f"  {path}: {n} wrapped")
    print(f"  total: {total}")

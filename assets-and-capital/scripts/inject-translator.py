#!/usr/bin/env python3
"""
Give a component a translator to call, so wrap-i18n has something in scope.

    python3 scripts/inject-translator.py components/auth/login-form.tsx ...

Only client components. Server components need a locale, which has to come from
a route param or a prop, and choosing where that comes from is a judgement about
the component tree that a script should not be making — the prerender has
already been lost three times to a component resolving the locale by itself.

Placement is deliberate: the hook goes into the specific function whose body
contains untranslated copy, not into the first component in the file. Files here
hold several components, and a hook added to the wrong one is either a
rules-of-hooks violation or silently out of scope at the render site.

eslint's react-hooks rules are the check on that decision — run them after.
"""
import json
import re
import subprocess
import sys

IMPORT = 'import { useTl } from "@/components/i18n/locale-provider";'
BIND = "  const tl = useTl();"


def component_spans(src: str):
    """(name, body_start_index, end_index) for each top-level component.

    Finding the body start is the whole difficulty. `function C({` ends in an
    open brace that opens the DESTRUCTURED PROPS, not the body — an earlier
    version bound the hook there and produced `function C({ const tl = ...,
    slug, }`. So brace depth is tracked from the declaration: the body is the
    brace that closes back to depth zero and is followed by nothing.
    """
    lines = src.split("\n")
    spans = []
    pattern = re.compile(
        r"^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w*)\s*[(<]"
        r"|^(?:export\s+)?const\s+([A-Z]\w*)\s*[:=].*=>"
    )
    starts = [(i, m.group(1) or m.group(2)) for i, l in enumerate(lines) if (m := pattern.match(l))]
    for n, (i, name) in enumerate(starts):
        end = starts[n + 1][0] if n + 1 < len(starts) else len(lines)
        depth = 0
        for j in range(i, end):
            code = lines[j]
            for ch in code:
                if ch in "({[":
                    depth += 1
                elif ch in ")}]":
                    depth -= 1
            # The signature is closed and this line opens a block: the body.
            if depth == 1 and code.rstrip().endswith("{"):
                spans.append((name, j + 1, end))
                break
    return spans


def last_import_line(lines) -> int:
    """Index of the line that ENDS the import block.

    A multi-line `import {\\n  A,\\n} from "x"` has its last `import `-prefixed
    line at the TOP of the statement, so inserting after that lands inside the
    braces — which is exactly what happened. Track the statement's end instead.
    """
    last = -1
    depth = 0
    inside = False
    for i, line in enumerate(lines):
        if not inside and line.startswith("import "):
            inside = True
            depth = 0
        if inside:
            depth += line.count("{") - line.count("}")
            if depth == 0:
                last = i
                inside = False
    return last


def inject(path: str, finding_lines: set) -> str:
    src = open(path, encoding="utf-8").read()
    if "useTl" in src:
        return "already has a translator"
    lines = src.split("\n")

    targets = []
    for name, body_start, end in component_spans(src):
        if any(body_start <= ln <= end for ln in finding_lines):
            targets.append((name, body_start))
    if not targets:
        return "no component found containing the copy"

    # Bottom-up so earlier line numbers stay valid.
    for name, body_start in sorted(targets, key=lambda x: -x[1]):
        lines.insert(body_start, BIND)

    # Import goes after the last existing one, keeping the block contiguous.
    lines.insert(last_import_line(lines) + 1, IMPORT)
    open(path, "w", encoding="utf-8").write("\n".join(lines))
    return f"injected into {', '.join(n for n, _ in targets)}"


if __name__ == "__main__":
    findings = json.loads(
        subprocess.run(
            ["npx", "tsx", "scripts/check-i18n.mts", "--json"],
            capture_output=True, text=True, check=True,
        ).stdout
    )
    by_file = {}
    for f in findings:
        by_file.setdefault(f["file"], set()).add(f["line"])

    for path in sys.argv[1:]:
        print(f"  {path}: {inject(path, by_file.get(path, set()))}")

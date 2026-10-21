#!/usr/bin/env python3
"""Build a local preview; never serve, publish, or send feedback."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "/* INLINE_REVIEW_BRIDGE */"


def build(mode, artifact_id):
    fragment = (ROOT / "assets/inline-review.html").read_text(encoding="utf-8")
    bridge = (ROOT / "assets/review-bridge.js").read_text(encoding="utf-8")
    if fragment.count(MARKER) != 1:
        raise ValueError("Expected one bridge insertion point")
    fragment = fragment.replace(MARKER, bridge.replace("</script", r"<\/script"))
    fragment = fragment.replace('sourcePath: ""', "sourcePath: " + json.dumps(artifact_id, ensure_ascii=False).replace("<", r"\u003c"))
    if mode == "codex":
        return fragment
    styles = (ROOT / "assets/portable.css").read_text(encoding="utf-8")
    return "\n".join([
        "<!doctype html>", '<html lang="zh-CN"><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        "<title>Inline UI Review</title>", "<style>" + styles + "</style>",
        "</head><body>", fragment, "</body></html>"
    ])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["codex", "portable"], required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--artifact-id", help="Share-safe relative path or host artifact ID; defaults to filename")
    parser.add_argument("--force", action="store_true", help="Replace a previously generated preview")
    args = parser.parse_args()
    dest = args.out.expanduser().resolve()
    if dest.exists() and not args.force:
        parser.error("Output exists; choose another file or use --force")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(build(args.mode, args.artifact_id or dest.name), encoding="utf-8")
    print(dest)


if __name__ == "__main__":
    main()

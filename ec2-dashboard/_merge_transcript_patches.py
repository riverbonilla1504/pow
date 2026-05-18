#!/usr/bin/env python3
"""Replay transcript tool ops in order: Write resets, StrReplace patches."""
import json
import os
import sys
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\thrif\.cursor\projects\c-Users-thrif-OneDrive-Documentos-duarte"
    r"\agent-transcripts\355c4101-8712-40ab-8879-94665560c8e2"
    r"\355c4101-8712-40ab-8879-94665560c8e2.jsonl"
)
WORKSPACE = Path(r"c:\Users\thrif\OneDrive\Documentos\duarte\pow\ec2-dashboard")
EC2_MARKER = "ec2-dashboard"

files: dict[str, str] = {}
# (line, rel, kind, ...)
ops: list[tuple] = []


def normalize_path(p: str) -> str | None:
    p = p.replace("/", "\\")
    low = p.lower()
    idx = low.find(EC2_MARKER)
    if idx == -1:
        return None
    rel = p[idx + len(EC2_MARKER) :].lstrip("\\/")
    return rel.replace("\\", "/") if rel else None


def main() -> int:
    line_no = 0
    with TRANSCRIPT.open(encoding="utf-8", errors="replace") as f:
        for raw in f:
            line_no += 1
            raw = raw.strip()
            if not raw:
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if row.get("role") != "assistant":
                continue
            message = row.get("message") or {}
            for block in message.get("content") or []:
                if not isinstance(block, dict) or block.get("type") != "tool_use":
                    continue
                name = block.get("name")
                inp = block.get("input") or {}
                path = inp.get("path")
                if not path:
                    continue
                rel = normalize_path(path)
                if not rel:
                    continue
                if name == "Write":
                    c = inp.get("contents")
                    if c is not None:
                        ops.append((line_no, rel, "write", c))
                elif name == "StrReplace":
                    old, new = inp.get("old_string"), inp.get("new_string")
                    if old is not None and new is not None:
                        old = old.replace("\r\n", "\n")
                        new = new.replace("\r\n", "\n")
                        ops.append((line_no, rel, "replace", old, new))

    applied_w = applied_r = failed_r = 0
    failed_list: list[tuple[int, str, str]] = []

    for op in ops:
        line_no, rel = op[0], op[1]
        if op[2] == "write":
            files[rel] = op[3].replace("\r\n", "\n")
            applied_w += 1
        else:
            old, new = op[3], op[4]
            if rel in files:
                files[rel] = files[rel].replace("\r\n", "\n")
            if rel not in files:
                dest = WORKSPACE / rel.replace("/", os.sep)
                if dest.exists():
                    files[rel] = dest.read_text(encoding="utf-8").replace("\r\n", "\n")
                else:
                    failed_list.append((line_no, rel, "no base before replace"))
                    failed_r += 1
                    continue
            if old not in files[rel]:
                failed_list.append((line_no, rel, "old_string not found"))
                failed_r += 1
                continue
            files[rel] = files[rel].replace(old, new, 1)
            applied_r += 1

    skip = {".env.local"}
    written = []
    for rel in sorted(files):
        if rel in skip:
            continue
        if not rel.startswith(("app/", "components/", "lib/")):
            continue
        dest = WORKSPACE / rel.replace("/", os.sep)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(files[rel], encoding="utf-8", newline="\n")
        written.append((rel, len(files[rel])))

    print(f"Replayed {applied_w} Write, {applied_r} StrReplace OK, {failed_r} StrReplace failed")
    print(f"Final file count (app/components/lib): {len(written)}")
    for rel, size in written:
        print(f"  {rel} ({size} bytes)")
    (WORKSPACE / "_merge_report.txt").write_text(
        "\n".join(f"L{ln}\t{rel}\t{reason}" for ln, rel, reason in failed_list),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

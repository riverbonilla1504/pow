#!/usr/bin/env python3
"""Extract latest Write tool contents for ec2-dashboard from agent transcript JSONL."""
import json
import os
import re
import sys
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\thrif\.cursor\projects\c-Users-thrif-OneDrive-Documentos-duarte"
    r"\agent-transcripts\355c4101-8712-40ab-8879-94665560c8e2"
    r"\355c4101-8712-40ab-8879-94665560c8e2.jsonl"
)
WORKSPACE = Path(r"c:\Users\thrif\OneDrive\Documentos\duarte\pow\ec2-dashboard")
EC2_MARKER = "ec2-dashboard"

# path -> (line_index, contents)
writes: dict[str, tuple[int, str]] = {}


def normalize_path(p: str) -> str | None:
    p = p.replace("/", "\\")
    low = p.lower()
    idx = low.find(EC2_MARKER)
    if idx == -1:
        return None
    rel = p[idx + len(EC2_MARKER) :].lstrip("\\/")
    if not rel:
        return None
    return rel.replace("\\", "/")


def process_message(msg: dict, line_no: int) -> None:
    content = msg.get("content") or msg.get("parts")
    if not isinstance(content, list):
        return
    for block in content:
        if not isinstance(block, dict):
            continue
        name = block.get("name") or block.get("type")
        if name != "Write" and block.get("type") != "tool_use":
            continue
        if block.get("name") != "Write" and block.get("type") == "tool_use":
            if block.get("name") != "Write":
                continue
        # tool_use format: name + input
        if block.get("type") == "tool_use":
            tool_name = block.get("name")
            if tool_name != "Write":
                continue
            inp = block.get("input") or {}
        else:
            inp = block.get("input") or block
            if block.get("name") != "Write":
                continue

        path = inp.get("path") or inp.get("file_path")
        contents = inp.get("contents") or inp.get("content")
        if not path or contents is None:
            continue
        rel = normalize_path(path)
        if rel is None:
            continue
        writes[rel] = (line_no, contents)


def main() -> int:
    if not TRANSCRIPT.exists():
        print(f"Transcript not found: {TRANSCRIPT}", file=sys.stderr)
        return 1

    line_no = 0
    with TRANSCRIPT.open(encoding="utf-8", errors="replace") as f:
        for raw in f:
            line_no += 1
            raw = raw.strip()
            if not raw:
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as e:
                print(f"JSON error line {line_no}: {e}", file=sys.stderr)
                continue
            role = row.get("role")
            message = row.get("message") or {}
            if role == "assistant":
                process_message(message, line_no)
            # Some formats nest tool calls differently
            if "tool_use" in str(row):
                content = message.get("content", [])
                for block in content:
                    if isinstance(block, dict) and block.get("name") == "Write":
                        inp = block.get("input") or {}
                        path = inp.get("path")
                        contents = inp.get("contents")
                        if path and contents is not None:
                            rel = normalize_path(path)
                            if rel:
                                writes[rel] = (line_no, contents)

    print(f"Found {len(writes)} unique files from Write operations\n")
    manifest = WORKSPACE / "_recovered_manifest.txt"
    lines_out = []
    for rel in sorted(writes.keys()):
        line_idx, contents = writes[rel]
        dest = WORKSPACE / rel.replace("/", os.sep)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(contents, encoding="utf-8", newline="\n")
        lines_out.append(f"{rel}\tline={line_idx}\tbytes={len(contents.encode('utf-8'))}")
        print(f"  WROTE {rel} (from transcript line {line_idx})")

    manifest.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    print(f"\nManifest: {manifest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

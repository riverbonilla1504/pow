#!/usr/bin/env python3
"""Fix corrupted JSX: close plain <motion.div> with </motion.div> when wrongly </motion.div>."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Stack-based fix per file
def fix_content(text: str) -> str:
    lines = text.splitlines(keepends=True)
    out = []
    stack = []  # list of ('div'|'motion.div', line_idx)

    open_re = re.compile(r'<(motion\.div|div)(\s|>)')
    close_re = re.compile(r'</(motion\.motion\.div|motion\.motion\.motion\.div|motion\.div|div)>')

    for i, line in enumerate(lines):
        pos = 0
        new_line = ''
        while pos < len(line):
            m_open = open_re.search(line, pos)
            m_close = close_re.search(line, pos)
            if m_close and (not m_open or m_close.start() < m_open.start()):
                tag = m_close.group(1)
                if tag == 'motion.div':
                    tag = 'motion.div'
                elif tag in ('motion.motion.div', 'motion.motion.motion.div'):
                    tag = 'motion.div'
                if stack:
                    expected = stack.pop()
                    if expected != tag:
                        # replace close with expected
                        replacement = f'</{expected}>'
                        new_line += line[pos:m_close.start()] + replacement
                        pos = m_close.end()
                        continue
                new_line += line[pos:m_close.end()]
                pos = m_close.end()
            elif m_open:
                kind = m_open.group(1)
                stack.append(kind)
                new_line += line[pos:m_open.end()]
                pos = m_open.end()
            else:
                new_line += line[pos:]
                break
        if pos < len(line) and not new_line:
            new_line = line
        elif pos < len(line):
            new_line += line[pos:]
        out.append(new_line if new_line else line)
    return ''.join(out)

def main():
    for path in ROOT.rglob('*.tsx'):
        if 'node_modules' in path.parts or 'scripts' in path.parts:
            continue
        text = path.read_text(encoding='utf-8')
        fixed = fix_content(text)
        if fixed != text:
            path.write_text(fixed, encoding='utf-8')
            print('fixed', path.relative_to(ROOT))

if __name__ == '__main__':
    main()

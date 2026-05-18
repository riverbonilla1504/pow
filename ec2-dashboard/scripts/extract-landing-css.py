from pathlib import Path

g = Path(__file__).resolve().parents[1] / "app" / "globals.css"
lines = g.read_text(encoding="utf-8").splitlines()
start, end = 372, 1525
chunk = lines[start:end]
landing = Path(__file__).resolve().parents[1] / "app" / "landing.css"
landing.write_text("@layer components {\n" + "\n".join(chunk) + "\n}\n", encoding="utf-8")
new_globals = lines[:start] + ["@import \"./landing.css\";", ""] + lines[end:]
g.write_text("\n".join(new_globals) + "\n", encoding="utf-8")
print("landing.css lines", len(chunk))
print("globals.css lines", len(new_globals))

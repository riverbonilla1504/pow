from pathlib import Path

p = Path(__file__).resolve().parents[1] / "app" / "(user)" / "page.tsx"
lines = p.read_text(encoding="utf-8").splitlines()
lines[79] = "                </motion.div>"
lines[79] = "                </div>"
lines[82] = "          </motion.div>"
lines[82] = "          </div>"
lines[83] = "        </motion.div>"
lines[83] = "        </div>"
# Only keep last assignment - rewrite cleanly
lines[79] = "                </div>"
lines[82] = "          </div>"
lines[83] = "        </div>"
p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("ok")

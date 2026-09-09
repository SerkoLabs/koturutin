#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

required = [
    "AGENTS.md",
    "docs/AI_DEVELOPMENT_PLAYBOOK.md",
    "docs/PROJECT_STATUS.md",
    "docs/MODEL_ROUTING.md",
    "docs/DECISIONS.md",
    "templates/README.template.md",
    "templates/PRODUCT_SPEC.template.md",
    "templates/USER_FLOWS.template.md",
    "templates/ARCHITECTURE.template.md",
    "templates/DATABASE.template.md",
    "templates/IMPLEMENTATION_PLAN.template.md",
    "templates/AI_RUN_LOG.template.md",
    ".github/copilot-instructions.md",
    ".claude/skills/phase-orchestration/SKILL.md",
    ".claude/skills/quality-audit/SKILL.md",
]

errors = []
for rel in required:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing: {rel}")
    elif path.is_file() and not path.read_text(encoding="utf-8").strip():
        errors.append(f"Empty: {rel}")

agents = ROOT / ".github" / "agents"
if not agents.exists() or len(list(agents.glob("*.agent.md"))) < 5:
    errors.append("Expected at least five GitHub custom agent profiles.")

skills = ROOT / ".claude" / "skills"
if not skills.exists() or len(list(skills.glob("*/SKILL.md"))) < 8:
    errors.append("Expected at least eight reusable skills.")

agents_text = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
ordered = [
    "01. IDEA",
    "02. README.md",
    "03. docs/PRODUCT_SPEC.md",
    "04. docs/USER_FLOWS.md",
    "05. docs/ARCHITECTURE.md",
    "06. docs/DATABASE.md",
    "07. docs/IMPLEMENTATION_PLAN.md",
]
last = -1
for marker in ordered:
    idx = agents_text.find(marker)
    if idx < 0:
        errors.append(f"Lifecycle marker missing: {marker}")
    elif idx <= last:
        errors.append(f"Lifecycle order invalid near: {marker}")
    last = idx

if errors:
    print("PLAYBOOK VALIDATION: FAIL")
    for e in errors:
        print(f"- {e}")
    sys.exit(1)

print("PLAYBOOK VALIDATION: PASS")
print(f"- GitHub agents: {len(list(agents.glob('*.agent.md')))}")
print(f"- Skills: {len(list(skills.glob('*/SKILL.md')))}")

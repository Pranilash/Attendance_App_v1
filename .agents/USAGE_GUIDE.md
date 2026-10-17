# Enterprise AI Engineering Suite: Master Usage Guide

This guide defines the standard operating procedure for AI-assisted engineering using this toolkit. It combines **`codebase-memory-mcp`**, **`pstack`**, **`ponytail`**, **`thermo-nuclear-review`**, **`trailofbits-security`**, **`addyosmani-skills`**, **`asd-ste100`**, and **`archify`** into a unified, privacy-safe development workflow.

---

## 1. Security & Privacy Model

This suite operates under strict enterprise compliance constraints:

- **100% Local Execution**: All tools, parsers, and linters run on your local machine.
- **Zero Data Violations**: No source code, credentials, or telemetry leave your local environment.
- **Fail-Closed Verification**: Code is never marked "complete" without concrete runtime evidence.
- **Deterministic Runtimes**: Standard Python 3, Node.js (v18+), and precompiled static binaries.

---

## 2. Fast Office Device Setup (Under 3 Minutes)

Follow these steps to deploy this toolkit on your office PC.

### Step 1: Install Prerequisites
Ensure the target machine has the standard toolchains installed:
- **Git** (`git --version`)
- **Node.js v18+** with `npx` (`node --version`)
- **Python 3.8+** (`python --version`)

### Step 2: Clone or Copy the `.agents` Directory
Place the `.agents/` folder into your project root or workspace:

```bash
# Option A: If hosted in your private GitHub repo
git clone https://github.com/<your-username>/<your-agent-repo>.git .agents

# Option B: Copying the folder directly via USB / secure drive
cp -r /path/to/source/.agents ./
```

### Step 3: Platform Verification
Verify local runtimes execute cleanly:

```bash
# Verify the STE prose linter
python .agents/skills/asd-ste100/scripts/ste-lint.py --selftest

# Verify the interactive diagram renderer
node .agents/skills/archify/bin/archify.mjs doctor

# Verify the codebase graph MCP server
npx.cmd -y codebase-memory-mcp --version   # Windows
npx -y codebase-memory-mcp --version       # macOS / Linux
```

> **Note for macOS / Linux Users**:
> If migrating from Windows, open `.agents/plugins/codebase-memory-mcp/mcp_config.json` and change `"command": "cmd.exe", "args": ["/c", "npx", "-y", ...]` to `"command": "npx", "args": ["-y", ...]`.

---

## 3. Toolkit Architecture & Responsibilities

| Layer | Primary Tool | Core Responsibility | Key Command / Trigger |
| :--- | :--- | :--- | :--- |
| **Intelligence** | `codebase-memory-mcp` | AST knowledge graph, cross-file call traces (~120x token reduction) | `search_graph`, `trace_path`, `detect_changes` |
| **Orchestration** | `pstack` | 23 engineering playbooks, TDD, subagents, and principles | `/poteto-mode`, `/how`, `/why`, `/architect` |
| **Code Minimalism** | `ponytail` | Enforces YAGNI and the 6-step decision ladder; smallest working diff | `/ponytail`, "be lazy", "minimal diff" |
| **Structural Health** | `thermo-nuclear-review` | Code judo, 1,000-line file cap, eliminates ad-hoc spaghetti flags | `/thermo-nuclear-code-quality-review` |
| **Security Auditing** | `trailofbits-security` | Risk-first differential review, blast radius, patch validation | `/differential-review`, `/post-patch-validation` |
| **Engineering Rigor** | `addyosmani-skills` | Doubt-driven development, anti-rationalization, boundary validation | `/doubt-driven-development`, `/security-and-hardening` |
| **Clarity & Specs** | `asd-ste100` | Simplified Technical English, concise prompts, unambiguous PRs | `/asd-ste100`, `ste-lint.py` |
| **Visual Architecture**| `archify` | Generates standalone interactive HTML/SVG diagrams | `/archify`, `node bin/archify.mjs render` |

---

## 4. The 5 Core Engineering Playbooks

### Playbook A: Production Bug Fix (Repro -> Minimal Fix -> Verify)

1. **Ingest Raw Context**: Supply literal logs, stack traces, and request payloads.
2. **Token-Efficient Discovery**:
   - Run `search_graph(name_pattern="...")` to locate candidate symbols without reading files.
   - Run `trace_path(source="entrypoint", target="failing_function")` to observe the call path.
3. **Reproduction Test**:
   - Write a minimal failing test or script (`repro`).
   - Run the test and capture the failure output.
4. **Apply Ponytail & Root-Cause Fix**:
   - Grep all callers of the function.
   - Fix the root cause at the owning boundary.
   - Apply the shortest working diff. Reject ad-hoc boolean flags.
5. **Runtime Verification**:
   - Re-run the reproduction test. Confirm it passes with runtime evidence.
6. **Debloat & Security Gate**:
   - Run `/deslop` and `/no-comments`.
   - Run `/differential-review`.

---

### Playbook B: Feature Development (Spec -> Design -> TDD)

1. **Behavioral Specification**:
   - Apply `asd-ste100` to define inputs, state transitions, and expected outputs.
   - Keep sentences under 20 words.
2. **Interface & Contract Design (`/architect`)**:
   - Settle type signatures, interfaces, and module placement before writing implementation.
   - Model the domain explicitly (use enums or state machines, not stringly-typed values).
3. **Visual Architecture (`/archify`)**:
   - If the feature touches 3+ services or modules, generate a visual diagram:
     ```text
     /archify diagram the architecture of <feature> showing component connections and data flow.
     ```
4. **Test-Driven Implementation (`/tdd`)**:
   - Write the unit test first. Run it to confirm failure.
   - Implement the minimal code to satisfy the test.
   - Refactor for clarity.

---

### Playbook C: Refactoring & Code Quality Audit

1. **Pre-Check File Metrics**:
   - Identify files approaching 1,000 lines.
2. **Execute Thermonuclear Review**:
   - Run `/thermo-nuclear-code-quality-review`.
   - Search for **"Code Judo"** opportunities: restructurings that eliminate whole layers or helpers.
   - Remove dead code, pass-through wrappers, and redundant type conversions.
3. **Verify Behavior Preservation**:
   - Run test suite before and after. Verify zero functional drift.

---

### Playbook D: Pre-Merge Security Audit

1. **Calculate Blast Radius**:
   - Run `codebase-memory-mcp` `detect_changes` on the Git diff.
   - Identify all upstream callers affected by modified symbols.
2. **Run Differential Review (`/differential-review`)**:
   - Audit auth gates, input sanitization, cryptography, and value transfers.
   - Refute insecure defaults: prove that configuration fallbacks cannot fail open.
3. **Secret & Sensitive Data Scan**:
   - Verify no API keys, tokens, `.env` values, or PII exist in the diff.

---

### Playbook E: Architecture Documentation & PR Packaging

1. **Generate PR Summary (`/asd-ste100`)**:
   - Format description using Simplified Technical English:
     - No marketing adjectives ("blazing-fast", "robust").
     - No soft phrasal verbs ("spin up" -> "start").
     - Concise, active sentences.
2. **Attach Visual Diagrams (`/archify`)**:
   - Generate an interactive HTML sequence or architecture diagram and attach it to the PR.

---

## 5. Anti-Rationalization Contract

AI agents frequently attempt to rationalize incomplete work. When reviewing agent output, enforce these non-negotiables:

| Agent Rationalization | Why It Is Rejected | Required Action |
| :--- | :--- | :--- |
| *"The change is small, so tests are unnecessary."* | Heartbleed was two lines of code. | Write a test verifying the change. |
| *"It compiles and the build succeeds."* | Compilation proves syntax, not behavior. | Present CLI stdout or test runner logs. |
| *"I added a boolean flag for backward compatibility."* | Flags cause spaghetti branching. | Refactor using domain modeling or polymorphic dispatch. |
| *"I'll clean up the comments and dead code in a follow-up PR."* | Deferred cleanup becomes technical debt. | Run `/deslop` and `/no-comments` immediately. |
| *"This edge case will not occur in production."* | Production traffic hits every branch. | Add an explicit assertion or boundary guard. |

---

## 6. Copy-Paste Prompt Templates

### Template 1: Production Bugfix with Proof
```markdown
/poteto-mode
Target: Fix production bug with minimal diff and runtime proof.

1. CONTEXT:
<PASTE ERROR LOGS OR STACK TRACE>

2. INSTRUCTIONS:
- Use codebase-memory-mcp search_graph and trace_path to inspect callers.
- Apply ponytail (level: full): write the shortest working diff.
- Apply doubt-driven-development: prove before and after behavior with real execution.
- Debloat with /no-comments before presenting.
```

### Template 2: Pre-Merge Security & Quality Gate
```markdown
/differential-review
Audit the current git diff:
1. Threat Boundaries: Does this diff expose internal state, change auth gates, or alter permissions?
2. Blast Radius: Count all upstream callers affected by modified symbols.
3. Insecure Defaults: Flag any permissive fallbacks or unauthenticated endpoints.
4. Thermonuclear Quality: Flag any file exceeding 1,000 lines or adding ad-hoc conditionals.
```

### Template 3: Interactive Architecture Visualizer
```markdown
/archify
Generate an interactive architecture diagram:
- Subject: <SYSTEM OR SUBSYSTEM NAME>
- Components: <LIST KEY SERVICES / MODULES>
- Relationships: <DATA FLOW AND CALL SEQUENCES>
- Output: Save as standalone HTML with live motion enabled.
```

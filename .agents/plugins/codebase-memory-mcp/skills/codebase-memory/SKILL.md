---
name: codebase-memory
description: "Use codebase-memory-mcp knowledge graph tools to understand codebases, trace calls, find symbols, and analyze architecture with ~120x fewer tokens. Triggers: index codebase, search graph, trace call path, architecture overview, codebase memory, call hierarchy, impact analysis."
---

# Codebase Memory MCP Skill

`codebase-memory-mcp` indexes the codebase into an on-device structural knowledge graph (powered by Tree-sitter across 162 languages and SQLite). Instead of reading files line-by-line or grepping raw text, use the graph tools first to minimize token usage and avoid blowing context limits.

## Decision Ladder: Graph Tools vs. Raw Files

1. **Locating Symbols & Definitions**: Use `search_graph(name_pattern="...")` or `search_graph(semantic_query="...")` rather than grep or searching files.
2. **Understanding Call Chains & Architecture**: Use `trace_path(source="funcA", target="funcB")` and `get_architecture()` rather than manually reading callers and callee files.
3. **Reading Exact Implementations**: Use `get_code_snippet(symbol="...")` or targeted line ranges instead of loading whole multi-thousand-line files into context.
4. **Impact of Changes**: Use `detect_changes()` on git diffs to map modified symbols to their upstream dependencies and risk score.

## Available MCP Tools

- `search_graph`: Find symbols by regex name or semantic vector query across 162 languages.
- `trace_path` / `trace_call_path`: Discover the exact call path from a caller to a target function.
- `get_architecture`: System structure overview, route mappings, fan-in hotspots, and circular dependencies.
- `get_code_snippet`: Retrieve code only for a specific symbol without reading the entire file.
- `query_graph`: Execute Cypher queries (e.g., `MATCH (f:Function)-[:CALLS]->(g) ...`).
- `detect_changes`: Map current git diffs to impacted symbols and risk levels.
- `manage_adr`: Create and read Architecture Decision Records persisted alongside code.
- `check_index_coverage`: Verify coverage and identify any files skipped during parsing.

# RuleScope rules (non-negotiable)

1. Evidence first: every finding cites file:line AND comes from a rulescope tool result (find_candidates, find_cross_repo_links, git_context, coverage_map) or a simulate_change run. If you cannot prove it, list it under "open questions", never as a fact.
2. Never modify application source code in the analyzed repositories without explicit user approval. Simulations only run in temporary worktrees via simulate_change.
3. Always list what was checked and found NOT affected (e.g. look-alike constants that belong to another feature), to show there are no false alarms.
4. Always report contradictions with existing rules as open questions for the right team (product, risk, legal, compliance), with the exact evidence.
5. If consumers may exist outside the analyzed repositories, say so explicitly: "unknown external consumers — verify with other teams".
6. Plain, concise English. The developer must understand the brief in 2 minutes.
7. Never copy secrets or personal data values (emails, IBANs, phone numbers, passwords, tokens) into the brief: cite file:line and mask the value.
8. Never analyze node_modules/, dist/, build/ or coverage/ folders: they are generated code and waste time and Bobcoins.
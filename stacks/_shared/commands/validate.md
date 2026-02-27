# /validate — Run Full Validation

Read quality gates from `.claude/config/active-project.json` and run all:

```bash
# Read stack commands
cat .claude/config/active-project.json | jq '.qualityGates'
```

Then execute each gate in order. Report pass/fail for each.

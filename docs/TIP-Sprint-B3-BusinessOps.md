# TIP-Sprint-B3 — Business Operations + Deploy

**Sprint**: B3 | **Effort**: ~40h | **Timeline**: 1 tuần (2026-03-09 → 2026-03-16)
**Status**: IN PROGRESS — B3.1 DONE (schema + seed SQL created)

## Review Adjustments Applied (6 items)
- **A**: `bom_parts` FK verified — TEXT type (not UUID)
- **B**: finance_summary VIEW rewritten with CTE (fix cartesian product)
- **C**: 15 tabs → scrollable tab bar + group separators
- **D**: Orders import → group-by-order_number dedup logic
- **E**: 3 TypeScript transformers explicit in B3.6
- **F**: Deploy manual steps documented

## Additional Finding During Implementation
- **FK type mismatch**: `projects.id` and `suppliers.id` are TEXT, not UUID. All FK columns adjusted in migration 009.

## Task Status

| Task | Status | Notes |
|------|--------|-------|
| B3.1: Schema + Seed | DONE | `009_business_operations.sql` + `010_business_seed_data.sql` |
| B3.2: Service Layer | TODO | 4 service files |
| B3.3: React Hooks | TODO | 4 hook files |
| B3.4: UI Modules | TODO | 4 new tab components |
| B3.5: Import Pipeline | TODO | 4 new import types |
| B3.6: Intelligence | TODO | 7 rules + 3 transformers |
| B3.7: Dashboard | TODO | Business Overview section |
| B3.8: Vercel Deploy | TODO | Manual steps required |

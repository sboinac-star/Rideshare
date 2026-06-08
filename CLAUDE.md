@AGENTS.md

# Deployment Rules — MUST FOLLOW, NO EXCEPTIONS

## Branch Strategy
```
feature branch (e.g. shaker-work)
        ↓
     staging  →  https://nwa-rideshare-git-staging-sboinac.vercel.app
        ↓  (only after confirmation)
      main   →  https://nwa-rideshare.vercel.app  (production)
```

## Rules

1. **NEVER merge directly to `main`** — all code must go to `staging` first
2. **NEVER push to production** without explicit user confirmation
3. Before any merge to `main`, the following must be completed:
   - ✅ All tests passing (`npm run test:coverage`)
   - ✅ Code deployed and verified on staging URL
   - ✅ Manual testing done on staging
   - ✅ User has explicitly said "approved" or "merge to main" or "deploy to production"
4. When work is done on a feature branch, merge to `staging` — not `main`
5. Ask the user to test on staging and confirm before touching `main`

## Environments

| Environment | Branch | URL |
|---|---|---|
| Production | `main` | `nwa-rideshare.vercel.app` |
| Staging | `staging` | `nwa-rideshare-git-staging-sboinac.vercel.app` |
| Development | feature branches | local only |

## Merge Checklist (before merging staging → main)
- [ ] All 165+ tests passing
- [ ] Staging URL manually tested by the team
- [ ] No console errors on staging
- [ ] Firebase rules deployed if changed
- [ ] User has given explicit go-ahead

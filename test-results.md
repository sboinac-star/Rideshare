# Test Results

**Date:** 2026-06-08  
**Commit:** 9e0e2e6  
**Branch:** feat/post-ride-nudge  
**Runner:** Vitest v4.1.6 + v8 coverage

## Summary

| Metric       | Result |
|---|---|
| Test Files   | 12 passed (12) |
| Tests        | **165 passed (165)** |
| Duration     | 14.71s |

## Coverage

| File                        | Statements | Branches | Functions | Lines | Uncovered Lines |
|-----------------------------|-----------|----------|-----------|-------|-----------------|
| **All files**               | 78.53%    | 79.43%   | 84.61%    | 80.31% | |
| features/chat/ChatModal.tsx | 93.65%    | 84.78%   | 93.33%    | 98.30% | 56 |
| features/chat/JourneyContact.tsx | 93.75% | 100%  | 80%       | 93.33% | 59 |
| features/listings/WatchlistingButton.tsx | 100% | 90% | 100%  | 100%  | 52 |
| lib/autoComplete.ts         | 0%        | 0%       | 0%        | 0%    | 6–71 (cron — runs server-side only) |
| lib/chat.ts                 | 93.75%    | 83.33%   | 90%       | 93.75% | 106 |
| lib/utils.ts                | 75.55%    | 82.50%   | 72.72%    | 75.67% | 33–38, 108–110 |

## Coverage Totals

| Metric     | Covered | Total | % |
|---|---|---|---|
| Statements | 161     | 205   | **78.53%** |
| Branches   | 112     | 141   | **79.43%** |
| Functions  | 44      | 52    | **84.61%** |
| Lines      | 151     | 188   | **80.31%** |

## Notes

- `autoComplete.ts` has 0% coverage — it's a server-side cron job; unit tests would require Firebase Admin mocks. Functional testing done via manual cron endpoint call.
- All 165 tests passing cleanly with no warnings.

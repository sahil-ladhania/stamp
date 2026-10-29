# 09 Self-check

- 20 questions. Answer each aloud, then open the answer. Aim for 16 of 20.
- Every answer names the file in this set that explains it.

## Questions

### Q1. In what order does `POST /api/runs` check things, and which requests never reach the daily cap?
<details><summary>Answer</summary>

- JSON parse (16 KB), rate limit, shape check, slug, cached guide, joinable run, daily cap, lock insert.
- Cached and joined requests return before the cap check. See `03a-api-start-run.md`.
</details>

### Q2. Two visitors search "Notion" at the same moment. What happens?
<details><summary>Answer</summary>

- Both try to insert a run with `activeSlug = notion`. The unique index lets one win.
- The loser re-reads the lock and gets 202 `running` with the same runId. See `04a-run-state.md`.
</details>

### Q3. A visitor closes the tab during stage 4. What happens to the run?
<details><summary>Answer</summary>

- Nothing. The run is detached; only that stream aborts and its heartbeat timer stops.
- The guide still saves and the lock frees. See `04b-run-stream-bus.md`.
</details>

### Q4. The API restarts mid-run. What does a user see, and for how long?
<details><summary>Answer</summary>

- A snapshot saying running, then no events. The stream re-reads the row every 2 s.
- Three minutes after the run started it is failed with `INTERNAL`. New requests join the dead run until then.
</details>

### Q5. Why did the Gmail guide cite a Contact Center AI page and call it official?
<details><summary>Answer</summary>

- Resolve set the official domain to `google.com`. A tier only asks if the host is under that domain.
- Keywords have no product filter, the quote existed, and no retry fired. See `08b-trust-real-cases.md`.
</details>

### Q6. Why does the browser show no duplicate trace rows after a reconnect?
<details><summary>Answer</summary>

- Every connect replays the run from event 0, starting with `run.snapshot`.
- The page empties its event list on each snapshot. See `04b-run-stream-bus.md`.
</details>

### Q7. Which stages call a model, which tier, and why?
<details><summary>Answer</summary>

- Plan uses the fast tier to write search strings that code checks.
- Extract uses the strong tier to read messy pages and quote exactly. See `05c-nodes-fetch-extract-verify.md`.
</details>

### Q8. Is Stamp a workflow or an autonomous agent? Give two proofs.
<details><summary>Answer</summary>

- A workflow. Nodes and edges are fixed in code, and routers use only state and the clock.
- Models return checked JSON with no tools, and the only loop is a bounded retry. See `05a-agent-graph.md`.
</details>

### Q9. State every condition for the retry edge.
<details><summary>Answer</summary>

- No failure, `missingSections` not empty, `retryCount` below 1, and at least 45 s left.
- `missingSections` means `steps` or `scopes` has no Sourced or Tested claim.
</details>

### Q10. The time budget ends before extract starts. What is the outcome?
<details><summary>Answer</summary>

- The router skips to score, since no drafts exist, then save.
- Save finds no Sourced claim and fails `INTERNAL`: "The run stopped at Save". See `05d-nodes-probe-score-save.md`.
</details>

### Q11. What does a Sourced label prove, and what does it not?
<details><summary>Answer</summary>

- It proves the quote (10+ chars) appears word for word in the cited page text Stamp holds.
- It does not prove the text follows from it, the page fits the product, or the page is current.
</details>

### Q12. Which downgrade reasons does the real agent emit?
<details><summary>Answer</summary>

- Only `quote_not_found` and `sources_disagree`. `stale_source` is never used.
- `schema_failed` and `time_budget` become unknown-claim texts, not events. See `06a-evidence.md`.
</details>

### Q13. Which claims stay Uncertain even when the quote is found?
<details><summary>Answer</summary>

- Time estimates: step effort and all four milestone claims, with no event sent.
- Also both sides of a confirmed conflict.
</details>

### Q14. What does Tested mean, and how is it reached?
<details><summary>Answer</summary>

- A Sourced claim quotes an official authorize URL; the probe gets a client rejection or login redirect.
- The endpoint rejects a fake client. The claim is not proven. See `05d-nodes-probe-score-save.md`.
</details>

### Q15. How is a source tier decided, and what can it not tell you?
<details><summary>Answer</summary>

- Code compares the URL host to the official domain. Forum hosts and subdomains win over official.
- It cannot tell which product a page covers, or how new it is.
</details>

### Q16. Name the three unknown texts and when each is used.
<details><summary>Answer</summary>

- "Not found in the fetched sources." for an unknown section or an empty part.
- "Could not be read reliably..." for a failed section.
- "Not researched before the time budget ran out." for a section that never ran or was unverified.
</details>

### Q17. Gate "required to scale", wait 10 days, 3 prerequisites, 1 hidden limit. What is the score?
<details><summary>Answer</summary>

- Gate 2, wait 2 (10 days is under 28), prerequisites 2 (capped), limit 1. Total 7 gives score 4.
- See `06b-unknowns-difficulty.md`.
</details>

### Q18. A guide shows review gate 0 and approval wait 2. What does that tell you?
<details><summary>Answer</summary>

- The gate is unknown. A verified `none` gate would force the wait to 0.
- The wait is unknown or 8 to 28 days, so the score is a lower bound.
</details>

### Q19. How do library and live guides differ on `force`, expiry and overwrite?
<details><summary>Answer</summary>

- Library: `force` returns cached, it never expires, and a live save is refused.
- Live: fresh 7 days; `force` or expiry starts a run; the save replaces the row. See `07-data-model.md`.
</details>

### Q20. How can a run finish in about 23 s after reading only 4 of 6 pages?
<details><summary>Answer</summary>

- The first pass reads 4 pages. Pages 5 and 6 come only on a retry.
- One Sourced step and one Sourced scope skip the retry, so the stages sum to about 24 s. See `08b-trust-real-cases.md`.
</details>

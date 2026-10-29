# Golden set

Hand-researched answers for 10 apps, taken from official docs only. The eval harness scores guides against these files.

- Tuning set (6): gmail, microsoft, hubspot, github, slack, notion. Used while fixing.
- Holdout set (4): zoom, dropbox, asana, calendly. Run once at the end. Never tune on it.
- Researched on 2026-10-29. Provider docs change, so every fact carries its URL and a verbatim quote.

## File format

| Field                | Holds                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `product`            | The product the guide must describe, with a source                                                                                                                       |
| `docs`               | Official domains and path hints for that product, and optional `urlAliases` for a page the agent sees under an old URL that redirects to a golden page (checked by hand) |
| `oauthAppCreation`   | Where a developer creates the OAuth app                                                                                                                                  |
| `reviewGate`         | `value` in the code's vocabulary (`none`, `optional_listing`, `required_to_scale`, `security_assessment`, `partner_vetting`), `alsoAccept`, `trigger`                    |
| `approvalWait`       | `kind` (`range`, `none`, `unknown`), days, the wording the provider uses, how the days were derived                                                                      |
| `testBeforeApproval` | Whether a developer can test first, and how                                                                                                                              |
| `scopes`             | 3 to 6 real names, a `namePattern` for what a real scope looks like, `knownFake` names seen in earlier runs                                                              |
| `blockers`           | 2 or more known blockers, each with `kind` (`approval`, `setup`, `limit`) and `keywords` for relevance checks                                                            |
| `avoidProducts`      | Sibling products to reject: `hard` counts as a wrong-product source, `soft` is flagged for a manual look                                                                 |
| `notes`              | Judgment calls for the reviewer                                                                                                                                          |

Rule for every field: at most 2 accepted values, the primary plus one alternate (`alsoAccept` holds at most one gate, `alsoValid` at most one wait).

`confidence` is `high` for an explicit official statement, `medium` when the statement needs interpretation, `low` for absence of evidence or a qualitative figure.

## What was checked

- Every `{url, quote}` pair was fetched live and the quote found on the page, ignoring whitespace (148 of 148).
- This proves the quote exists on that page. It does not prove the quote supports the claim next to it. That is the part to review by hand.
- Notion has no scope strings, so its `scopes` hold capability names.
- Dropbox scope names come from Dropbox's own API spec repository because the dropbox.com scope reference needs script to render.

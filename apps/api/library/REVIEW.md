# Library review sheet

Source run: `apps/api/evals/runs/2026-10-29T18-54-14Z` (the Stage 5 tuning run, git-ignored). Every file here is that run's guide with `mode` set to `library`; the exporter changed nothing else.

**Status: not reviewed by hand yet.** The code check (`pnpm --filter api db:seed -- --dry-run`) proves structure only: the guide parses, has full coverage, every Sourced claim stands on an official page, and every scope name passes the scope rules. The quote check ran when the run saved each guide. Only a person can check that a claim says what its quote says. For each claim below, open the source, find the quote, and tick the box.

**The review gate and approval wait need your eye most.** They set the difficulty number (HubSpot 5, Slack 3), and the guide stores only their points, not their evidence; the evidence is in the run file and is listed below. Both golden answers agree with the values, but the quote kept for each is about the listing review in general and does not itself say "required to scale" or "optional". Confirm that the page supports the value. If it does not, the number is not earned, and that guide should say Not rated.

Held out until a re-run after the 1 Nov credit reset (they fail the check): **Gmail** (22 Sourced claims with no official source, on a personal blog) and **Microsoft** (the scope `/.default`). See `docs/library-plan.md`.


## GitHub

- As of 2026-10-29. Archetype `unknown` (shown as Not rated). Points: review gate 0, approval wait 2, prerequisites 0, hidden limits 1.
- Against the golden answers (the run's scorecard): review gate unknown; approval wait unknown.

Only Sourced claims are listed: an Uncertain claim says it is not verified.

| Check | Claim | Label | Source and quote | Confirmed |
| --- | --- | --- | --- | --- |
| Top blocker | Organization members cannot authorize an OAuth app to access organization resources without owner approval when access restrictions are enabled. | sourced | https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization<br>“When OAuth app access restrictions are enabled, organization members and outside collaborators must request approval from an organization owner before they can authorize an OAuth app that h…” | [ ] |
| Scope `repo` | The repo scope grants full access to public and private repositories, including read and write access to code, commit statuses, repository invitation… | sourced | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps<br>“\| repo \| Grants full access to public and private repositories including read and write access to code, commit statuses, repository invitations, collaborators, deployment statuses, and repo…” | [ ] |
| Scope `repo:status` | The repo:status scope grants read and write access to commit statuses in public and private repositories, without granting access to the code. | sourced | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps<br>“\| repo:status \| Grants read/write access to commit statuses in public and private repositories. This scope is only necessary to grant other users or services access to private repository co…” | [ ] |
| First step | The developer must register their application on GitHub to obtain a unique Client ID and Client Secret. | sourced | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app<br>“First, you'll need to register your application. Every registered OAuth app is assigned a unique Client ID and Client Secret.” | [ ] |

## HubSpot

- As of 2026-10-29. Archetype `hidden_limits`, difficulty 5 of 5. Points: review gate 2, approval wait 3, prerequisites 2, hidden limits 1.
- Against the golden answers (the run's scorecard): review gate `required_to_scale`, matches the golden answer; approval wait 1 to 60 days, matches.

Only Sourced claims are listed: an Uncertain claim says it is not verified.

| Check | Claim | Label | Source and quote | Confirmed |
| --- | --- | --- | --- | --- |
| Review gate `required_to_scale` (evidence is in the run file, not in the guide) | App listing submissions are manually reviewed by the HubSpot Ecosystem Quality team and will be rejected if they do not meet the criteria outlined below. | official | https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements | [ ] |
| Approval wait 1 to 60 days (evidence is in the run file, not in the guide) | Once you submit your listing, the HubSpot Ecosystem Quality team will complete an initial review within 10 business days. If any of the information provided is incorrect, misleading, or incomplete, we’ll contact you with that feedback. The entire app review a… | official | https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements | [ ] |
| Top blocker | The app installation fails if a conditionally required scope is included in the install URL and the user does not have access to the associated featu… | sourced | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/scopes<br>“If a conditionally required scope is present in your app install URL and a user without access to the associated feature attempts to install your app using that URL, the installation will f…” | [ ] |
| First requirement | Users installing apps in their HubSpot account must either be a Super Admin or have HubSpot Marketplace Access permissions. | sourced | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth<br>“Users installing apps in their HubSpot account must either be a Super Admin or have HubSpot Marketplace Access permissions.” | [ ] |
| Scope `crm.objects.contacts.read` | The crm.objects.contacts.read scope allows an app to view all contacts in the user's HubSpot account, regardless of the user's own contact permission… | sourced | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth<br>“if a user has permissions to view only owned contacts but authorizes a request for the crm.objects.contacts.read scope, the resulting access token can view all contacts in the account and n…” | [ ] |
| Scope `crm.objects.contacts.write` | The crm.objects.contacts.write scope allows an app to create contacts in the user's HubSpot account. | sourced | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/overview<br>“For example, if your app required access to create contacts, you’d need to include the crm.objects.contacts.write.” | [ ] |
| First step | The developer must create a new app in HubSpot to begin the OAuth setup process. | sourced | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth<br>“Create a new app. After creating the app, you’ll be able to find the app’s client ID and client secret on the Auth page of your app settings.” | [ ] |

## Notion

- As of 2026-10-29. Archetype `unknown` (shown as Not rated). Points: review gate 0, approval wait 2, prerequisites 0, hidden limits 1.
- Against the golden answers (the run's scorecard): review gate unknown; approval wait unknown.

Only Sourced claims are listed: an Uncertain claim says it is not verified.

| Check | Claim | Label | Source and quote | Confirmed |
| --- | --- | --- | --- | --- |
| Verdict summary | Setting up OAuth for Notion involves several clear steps, including creating a public connection in the Developer portal, configuring redirect URIs a… | sourced | https://developers.notion.com/guides/get-started/authorization<br>“Navigate to the Developer portal and create a new public connection. Fill out the form with your connection details, including your redirect URI(s) under the OAuth configuration section and…” | [ ] |
| First step | The developer must navigate to the Notion Developer portal and create a new public connection, filling out the connection details including redirect… | sourced | https://developers.notion.com/guides/get-started/authorization<br>“Navigate to the Developer portal and create a new public connection. Fill out the form with your connection details, including your redirect URI(s) under the OAuth configuration section and…” | [ ] |

## Slack

- As of 2026-10-29. Archetype `hidden_limits`, difficulty 3 of 5. Points: review gate 1, approval wait 2, prerequisites 1, hidden limits 1.
- Against the golden answers (the run's scorecard): review gate `optional_listing`, matches the golden answer; approval wait unknown.

Only Sourced claims are listed: an Uncertain claim says it is not verified.

| Check | Claim | Label | Source and quote | Confirmed |
| --- | --- | --- | --- | --- |
| Review gate `optional_listing` (evidence is in the run file, not in the guide) | In the early phases of your app building process, you should know the timeline for listing your app in the Slack Marketplace, as well as the review process. You can see the estimated turnaround time for reviews when you go to the submission page in your app s… | official | https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide | [ ] |
| Verdict summary | Setting up OAuth for Slack involves several steps, including requesting scopes, waiting for user approval, and exchanging a temporary authorization c… | sourced | https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide<br>“Additionally, any updates you make in your app that may be affected by your Slack app configuration (such as scope changes or updated redirect URIs) will not work until you have submitted a…” | [ ] |
| Top blocker | If you update your app’s install link to add new scopes that were not previously reviewed, your app will show customers an error and they will not be… | sourced | https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide<br>“if you update your app’s install link to add new scopes that were not previously reviewed, your app will show customers an error and they will not be able to install it.” | [ ] |
| First requirement | You must create a Slack app and install it to your development workspace before building an app with the @slack/oauth package. | sourced | https://docs.slack.dev/tools/node-slack-sdk/oauth<br>“Before building an app, you'll need to create a Slack app and install it to your development workspace.” | [ ] |
| Scope `channels:read` | The channels:read scope allows an app to read channel information in a Slack workspace. | sourced | https://docs.slack.dev/tools/node-slack-sdk/oauth<br>“scopes: ['channels:read'],” | [ ] |
| First step | The developer must create a Slack app and install it to their development workspace. | sourced | https://docs.slack.dev/tools/node-slack-sdk/oauth<br>“Before building an app, you'll need to create a Slack app and install it to your development workspace.” | [ ] |

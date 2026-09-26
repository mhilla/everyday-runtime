# Outreach texts

Ready-to-post texts for the maintainer. Nothing here is posted automatically.
Post each one yourself, only where self-promotion is allowed (check the
community's rules first), answer replies personally, and do not ask for stars.
Keep the claims as they are — they are all verifiable in the repository.

---

## 1. GitHub / social announcement

> I built **Everyday Runtime**, an open-source, self-hosted shopping assistant.
> Instead of pretending to know your exact stock, it estimates what your household
> probably needs — “Milk: probably low · 89% · last bought 6 days ago, usually every
> ~5 days” — and shows why. Deterministic rules, no AI service, data stays on your
> own server (it runs as a Twenty app). v0.2 learns from quantities and from your
> “still have it / it’s empty” corrections.
>
> It’s early and I’m **looking for real-world feedback**: does setup work, do the
> suggestions make sense for your household?
> https://github.com/micha16372/everyday-runtime

---

## 2. Reddit — r/selfhosted

**Title:** Everyday Runtime – a self-hosted shopping list that estimates what you probably need (and explains why)

> Hi r/selfhosted,
>
> I've been working on a small open-source project and would like honest feedback
> from people who actually run things at home.
>
> **What it is:** a shopping assistant that runs as an app on a self-hosted
> [Twenty](https://twenty.com) server (Docker). You record whatever you happen to
> know — bought, used some, empty, still have it — and it estimates what is probably
> needed, with a percentage and a reason. It never claims an exact stock count.
>
> **What it isn’t:** not an inventory scanner, no cloud, no AI API, no telemetry.
> The engine is deterministic TypeScript with unit tests.
>
> **State:** v0.2.0, MIT, early. Setup is `git clone`, `yarn install`,
> `yarn twenty docker:start`, `yarn twenty apply`; a demo household takes one click
> ([DEMO.md](https://github.com/micha16372/everyday-runtime/blob/main/DEMO.md)).
>
> **What I'm looking for:** real-world feedback — where setup breaks, which
> suggestions feel wrong, what would make it useful weekly.
>
> Repo: https://github.com/micha16372/everyday-runtime

---

## 3. Home Assistant community (Share your Projects)

**Title:** Everyday Runtime — explainable “probably needed” shopping estimates, looking for feedback before building an HA integration

> Hi all,
>
> I maintain a small self-hosted project that estimates which household items are
> probably running low (from purchases, “empty” / “still have it” reports and
> quantities) and explains each estimate. It runs on a self-hosted Twenty server and
> already exposes the result as JSON (`GET /s/needs`, authenticated).
>
> A Home Assistant integration is on the roadmap (sensors per product, an “add to
> list” service), but nothing exists yet. Before I build it, I'd like to know:
>
> - Would sensors like “milk: probably low, 89%” be useful to you, or rather a
>   to-do list entity?
> - Which triggers would you want (e.g. notify when leaving work)?
>
> It's early (v0.2.0) and I'm **looking for real-world feedback**.
> https://github.com/micha16372/everyday-runtime

---

## 4. Twenty community

**Title:** Built with the Twenty app SDK: Everyday Runtime (self-hosted shopping assistant)

> Hi Twenty team and community,
>
> I built an open-source app on `twenty-sdk` 2.42: four custom objects, one
> full-page front component and a logic-function route. It's a household shopping
> assistant — a bit outside the CRM use case, which made it a good test of the app
> platform.
>
> Things I learned that might help other app authors (details in
> [ARCHITECTURE.md](https://github.com/micha16372/everyday-runtime/blob/main/docs/ARCHITECTURE.md)):
> `type` is a reserved field name, boolean ARIA attributes need string values in
> front components, `scrollTop` is a no-op so I re-key the scroll container, and the
> widget wrapper carries `aria-disabled="true"`
> ([#12](https://github.com/micha16372/everyday-runtime/issues/12)).
>
> Feedback on how I used the SDK is very welcome — and I'm **looking for real-world
> feedback** from anyone who tries it.
> https://github.com/micha16372/everyday-runtime

---

## 5. Request for beta testers

> **Looking for 3–5 households to test Everyday Runtime for two weeks**
>
> Everyday Runtime is an open-source shopping assistant that estimates what you
> probably need to buy and explains why. It runs on your own computer or server —
> your data stays with you.
>
> What you'd do:
> 1. Install it with the [three-minute guide](https://github.com/micha16372/everyday-runtime/blob/main/DEMO.md) (needs Docker).
> 2. For two weeks, tap “bought”, “empty” or “still have it” when you notice
>    something — no need to be complete.
> 3. Tell me in [this discussion](https://github.com/micha16372/everyday-runtime/discussions/19)
>    or via the “Suggestion felt wrong” issue template what worked and what didn't.
>
> Please don't share personal details publicly. I'll read everything and credit
> changes that come from your feedback in the release notes (if you want).

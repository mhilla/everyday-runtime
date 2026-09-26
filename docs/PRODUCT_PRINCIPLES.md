# Product principles

These principles decide trade-offs. When a feature request conflicts with one of
them, the principle wins unless we deliberately change it here.

## 1. Probably, not exactly

The app never claims to know a stock level. It estimates how likely something is
needed and says so in plain words: *“Probably low”*, *“Possibly getting low”*,
*“Not enough data yet”*. Percentages are whole numbers — anything more precise
would suggest an accuracy we do not have.

## 2. Every guess has a reason

Every suggestion shows a one-line reason and a “Why?” with the full explanation.
If we cannot explain a rule to a user in one sentence, it does not belong in the
engine.

## 3. Facts and estimates look different

What someone reported (“empty”, “still have it”, “bought”) is labelled
**Confirmed**. What the engine inferred is labelled **Estimate** and drawn with a
striped meter. Items on the list show whether a person added them or the app
suggested them.

## 4. Partial information is normal

Nobody logs everything. The app must be useful with a receipt here and a “we're
out of coffee” there. Missing data lowers confidence; it never produces a
confident wrong answer.

## 5. One tap to correct

Being wrong is fine if fixing it is effortless. “Still have it” and “It’s empty”
are always one tap away, and a dismissed suggestion stays quiet until something
new happens.

## 6. Deterministic and local

The core works without AI services, accounts or network access beyond the
household's own server. Same observations + same moment = same result. AI may one
day help with input (receipts, voice), never as a black box for the decision.

## 7. Few buttons, big buttons

A consumer app, not a CRM: large tap targets (≥ 44 px), short labels, calm colors,
works on a phone in a supermarket aisle and in dark mode, usable with a keyboard
and a screen reader.

## 8. Empty states teach

An empty screen explains what to do next and offers the demo household. A new
developer or household should see the whole workflow within minutes.

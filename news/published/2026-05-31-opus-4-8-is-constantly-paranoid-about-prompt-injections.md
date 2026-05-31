---
type: news
title: Opus 4.8 is constantly paranoid about prompt injections, keeps re-reading files, and goes in silently thinking and wasting tokens mode - major regression
audience: advanced
topics:
  - field-report
  - prompt-injection
  - workflow
  - debugging
  - model-behavior
editor_confidence: high
internal: false
authored: 2026-05-31
last_reviewed: 2026-05-31
external_link: https://www.reddit.com/r/ClaudeCode/comments/1tshu54/opus_48_is_constantly_paranoid_about_prompt/
deeper_link: null
ai_summary: This post documents a real-world issue with Opus 4.8 where the model repeatedly suspects prompt injections and redundantly re-reads files, causing wasted tokens and workflow disruption. The author investigates and finds the cause was a false alarm due to misreading tool outputs, providing a useful lesson on diagnosing and handling such model behavior regressions.
source: r/ClaudeCode
fingerprint: c06bac552956c03f
---

This post documents a real-world issue with Opus 4.8 where the model repeatedly suspects prompt injections and redundantly re-reads files, causing wasted tokens and workflow disruption. The author investigates and finds the cause was a false alarm due to misreading tool outputs, providing a useful lesson on diagnosing and handling such model behavior regressions.

> Source: [r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/comments/1tshu54/opus_48_is_constantly_paranoid_about_prompt/)

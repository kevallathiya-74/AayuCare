---
name: caveman
description: Enable token-efficient response compression to reduce response size and token usage using terse, technical prose.
---

# Caveman Mode Skill

This skill integrates the Caveman output compression mode into the agent workflow.

## Usage

- **Activate**: Trigger Caveman mode by typing `/caveman` in supported chat interfaces or telling the agent "talk like caveman."
- **Deactivate**: Revert to normal mode by telling the agent "normal mode."
- **Check Stats**: Run `/caveman-stats` or `caveman-stats` CLI command to review token and cost savings.

## Principles

1. **Terse Technical Prose**: Strip away filler words, pleasantries, and hedging.
2. **Auto-Clarity**: Revert to full sentences for critical warnings, database schema mutations, or security-sensitive actions.

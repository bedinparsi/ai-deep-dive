# Checkout Service — Agent Guide

This is the retail checkout service. It calculates carts, discounts, and refunds.

## Money
- Money is ALWAYS integer cents (`number`), never floating-point dollars.
  A $12.00 item is `1200`. Never write `price * 0.85`; compute discounts in cents
  and round with `Math.round`.

## Logging
- Use the shared `logger` from `./logger`. Never use `console.log` in service code.

## Commands
- Test: `npm test`
- Typecheck: `npm run typecheck`

<!--
Ratchet log (why each rule exists — every line traces to a real incident):
- 2026-02: float discount shipped a 1-cent refund error → "integer cents" rule.
- 2026-03: console.log broke log aggregation in prod → "use logger" rule.
Keep this file under ~60 lines. Everything else goes in progressively-disclosed docs.
-->

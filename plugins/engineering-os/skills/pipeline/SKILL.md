---
name: pipeline
description: Compatibility name for the Engineering OS guide. Use when an older prompt asks to run the pipeline, advance a stage, or report pipeline status.
---

<!-- v5.1.0 · next stage now continues from recorded evidence instead of restarting. -->

# Compatibility forwarder

Immediately use the `engineering-os` skill for this request. Do not run a separate
legacy workflow.

The forwarded request uses the same questions, route floors, configuration
validation, previews, evidence requirements, provider-independence rules, and
`process-stop` behavior as the canonical skill.

Preserve the user's requested mode:

- `pipeline status` becomes Engineering OS `status` and stays read-only;
- `run the pipeline` becomes Engineering OS `start` for the named change;
- `next stage` becomes Engineering OS `continue` for the named change;
- old-process conversion becomes Engineering OS `migration`.

If the canonical skill is unavailable, stop with `engineering-os skill missing;
reinstall or update the engineering-os plugin`. Never reconstruct the old stages from
memory.

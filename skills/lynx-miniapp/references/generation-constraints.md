# Shared Generation Constraints

Read these constraints when generating or adapting a Lynx-rendered Douyin miniapp page. Consumer workflows own design intake, build commands, execution tools, and delivery policy.

## Page scrolling

The root page scroll container must be `scroll-view` with `height: 100%`. Do not assume document-level scrolling. Horizontal tracks use one direct Flex-row child with explicit track width; see `css_diff.md`.

## Text wrapping

Raw miniapp text inside `view` or `label` does not require a `text` wrapper for Lynx compatibility. Do not report it as a compatibility defect by itself.

## Layout output

Generate Flexbox or Grid. Do not generate `display: linear`, `linear-*`, `display: relative`, or `relative-*`. Recognize these values in legacy input and map touched layout to the Web-baseline primitives using `css_support/layout.md` and `css_diff.md`.

## Business contracts

Preserve existing field names, event contracts, dataset keys, and state transitions. A rendering adaptation is not authority to change business behavior or data sources. Never retain unsupported constructs silently: implement a semantics-preserving alternative or report the limitation to the consumer workflow.

Preserve the target's content roles as well as its layout. A requested product image remains an `image` with the project image source or a declared source binding; a colored `view` or text label cannot replace it without authorization. When an asset is missing, keep the image slot and report the missing asset without claiming visual verification.

## Evidence and execution

Use `verification-evidence.md` for evidence boundaries and `interaction_failure_diagnosis.md` for causal diagnosis. The consuming workflow selects its executor, design input, fallback policy, and approval boundary. This resource does not require a particular IDE, browser, device tool, or preview command.

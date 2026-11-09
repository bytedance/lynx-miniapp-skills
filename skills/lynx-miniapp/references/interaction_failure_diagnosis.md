# Interaction Failure Diagnosis

Use this workflow when an interaction target is visible but does not receive
the expected event, or when the same interaction behaves differently between
the IDE and a target device. This document owns environment-neutral causal
diagnosis. The consumer workflow owns gesture execution and any concrete
simulator, browser, native runtime, or real-device tooling.

## Evidence Scope

Keep one result per environment and platform. An IDE pass does not invalidate
an Android or iOS failure, and a screenshot does not prove event delivery.
Diagnose against evidence from the failing environment. Use successful
environments only to narrow candidates.

Record:

- artifact/build identity, route, query, render type, platform, and device or
  IDE identity;
- target description, bounding rectangle, visibility, and event binding;
- computed positioning and layer-relevant values such as `position`,
  `z-index`, clipping, and scroll-container ancestry;
- tap coordinates and the actual node returned by runtime hit testing when
  that capability exists;
- whether the expected callback, route, or state change occurred.

If the failing environment cannot expose the required runtime evidence, give
candidate causes and exact verification steps, but keep the result
`unverified`. Do not promote IDE evidence to real-device proof.

## Evidence Levels

Use these confidence levels without skipping stages:

1. `static-risk`: source or generated output matches a known risky structure.
2. `runtime-observed`: the failing runtime shows the target is not receiving
   the event or is not the hit-tested node.
3. `experiment-supported`: one controlled change restores the hit target and
   expected callback in the failing environment.
4. `causal-confirmed`: reverting the change reproduces the failure and
   reapplying it restores the behavior in the same environment.

A hit test that returns an ancestor or sibling proves only that the intended
target is not winning event hit testing. It does not identify which CSS rule,
node, or renderer behavior caused the loss.

## Controlled Experiments

Change one variable at a time and retain the baseline evidence. For a visible
but untappable layered element, choose the smallest experiment that directly
tests the strongest runtime-supported cause. Relevant experiments can adjust:

- the effective stacking relationship at the target, competing node, or
  relevant ancestor;
- the overlapping node actually returned by hit testing;
- positioning, clipping, or container ancestry when evidence implicates that
  boundary.

Test `pointer-events`, clipping, or a suspected sibling only when runtime
evidence makes it a candidate. A no-effect mutation lowers that candidate; it
does not prove an unrelated cause. Never state that `z-index`,
`pointer-events`, a sibling, or a structural change cannot solve the problem
unless that exact mutation was tested against the same artifact, route,
platform, and UI state.

## Repair Recommendation Selection

Recommend the smallest evidence-backed change that directly addresses the
observed cause. Rank candidates by causal fit, change surface, and regression
risk. A general compatibility-risk pattern does not outweigh direct runtime
evidence from the failing environment.

Escalate to a structural change only after smaller same-environment experiments
fail, or when runtime evidence shows that a positioning, clipping,
stacking-context, or container boundary prevents those smaller changes from
affecting the result. Do not impose one fixed repair sequence across unrelated
cases, and do not reject an untested smaller candidate as ineffective.

For example, moving a fixed element outside a scroll container is a structural
fallback, not a default response to the presence of that source pattern.

Decision examples:

- If an overlapping sibling wins hit testing and changing the target's
  effective stacking relationship restores the declared result, recommend the
  local layering repair.
- If a target cannot escape a lower ancestor stacking context, repair the
  relevant ancestor or context boundary rather than repeatedly changing only
  the target.
- If smaller same-environment experiments fail, or runtime evidence identifies
  positioning, clipping, or container ancestry as a blocking boundary,
  recommend the smallest structural change that removes that boundary.
- If only static structure matches a general compatibility risk, keep that risk
  as a candidate instead of using it to justify immediate restructuring.

Prefer an A/B/A receipt when practical:

```text
失败基线 → 单变量修改后成功 → 回退后再次失败
```

## Causal Reporting

If changing one effective-layering variable restores both hit testing and the
declared result, report insufficient effective stacking order as
`experiment-supported`. If reverting that change reproduces the failure and
reapplying it restores the result in the same environment, raise the confidence
to `causal-confirmed`. Treat any untested property, node structure, positioning
mode, scroll-container relationship, or renderer behavior as a candidate factor
rather than a confirmed cause.

Report environment-scoped results, the highest supported confidence level,
the evidence that changed the conclusion, eliminated candidates, remaining
candidates, and the next verification step. Do not turn a compatibility
recommendation into a confirmed root cause.

All user-facing natural-language output follows `compatibility-model.md`. For
example:

```text
IDE：通过

失败环境：
- 基线：目标可见，但命中测试没有返回目标节点，声明结果未发生。
- 单变量实验：只修改一个与有效层级相关的候选变量。
- 修改后：目标命中和声明结果均恢复。
- 回退后：问题复现；重新应用后再次恢复。

结论：失败环境中的有效层级不足已获得同环境 A/B/A 因果证据。未单独
实验的具体属性、节点结构和渲染器行为仍属于候选因素。
```

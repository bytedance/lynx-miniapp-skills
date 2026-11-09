# WebView-to-Lynx Migration Precheck and Verification

Use this reference only when an existing Douyin miniapp WebView-rendered page or project is assessed before migration to Lynx rendering, or verified after migration changes. It defines the migration-precheck and migration-verification workflow and report contract. It does not duplicate component, API, framework, third-party framework, or CSS facts; route concrete findings through the existing diff references.

## Contents

- [Scope](#scope)
- [Core Principles](#core-principles)
- [Inputs](#inputs)
- [Deterministic Native Scan](#deterministic-native-scan)
- [Project Type Identification and Build Safety](#project-type-identification-and-build-safety)
- [Status, Evidence, Capability, and Risk Labels](#status-evidence-capability-and-risk-labels)
- [Compiled-Output Audit Contract](#compiled-output-audit-contract)
- [Page-Level Checklist Contract](#page-level-checklist-contract)
- [Whole-Miniapp Assessment Contract](#whole-miniapp-assessment-contract)
- [Unsupported Capability Output](#unsupported-capability-output)
- [Precheck Workflow](#precheck-workflow)
- [Migration Verify Workflow](#migration-verify-workflow)
- [Durable Skill Boundary](#durable-skill-boundary)

## Scope

Applicable:

- Native Douyin miniapp pages migrating from WebView rendering to Lynx rendering.
- Taro / uni-app projects targeting Douyin miniapp Lynx rendering.
- Repository-level or page-level migration feasibility, risk, and migration verification.

Not applicable:

- Lynx React / Lynx Web migrations.
- New Lynx miniapp page generation.
- Generated Lynx miniapp page verification without a WebView migration context.
- Device debugging, profiling, DevTool log triage, or full Lynx support matrices.
- Broad descriptions of unused capabilities.

## Core Principles

1. The source repository is the migration target. Generated miniapp output is evidence, not the durable edit target.
2. Migration precheck is build-first: discover a safe Douyin miniapp build path, generate or refresh output, then audit the output. If a safe build cannot be established, stop with `blocked` and ask for the missing context instead of producing a final checklist from guesses.
3. Existing generated output is fallback evidence only when the user explicitly asks for a rough scan, or when no build is required because native miniapp source is the artifact. Such results are not final migration precheck conclusions.
4. The checklist is page-scoped and usage-driven. List only capabilities actually used by each page; do not output a full support matrix.
5. Unsupported capabilities are option-only by default: explain impact, options, and confirmation needs; do not force a fallback.
6. Public/shared components, styles, API wrappers, and third-party libraries must be traced to affected pages.

## Inputs

The minimum input is a repository path. The agent or tool must start discovery from that path before asking for optional inputs.

| Input | Required | Use |
| --- | --- | --- |
| Repository path | Yes | Discover project type, pages, source, output, and build command candidates |
| Page path / route | No | Limit scan scope and report precise page status |
| Business scenario | No | Judge whether a capability is on the critical path |
| Build command | No | User override for the discovered safe build command |
| Output path | No | User override when the discovered output path is wrong |

When a needed build, output, target page, or source mapping cannot be established safely, stop and report `blocked` with the exact missing context.

## Deterministic Native Scan

For native miniapp source-as-artifact, run the bundled scanner before semantic review:

```bash
node <skill_root>/scripts/precheck_scan.mjs <miniapp-project-root> [--page <registered-route>]
```

The script has no external dependencies and reads only regular files beneath the supplied real project directory. It rejects a symlink project root, symlink path components, symlink files, and escaping routes instead of following them. Its JSON records registered pages, app/page `renderType`, page file presence, direct `usingComponents`, and lexical component/API/framework/TTSS signals. Consume those observations as review leads, then inspect reachable custom components and judge each relevant signal through the bundled references.

The scanner does not build the project, recursively prove component reachability, execute Lynx, inspect visual or interaction behavior, or decide compatibility. Never convert an empty observation list into a compatibility pass. If the script cannot parse required configuration or the requested page is unregistered, treat the scan as blocked and report the exact error.

## Project Type Identification and Build Safety

Identify the project shape before judging risk. Keep this table in the report when it helps explain the assessment boundary:

| 识别项 | 项目类型 | 典型信号 | 构建 / 产物规则 |
| --- | --- | --- | --- |
| 原生抖音小程序 | Native miniapp | `app.json`, `project.config.json`, `pages/**/*.ttml`, `pages/**/*.ttss` | 源码即产物；直接扫描页面 `.ttml` / `.ttss` / `.js` / `.json` |
| Taro | Taro | `@tarojs/*`, `config/index.*`, `src/app.config.*` | 发现安全的抖音构建命令，如 `build:tt` / `build:toutiao`；审查 `dist/tt` / `dist/toutiao` |
| uni-app | uni-app | `@dcloudio/*`, `pages.json`, `manifest.json`, `.vue` pages | 发现安全的抖音构建命令，如 `build:mp-toutiao`；审查 `dist/dev/mp-toutiao` 或 `dist/build/mp-toutiao` |
| 未知 / 混合项目 | Unknown / mixed | 只有通用 `package.json` 或多个互斥构建入口 | 输出 `⛔ 阻塞（blocked）`；请求目标平台、构建命令或产物路径后再判断风险 |

A build is safe to run only when all are true:

- The command is unambiguous for Douyin miniapp output, or the user explicitly provided it.
- The command does not require publishing, login, QR preview, network-only setup, destructive cleanup, or credentialed side effects.
- Required local dependencies already exist, or the user has explicitly allowed installation/network setup.
- The output path can be discovered or verified after the command runs.

When a Taro or uni-app project lacks a repository path, safe build command, platform target confirmation, or generated output:
- Output `状态：⛔ 阻塞（blocked）` (Status: `blocked`).
- State explicitly that targeting `抖音小程序（Douyin miniapp）` requires confirming the target platform, a safe `构建命令（build command）`, and the `构建产物 / 生成产物（generated output）` path.
- Stop before auditing. Do not invent a final page risk checklist from source guesses while the build gate is blocked.

## Status, Evidence, Capability, and Risk Labels

Use Simplified Chinese for all user-facing natural language. Keep stable English
codes only in machine-readable fields when they are required for comparison or
follow-up verification; do not add English parenthetical prose to the displayed
report by default.

### 页面状态

| 标识 | 状态 | 机器状态 | 含义 |
| --- | --- | --- | --- |
| 🟢 | 已评估 | `prechecked` | 已基于当前可用产物完成页面级 precheck |
| 🟡 | 暂定 | `provisional` | 用户明确接受粗扫，或只有部分证据；不能作为最终 precheck 结论 |
| ⛔ | 阻塞 | `blocked` | 构建、产物、页面、源码映射或上下文不足，无法可靠评估 |
| 🟣 | 保留 WebView | `keep_webview` | 当前核心能力不适合迁移，或迁移会改变关键语义 |

### 证据等级

| 标识 | 证据等级 | 机器标签 | 含义 |
| --- | --- | --- | --- |
| ✅ | 确认 | `Confirmed` | 已扫描新生成产物，或原生小程序源码即产物，并能给出文件级位置 |
| 🔗 | 已映射源码 | `Source-mapped` | 产物命中项已映射回源码；可与 `✅ 确认` 或 `🟡 暂定` 组合 |
| 🟡 | 暂定 | `Provisional` | 用户明确要求源码 / 旧产物粗扫，或只有部分证据；不是最终 precheck 结论 |
| ⛔ | 阻塞 | `Blocked` | 构建安全、产物发现、源码映射或目标页面阻塞可靠评估 |

Examples:

- `✅ 确认（Confirmed）`
- `✅ 确认 + 🔗 已映射源码（Confirmed + Source-mapped）`
- `🟡 暂定 + 🔗 已映射源码（Provisional + Source-mapped）`
- `⛔ 阻塞（Blocked）`

### 能力状态

| 标识 | 支持情况 | 机器标签 | 判断规则 | 报告动作 |
| --- | --- | --- | --- | --- |
| ✅ | 支持 | `supported` | 与 WebView 渲染抖音小程序行为一致，或未被 diff 标记为差异 | 保留；必要时列为低风险确认项 |
| 🔁 | 有差异 | `diff` | 支持但行为、默认值、边界或配置方式不同 | 写明差异和迁移动作 |
| ⚠️ | 部分支持 | `partial` | 只有部分值、平台或场景可用 | 写明条件、限制和验证点 |
| 🚫 | 不支持 | `unsupported` | 不可用、无效果、被编译剥离或 diff 明确标记不支持 | 给出影响、替代方案、保留 WebView / PoC 等选项 |
| ❓ | 信息不足 | `unknown` | 当前产物、源码映射或业务路径不足以确认 | 标为阻塞或暂定，不编造成支持 / 不支持结论 |

### 风险等级

| 标识 | 风险等级 | 机器标签 | 定义 |
| --- | --- | --- | --- |
| 🔴 | 高风险 | `High` | 核心页面链路依赖不支持的组件、API、生命周期或框架行为，且没有明确等价迁移路径 |
| 🟠 | 较高风险 | `Elevated` | 关键视觉或交互依赖不支持 / 静默失效的 CSS/TTSS，需要结构性重写 |
| 🟡 | 中风险 | `Medium` | 有迁移路径，但需要源码重构、滚动模型调整、JS 状态改造、三方 patch 评估或重新构建验证 |
| 🟢 | 低风险 | `Low` | 局部配置、样式或组件属性调整即可完成，核心链路不受影响 |
| ⚪ | 信息不足 | `Insufficient information` | 关键文件、构建产物、源码映射或业务场景缺失 |

Raise risk when the hit is on payment, order submission, login, core rendering, critical interaction, or a shared module used by many pages. Lower risk only when the alternative is local, mechanical, and verified in the generated output.

Do not raise risk only because a migration task requires adding or moving `renderType: "lynx"`. `renderType` placement is normally a low-risk configuration migration when the intended scope is clear. It becomes `Blocked` or a verification failure only when the intended page/app scope is ambiguous, the generated output omits it, it is emitted in the wrong scope, or source changes do not reach the generated page JSON.

Do not mark `createIntersectionObserver`, `IntersectionObserver`, `createSelectorQuery`, `select`, or `boundingClientRect` as high risk solely because they are layout, visibility, or measurement APIs. Route the concrete API through `api_diff.md`: unsupported forms such as `SelectorQuery.selectViewport` or `NodesRef.fields.computedStyle` are findings, while supported explicit-node geometry queries are migration/verification points. Escalate to High only when the page core path depends on an unsupported form or on WebView-specific semantics with no equivalent migration path; otherwise use Medium for source restructuring or regenerated-output verification.

For capabilities explicitly marked `🚫 unsupported` in the bundled references, do not ask whether they are supported again. Report them as unsupported with location, impact, risk, options, and any business/technical choice needed for handling the impact. Skeleton screens targeting Lynx pages and `removeSkeleton` are such framework findings per `framework_diff.md`.

## Compiled-Output Audit Contract

When generated output exists, audit the page artifact rather than framework source syntax:

1. Start from the target page JSON, then traverse `usingComponents` to build the page/component closure.
2. Scan only source-owned output by default. Skip plugin URLs, output outside the compiled root, and vendor paths such as `node-modules` unless a vendor assessment is requested.
3. Scan page/app JSON, TTML, TTSS, and JS. Route concrete hits through:
   - `component_diff.md` for components, attributes, events, and behavior.
   - `api_diff.md` for `tt.*`, Canvas, selector, media query, and animation APIs.
   - `framework_diff.md` for `renderType`, lifecycle, page scrolling, SJS, skeleton, and config.
   - `css_diff.md` and `css_support/` for TTSS/CSS.
   - `third_party_framework_diff.md` for Taro / uni-app, then back to the four core diffs against generated output.
4. CSS/TTSS scanner rules must be derived from `css_diff.md` and `css_support/`; do not maintain an independent hard-coded support table inside the scanner. Report the rule source or rule-bundle digest when a scanner provides it.
5. Map every generated-output finding back to source when possible. For Taro / uni-app, the recommended action must target JSX/TSX/Vue SFC/template/style/config/plugin source, not `dist/`.
6. Keep source-owned and vendor findings separate. Vendor findings should classify the action as local wrapper, patch candidate, risky patch, replacement/blocker, or user-confirmed waiver.

A scanner may expose this contract as JSON/Markdown evidence, but the skill behavior remains the same when the scan is performed manually.

## Page-Level Checklist Contract

Start every precheck report with the project/build boundary and page summary table. Keep capability detail inside each page. Do not replace this structure with prose-only risk commentary or a generic validation checklist.

### Project and Build Summary

| 项目类型 | 页面范围 | 构建命令 / 产物规则 | 产物路径 | 证据状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| uni-app | `pages/category/index` | `pnpm build:mp-toutiao` | `dist/dev/mp-toutiao` | ✅ 确认 + 🔗 已映射源码 | 构建成功后扫描产物 |

If the project is blocked before audit, use the same table with `⛔ 阻塞（Blocked）` and then the unblock table below.

### Page Summary

| 页面 | 状态 | 风险 | 证据 | 主要发现 | 建议动作 |
| --- | --- | --- | --- | --- | --- |
| `pages/category/index` | 🟢 已评估（prechecked） | 🟡 中风险（Medium） | ✅ 确认 + 🔗 已映射源码 | `@media`、三方组件样式差异 | 在源码中改造样式后重新构建并 verify |

For each page, output only non-empty categories:

### Page Conclusion

Each page detail must include this conclusion table before findings:

| 字段 | 值 |
| --- | --- |
| 状态 | 🟢 已评估（prechecked） / 🟡 暂定（provisional） / ⛔ 阻塞（blocked） / 🟣 保留 WebView（keep_webview） |
| 风险 | 🔴 高风险 / 🟠 较高风险 / 🟡 中风险 / 🟢 低风险 / ⚪ 信息不足 |
| 证据 | ✅ 确认 / 🔗 已映射源码 / 🟡 暂定 / ⛔ 阻塞 |
| 建议动作 | 直接迁移 / 源码适配 / PoC 验证 / 保留 WebView / 补齐阻塞输入 |
| 主要风险 | 页面范围内的关键风险摘要 |

### Findings

Then output one findings table, or grouped non-empty findings tables, with the exact columns below. `表格类型` is the capability category: Component, API, Framework, CSS/TTSS, or Third-party.

| 表格类型 | 状态 | 能力 | 源码位置 | 产物位置 | 支持情况 | 风险 | 可选方案 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSS/TTSS | 待改造 | `@media` | `src/pages/category/index.vue:42` | `dist/dev/mp-toutiao/pages/category/index.ttss:12` | 🚫 不支持（unsupported） | 🟠 较高风险（Elevated） | 改为运行时 class / 条件样式；改后重新构建并 verify |
| Framework | 可直接配置 | `renderType: "lynx"` | `src/pages.json` | `dist/dev/mp-toutiao/pages/category/index.json` | 🔁 有差异（diff） | 🟢 低风险（Low） | 确认页面级 / app 级作用域，构建后检查 JSON |
| Third-party | 需评估 patch | 三方组件样式依赖选择器 | `node_modules/<pkg>/...` 或 wrapper source | `dist/dev/mp-toutiao/components/<pkg>/index.ttss` | ⚠️ 部分支持（partial） | 🟡 中风险（Medium） | 优先本地 wrapper；必要时 patch-package；高风险 patch 则替换组件或保留 WebView |

Do not output empty component/API/framework/CSS tables. If a page has no findings in a category, omit that category.

When precheck is blocked before audit, output the page summary with `blocked` when a page is known, then a concise unblock section:

| 阻塞项 | 为什么阻塞 precheck | 需要用户提供 | 恢复步骤 |
| --- | --- | --- | --- |
| 缺少构建输入 | 无法生成或定位抖音小程序（Douyin miniapp）目标产物进行兼容性判定 | 目标平台确认、安全构建命令（build command）、构建产物 / 生成产物（generated output）路径 | 提供后从 Build Safety Gate 继续 |

## Whole-Miniapp Assessment Contract

Use this branch when the user asks to assess all registered pages, the whole miniapp, project-level migration risk/cost, or a formal reusable assessment document. Keep the compact Page-Level Checklist Contract for one page or a small explicitly scoped page set.

Read and fill `<skill_root>/assets/webview-to-lynx-full-assessment.template.md`. The asset owns the report section order and table columns; do not copy a second full template into this reference.

Rules:

1. Enumerate the authoritative registered page list from `app.json` or the framework route configuration, and emit exactly one row per registered page under its main-package or subpackage group. Do not omit pages because they have no findings.
2. Start each page from its TTML and recursively traverse the actually referenced `usingComponents` closure. Do not propagate findings from registered-but-unreachable components.
3. Keep the template section order and page table columns exactly as defined in `<skill_root>/assets/webview-to-lynx-full-assessment.template.md`. Reproduce these headings exactly and in order: `# 评估边界`, `# 风险与成本说明`, `## 项目级去重估算`, `# 最终页面风险评估`, `# 详细风险分析`, `# 迁移优先级`, `# 正式验收条件`, `# 判断依据`.
4. The page table must use exactly the columns `页面`, `风险`, `AI 迁移复杂度`, `可达组件文件`, `主要风险与改造项`, with one row per registered page.
5. Do not query, accept, normalize, or render traffic and performance data in this base Skill (e.g., PV, LCP80, startup route types). Internal business analytics enrichment belongs to a business-facing facade and must not change the base compatibility assessment.
6. Define each detailed risk once under `# 详细风险分析`, numbered consecutively in first-use order as `## R1 <title>`, `## R2 <title>`, ... . In the page table, link findings to the risk anchors as `[R1](#r1)` (or `[R1](#r1-slug)`); do not duplicate risk-level definition tables.
7. Separate AI execution time from human validation effort in `# 风险与成本说明` and `## 项目级去重估算`, including the exact labels `AI 实施`, `人工投入`, and `去重后项目合计`. Estimate at project level after deduplicating shared components and homologous page families; do not sum per-page ranges. State assumptions and confidence, and do not present model runtime as human effort.
8. Deliver the full assessment as local Markdown (`outputs/response.md` or conversation output) by default. When Feishu/Lark publication is not explicitly requested, mark publication as `not-requested` (未请求/未授权) and do not create or claim external documents.
9. Keep detailed page findings usage-driven and evidence-backed through the bundled diff references.

## Unsupported Capability Output

For every unsupported or behavior-different capability, include:

- What was found.
- Where it was found.
- Why it matters in Lynx rendering.
- Impact on the page or business scenario.
- Options, including keeping the page WebView-rendered when appropriate.
- What needs business or technical confirmation.

Avoid:

- "Just change it to X" when user experience changes.
- "Automatically fallback to Y" without user confirmation.
- A single forced solution for unsupported or semantic-difference capabilities.

## Precheck Workflow

Follow this strict order:

1. Discover project type, package manager, page list, source roots, shared modules, output paths, and build command candidates.
2. Apply the build safety gate. If a safe build cannot be established, stop with `blocked` and ask for the missing context; do not produce a final checklist from guesses.
3. Run the safe build or, for native miniapp projects, identify source files as the artifact and run `node <skill_root>/scripts/precheck_scan.mjs <miniapp-project-root> [--page <registered-route>]`.
4. Verify the artifact exists for each target page: page/app JSON, TTML, TTSS, JS when applicable, and reachable component closure. Treat scanner output as discovery evidence, not the final closure or verdict.
5. Audit the artifact using the Compiled-Output Audit Contract.
6. Map findings to source and affected pages, including shared modules.
7. Produce the page-level checklist and recommended actions.

`Provisional` is allowed only when the user explicitly asks for a rough source/stale-output scan, or when partial evidence remains after a blocked/unavailable optional source mapping. It must not be presented as a final precheck conclusion.

## Migration Verify Workflow

Migration verification is a separate stage from precheck. Build success alone is not a migration completion signal. For newly generated Lynx pages without WebView migration context, use the skill's generated-page verification workflow instead of this reference.

Inputs:

- Repository path.
- Target page list.
- Build command or previously discovered candidate.
- Precheck report.
- Source-change summary.

Hard gates:

| Gate | Failure status |
| --- | --- |
| Build command fails or is unsafe/ambiguous | `blocked` |
| New generated output cannot be located | `blocked` |
| `renderType` is missing or generated in the wrong place | `blocked` or `verified_with_risks` |
| Source changes do not affect generated output | `blocked` or low confidence |
| High-risk unsupported capability remains in generated output | `verified_with_risks` or `keep_webview` |
| Only source evidence exists | `provisional` |

Verification steps:

1. Record build command, working directory, exit code, output path, and output freshness evidence.
2. Confirm the generated output is from the current source state when possible.
3. Rescan page JSON/app JSON, TTML, TTSS, JS, and component closure.
4. Confirm source changes are reflected in generated output.
5. Compare against the precheck report using finding states:
   - `resolved`: precheck finding no longer appears in regenerated output.
   - `remaining`: precheck finding still appears and needs action or accepted risk.
   - `new`: regenerated output introduced a new finding.
   - `source-not-reflected`: source was changed but output did not change as expected.
   - `waived`: risk is explicitly accepted with reason.
   - `unverified`: build/output/source mapping prevents conclusion.
6. Summarize counts by page and emit a page status.

Use these page statuses:

| Status | Meaning |
| --- | --- |
| `verified` | Rebuilt output was scanned and no blocking risks remain |
| `verified_with_risks` | Rebuilt output was scanned but known risks remain |
| `provisional` | Evidence is insufficient for final conclusion |
| `blocked` | Build, output, source mapping, or config prevents verification |
| `keep_webview` | The page should not be migrated in the current plan |

## Durable Skill Boundary

This reference makes migration-precheck and migration-verify behavior available to the agent. The bundled `scripts/precheck_scan.mjs` implements bounded native discovery and lexical signal collection only. It is not a compatibility oracle or codemod. Use its JSON as input to the same page/component review workflow; framework compiled-output scanning, recursive component closure, source mapping, and semantic judgment remain explicit Agent responsibilities unless another authorized scanner supplies equivalent evidence.

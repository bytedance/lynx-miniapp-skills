# Lynx Miniapp Skills

English | [中文 README](README.zh_CN.md)

Lynx Miniapp Skills provides the `lynx-miniapp` Agent Skill for Douyin Mini App developers. It supports Lynx page generation and maintenance, WebView-to-Lynx migration, migration-risk and compatibility review, and the organization of Developer Tools and real-device verification evidence.

## Installation

```bash
npx skills add bytedance/lynx-miniapp-skills
```

## Usage

After installation, explicitly ask your Agent Skills-compatible tool to use the `lynx-miniapp` skill. Provide the mini app project path, target page, task type, and acceptance criteria.

### Supported scenarios

| Scenario              | Typical task                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Generate a page       | Create a Lynx Mini App page from a design, screenshot, or requirement                              |
| Migrate a page        | Migrate a specified WebView page to Lynx and compare visual and behavioral results                 |
| Assess migration risk | Review page-level risks, affected areas, and recommended actions without changing code             |
| Repair a Lynx page    | Diagnose and fix layout, style, compatibility, or interaction issues                               |
| Review an adaptation  | Review existing migration or adaptation code and summarize findings, evidence, and remaining risks |

### Recommended inputs

- Mini app project path and target page path.
- Task type: generation, migration, assessment, repair, or review.
- Accessible designs, screenshots, original WebView pages, or other visual and behavioral baselines.
- Interactions, APIs, analytics events, and compatibility constraints that must be preserved.
- Required validation and the allowed code-change scope.

If required inputs are missing or inaccessible, clarify the scope before asking the Agent to implement the page. Do not rely on guessed UI or business behavior.

### Prompt examples

#### Generate a new page

```text
Use the lynx-miniapp skill to create a Lynx page in the current Douyin Mini App project.
Target path: pages/order/index
Target UI: use the attached design or screenshot as the source of truth. If the attachment cannot be read, ask me before making changes instead of guessing the UI.
Update the real project source code and complete build, visual, and critical-interaction validation. List any unverified scenarios.
```

#### Migrate an existing page

```text
Use the lynx-miniapp skill to migrate pages/category/index from WebView rendering to Lynx rendering. The original page is on branch feat/webview-origin.
Use the original WebView page as the visual and behavioral baseline, and compare the same page state before and after the migration.
Update the real project source code, then provide visual comparison results, interaction validation results, and remaining issues.
```

#### Assess migration risk only

```text
Use the lynx-miniapp skill to assess the risk of migrating pages/category/index from WebView to Lynx.
Do not change code. Provide a page-level migration checklist, source locations, affected areas, recommended actions, whether an item can be fixed automatically, and whether the migration should continue.
Visual-fidelity validation is not required in this task. If no runnable page or UI baseline is available, mark visual risks as not assessed.
```

## Understanding validation results

- A successful build only shows that the code passed the relevant build process. It does not prove that visual behavior and interactions are correct.
- The Lynx simulator can validate layout, styles, and basic interactions. System components, permissions, keyboards, complex gestures, and lifecycle behavior should still be validated on real devices when applicable.
- WebView simulator results are only a migration baseline and cannot replace Lynx validation.
- Mark scenarios that were not run, could not be reproduced, or lacked a baseline as `not verified` or `not assessed` instead of treating them as passed.
- A high-risk finding indicates adaptation complexity or uncertainty. It does not mean that migration is impossible.

## Updates

The public `skills/lynx-miniapp` directory is produced from a deterministic allowlisted snapshot. Follow repository releases and `CHANGELOG.md` for updates and upgrade notes.

## Versioning and compatibility

Public releases follow [Semantic Versioning](https://semver.org/). Releases and breaking changes are recorded in GitHub Releases and `CHANGELOG.md`. Actual compatibility also depends on the Mini App base library, Developer Tools, and Lynx engine versions. Include relevant versions, a reproducible page, and the runtime environment when reporting a problem.

## Contribution

Please check [Contributing](CONTRIBUTING.md) for issue and pull-request requirements. Pull requests must describe the previous state, the change, the resulting behavior, and the validation performed. Security vulnerabilities must not be submitted through public issues or pull requests.

## Code of Conduct

Please check [Code of Conduct](CODE_OF_CONDUCT.md) for community standards.

## Security

If you discover a potential security issue, notify ByteDance Security through our [security center](https://security.bytedance.com/src) or [vulnerability reporting email](mailto:src@bytedance.com). Please **do not** create a public GitHub issue.

## License

This project is licensed under the [Apache-2.0 License](LICENSE).

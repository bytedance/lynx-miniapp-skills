# Lynx Miniapp Skills

[English](README.md) | 中文

Lynx Miniapp Skills 为抖音小程序开发者提供 `lynx-miniapp` Agent Skill，用于生成和修复 Lynx 小程序页面、将 WebView 页面迁移到 Lynx、评估迁移风险、检查兼容性差异，并整理开发者工具与真机验证证据。

## 安装

```bash
npx skills add bytedance/lynx-miniapp-skills
```

## 使用

安装后，在支持 Agent Skills 的工具中明确说明“请使用 `lynx-miniapp` skill”，并提供小程序项目路径、目标页面、任务类型和验收要求。

### 支持的场景

| 场景            | 适合的任务                                                      |
| --------------- | --------------------------------------------------------------- |
| 生成新页面      | 根据设计图、截图或需求说明创建 Lynx 小程序页面                  |
| 迁移已有页面    | 将指定 WebView 页面迁移为 Lynx 渲染，并对比迁移前后的视觉与行为 |
| 评估迁移风险    | 在不修改代码的前提下，输出页面级风险、影响范围和建议动作        |
| 修复 Lynx 页面  | 定位并修复已有 Lynx 页面的布局、样式、兼容性或交互问题          |
| Review 已有适配 | 检查现有迁移或适配代码，整理问题、验证结果和剩余风险            |

### 建议提供的输入

- 小程序项目路径和目标页面路径。
- 任务类型：生成、迁移、评估、修复或 Review。
- 可访问的设计图、截图、原 WebView 页面或其他视觉与行为基线。
- 必须保持的交互、接口、埋点和兼容范围。
- 期望执行的验证，以及允许修改代码的范围。

如果关键输入不可读取或缺失，应先补充材料或确认范围，不要让 Agent 自行猜测 UI 和业务行为。

### Prompt 示例

#### 生成新页面

```text
请使用 lynx-miniapp skill，在当前抖音小程序项目中生成一个 Lynx 页面。
目标路径：pages/order/index
目标 UI：以本 Prompt 附带的设计图或截图为准；如果无法读取附件，请先向我确认，不要自行猜测 UI。
请修改项目真实源码，并完成构建、视觉和关键交互验证；未验证的场景需要明确列出。
```

#### 迁移已有页面

```text
请使用 lynx-miniapp skill，将 feat/webview-origin 分支中 pages/category/index 页面从 WebView 渲染迁移为 Lynx 渲染。
以原 WebView 页面为视觉和行为基线；修改前后使用相同的页面状态进行对比。
请修改项目真实源码，并给出视觉对比、交互验证结果和剩余问题。
```

#### 只评估迁移风险

```text
请使用 lynx-miniapp skill，评估当前项目中 pages/category/index 页面从 WebView 迁移到 Lynx 的风险。
先不要修改代码，只输出页面级迁移 checklist、源码位置、影响范围、建议动作、是否可以自动修复、是否建议继续迁移。
本次不要求视觉还原验证；如果缺少可运行页面或 UI 基线，请将视觉风险标记为未评估。
```

## 如何理解验证结果

- 构建成功仅表示代码通过对应构建流程，不等于视觉和交互已经通过。
- Lynx 模拟器可用于布局、样式和基础交互验证；涉及系统组件、权限、键盘、复杂手势或生命周期的场景仍建议真机验证。
- WebView 模拟器结果只能作为迁移前基线，不能替代 Lynx 结果。
- 未执行、无法复现或缺少基线的场景应明确标记为“未验证”或“未评估”，不应推断为通过。
- 风险较高表示适配复杂度和不确定性较高，不等于页面完全不能迁移。

## 更新

版本变更请查看[更新日志](CHANGELOG.md)。

## 版本与兼容性

公开版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。版本变化和破坏性变更会记录在 GitHub Release 或 `CHANGELOG.md` 中。实际兼容范围还会受到小程序基础库、开发者工具和 Lynx 引擎版本影响；反馈问题时请附上相关版本、复现页面和运行环境。

## 贡献

Issue 和 Pull Request 均支持中文或英文。具体要求见 [贡献指南](CONTRIBUTING.md)。Pull Request 需要说明修改前状态、变更内容、修改后效果和验证方式。安全漏洞不得使用公开 Issue 或 Pull Request 提交。

## 行为准则

社区协作要求见 [行为准则](CODE_OF_CONDUCT.md)。

## 安全

如发现潜在安全问题，请通过字节跳动[安全响应中心](https://security.bytedance.com/src)或[漏洞报告邮箱](mailto:src@bytedance.com)反馈。请**不要**创建公开 GitHub Issue。

## 许可证

本项目使用 [Apache-2.0 License](LICENSE)。

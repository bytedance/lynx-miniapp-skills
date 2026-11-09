# {{REPORT_TITLE}}

{{ASSESSMENT_BASIS_AND_DATE}}

> **交付方式：**本地 Markdown 或对话内完整报告为默认；飞书/Lark 发布状态：{{DOCUMENT_PUBLICATION_STATUS}}。仅在用户明确要求并授权外部写入时填写文档链接：{{DOCUMENT_URL_OR_NOT_REQUESTED}}。

> **最终结论：**{{FINAL_CONCLUSION}}

# 评估边界

| 评估项 | 说明 |
| --- | --- |
| 项目形态 | {{PROJECT_SHAPE}} |
| 页面范围 | {{REGISTERED_PAGE_SCOPE}} |
| 证据原则 | {{EVIDENCE_RULE}} |
| 构建状态 | {{BUILD_STATUS}} |
| 源码映射 | {{SOURCE_MAPPING_STATUS}} |
| 未执行事项 | {{NOT_EXECUTED}} |

# 风险与成本说明

风险等级沿用 WebView-to-Lynx precheck contract，此处不重复定义。

{{AI_COMPLEXITY_TABLE}}

{{COST_SCOPE_NOTE}}

## 项目级去重估算

| 阶段 | AI 实施 | 人工投入 | 主要产出 |
| --- | --- | --- | --- |
| 共享基础组件与规则固化 | {{FOUNDATION_AI_COST}} | {{FOUNDATION_HUMAN_COST}} | {{FOUNDATION_OUTPUT}} |
| 代表性复杂页面 PoC | {{POC_AI_COST}} | {{POC_HUMAN_COST}} | {{POC_OUTPUT}} |
| 同构页面批量迁移 | {{BATCH_AI_COST}} | {{BATCH_HUMAN_COST}} | {{BATCH_OUTPUT}} |
| 长尾页面与真机验收 | {{LONG_TAIL_AI_COST}} | {{LONG_TAIL_HUMAN_COST}} | {{LONG_TAIL_OUTPUT}} |
| **去重后项目合计** | **{{TOTAL_AI_COST}}** | **{{TOTAL_HUMAN_COST}}** | **{{CALENDAR_ESTIMATE}}** |

{{ESTIMATE_ASSUMPTIONS}}

# 最终页面风险评估

## {{PACKAGE_OR_PAGE_GROUP}}

| 页面 | 风险 | AI 迁移复杂度 | 可达组件文件 | 主要风险与改造项 |
| --- | --- | --- | ---: | --- |
| `{{PAGE_ROUTE}}` | {{RISK}} | {{AI_COMPLEXITY_AND_HUMAN_VALIDATION}} | {{REACHABLE_COMPONENT_COUNT}} | [R1](#r1-{{RISK_SLUG}})：{{PAGE_SPECIFIC_FINDING}} |

# 详细风险分析

## R1 {{RISK_TITLE}}

{{RISK_ANALYSIS}}

## R2 {{RISK_TITLE}}

{{RISK_ANALYSIS}}

# 迁移优先级

1. {{MIGRATION_PHASE_1}}
2. {{MIGRATION_PHASE_2}}
3. {{MIGRATION_PHASE_3}}

# 正式验收条件

{{ACCEPTANCE_CRITERIA}}

# 判断依据

{{REFERENCES_AND_EVIDENCE}}

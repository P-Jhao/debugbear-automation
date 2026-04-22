# DebugBear 批量性能测试工具 MVP 需求文档

## 1. 文档目标
- 在最短时间内交付可用版本，替代人工重复点击测试与手工统计。
- 明确 MVP 范围，避免首期过度设计。

## 2. MVP 要解决的问题
- 对单个 URL 需要重复发起多次测试（默认 12 次），人工操作成本高。
- 测试结果需人工汇总平均值，容易出错且标准不一致。
- 缺少统一的任务视图，不便追踪执行进度与失败情况。

## 3. MVP 范围（In Scope）
- 创建批量测试任务：输入 URL、测试次数、版本号、分组。
- 后端调用 DebugBear API 执行批量任务（限流并发 + 简单重试）。
- 实时查看任务进度（完成数/总数）和任务状态。
- 展示每次测试核心指标与 DebugBear 详情链接。
- 自动计算统计结果：原始平均值、去极值平均值、最大值、最小值。
- 保存并查看历史任务列表（基础筛选：URL、状态、版本、分组、时间）。
- API Key 仅后端保存与调用，不在前端暴露。

## 4. 非 MVP 范围（Out of Scope）
- 导出 CSV/JSON。
- 自动同步外部发布系统的版本/分组主数据。
- 大盘可视化与跨项目聚合分析。

## 5. 目标用户
- 性能测试执行人：发起任务、查看单次结果与汇总结果。
- 研发同学：按版本/分组回看性能变化。

## 6. 关键流程
1. 用户填写 `url`、`count`（默认 12）、`version`、`group`，点击开始测试。
2. 系统创建任务并返回 `taskId`。
3. 后端按并发上限调用 DebugBear API 执行每次测试，失败请求自动重试 1 次。
4. 前端轮询任务详情，展示进度和单次结果。
5. 全部执行完成后，展示统计结果与任务最终状态。
6. 用户可从历史列表进入任务详情并跳转 DebugBear 单次详情页。

## 7. 功能需求

### 7.1 任务创建
- 必填字段：`url`、`count`、`version`、`group`。
- 字段规则：
  - `count` 默认 12，范围 3~30。
  - `url` 需为合法 HTTP/HTTPS 地址。
- 可选字段（MVP 可先保留接口，不必前端完整暴露）：`device`、`region`、`network`、`remark`。

### 7.2 任务执行与状态
- 任务状态：`pending`、`running`、`completed`、`partial_failed`、`failed`。
- 默认并发：2（可在后端配置）。
- 重试策略：单次执行失败最多重试 1 次。
- 失败样本应记录失败原因（错误码/错误信息摘要）。

### 7.3 结果展示
- 单次结果字段：`runId`、`status`、`debugBearUrl`、`lcp`、`inp`、`cls`、`ttfb`、`createdAt`。
- 汇总字段：
  - `avg`（原始平均）
  - `trimmedAvg`（去 1 高 + 1 低平均）
  - `max`、`min`
  - `successCount`、`failCount`
- 去极值规则：
  - 成功样本数 `< 3`：不计算 `trimmedAvg`。
  - 成功样本数 `>= 3`：每项指标去掉最高与最低各 1 个后求平均。

### 7.4 历史记录
- 展示任务列表：任务 ID、URL、版本、分组、状态、创建时间、成功/失败数。
- 支持筛选：URL 关键字、状态、版本、分组、时间范围。

## 8. 接口定义（MVP）

### 8.1 `POST /api/perf-tasks`
- 入参：`url`、`count`、`version`、`group`、`config?`、`remark?`
- 出参：`taskId`

### 8.2 `GET /api/perf-tasks/{taskId}`
- 出参：任务基本信息、状态、进度、单次结果、汇总结果

### 8.3 `GET /api/perf-tasks`
- 入参（query）：`url?`、`status?`、`version?`、`group?`、`dateFrom?`、`dateTo?`
- 出参：任务列表

### 8.4 `GET /api/versions`
- 出参：版本列表

### 8.5 `GET /api/versions/{version}/groups`
- 出参：分组列表

## 9. 数据结构（建议）
- 任务表 `perf_tasks`：
  - `task_id`、`url`、`count`、`version`、`group`、`status`、`config_json`、`remark`、`created_at`、`updated_at`
- 运行结果表 `perf_task_runs`：
  - `id`、`task_id`、`run_index`、`run_id`、`debugbear_url`、`status`、`lcp`、`inp`、`cls`、`ttfb`、`error_message`、`created_at`

## 10. 非功能要求（MVP）
- 安全：
  - DebugBear API Key 存储在服务端环境变量。
  - 日志对密钥脱敏，不在接口响应中回传密钥。
- 可用性：
  - 常规网络下，12 次任务可看到持续进度更新。
- 可维护性：
  - 并发数、重试次数、去极值规则配置化。

## 11. 验收标准（MVP）
- 可对任意合法 URL 发起 12 次批量测试并完成。
- 页面可展示实时进度（例如 5/12）与最终任务状态。
- 页面可展示每次结果与可点击的 DebugBear 详情链接。
- 原始平均值与去极值平均值计算准确，且满足样本数规则。
- 历史任务可按版本与分组筛选并查看详情。
- 浏览器侧请求与页面数据中不出现 DebugBear API Key 明文。

## 12. 里程碑建议（MVP）
1. D1：后端打通 DebugBear API + 任务执行与状态流转。
2. D2：前端任务创建页 + 任务详情页（进度、单次结果、汇总）。
3. D3：历史列表 + 筛选 + 验收测试与边界修复。

## 13. 待确认项（开工前）
- DebugBear API 限流阈值与计费规则。
- 版本/分组主数据来源（手工维护或系统内维护）。
- 指标取值单位与显示精度（如 ms、小数位）。
- 失败重试是否只限网络/5xx，还是所有失败类型统一重试。

# DebugBear API 文档（中文整理版）

> 来源页面：<https://www.debugbear.com/docs/api>
> 最后更新：2026 年 4 月 14 日

---

## 目录

- [快速开始](#快速开始)
- [管理项目和页面](#管理项目和页面)
- [运行网站测试](#运行网站测试)
  - [运行单次测试](#运行单次测试)
  - [附加选项](#附加选项)
  - [构建特定 Commit](#构建特定-commit)
  - [自定义 URL 和 HTTP Header](#自定义-url-和-http-header)
  - [传入自定义 Cookie](#传入自定义-cookie)
  - [获取构建状态和指标](#获取构建状态和指标)
  - [直接使用 HTTP API](#直接使用-http-api)
  - [批量运行测试](#批量运行测试)
- [导出实验室测试指标](#导出实验室测试指标)
- [获取详细分析数据](#获取详细分析数据)
  - [获取网络请求](#获取网络请求)
  - [获取 Lighthouse 报告](#获取-lighthouse-报告)
- [获取项目中页面的最近结果](#获取项目中页面的最近结果)
  - [获取较早的指标](#获取较早的指标)
  - [获取其他环境的结果](#获取其他环境的结果)
  - [获取项目信息](#获取项目信息)
- [时间线注释](#时间线注释)
- [加载 RUM 指标](#加载-rum-指标)
  - [可用指标、过滤和分组选项](#可用指标过滤和分组选项)
  - [stat 参数](#stat-参数)
  - [按指标值过滤](#按指标值过滤)
  - [指定过滤类型](#指定过滤类型)
  - [排序和限制结果](#排序和限制结果)
  - [完整过滤示例](#完整过滤示例)

---

## 快速开始

要开始使用 DebugBear API，你需要：

1. 安装 `debugbear` Node.js 模块
2. 生成一个 API Key
3. 找到你要分析的页面 ID

安装方式：

```bash
npm install debugbear
```

初始化客户端：

```js
const { DebugBear } = require("debugbear");
// TypeScript: import { DebugBear } from "debugbear"

const debugbear = new DebugBear(process.env.DEBUGBEAR_API_KEY);
```

运行脚本时传入 API Key：

```bash
DEBUGBEAR_API_KEY=你的_API_KEY node script.js
```

---

## 管理项目和页面

DebugBear 支持通过 Node API 管理项目和页面。

相关内容可参考 DebugBear 的项目与页面管理文档：

```text
/docs/managing-projects-and-pages
```

---

## 运行网站测试

你可以运行单次测试，也可以批量触发多个页面测试。

---

### 运行单次测试

创建一个 `script.js` 文件：

```js
const { DebugBear } = require("debugbear");
// TypeScript: import { DebugBear } from "debugbear"

const debugbear = new DebugBear(process.env.DEBUGBEAR_API_KEY);

const pageId = 185;

debugbear.pages.analyze(pageId).then((analysis) => {
  analysis.waitForResult().then(() => {
    console.log("Test complete, view results here: " + analysis.url);
  });
});
```

然后执行：

```bash
DEBUGBEAR_API_KEY=你的_API_KEY node script.js
```

---

### 附加选项

Node 模块支持和 DebugBear CLI 类似的参数。

你可以在触发测试时传入额外配置，例如：

- Commit 信息
- 构建标题
- 自定义测试 URL
- 自定义 HTTP Header
- Cookie
- 是否自动从环境变量中推断构建信息

---

### 构建特定 Commit

可以为测试指定 Commit Hash、构建标题，并自动推断构建信息：

```js
debugbear.pages.analyze(pageId, {
  commitHash: "e2ba122",
  buildTitle: "Add support for tags",

  // 从环境中推断额外信息，
  // 例如当前分支名称
  inferBuildInfo: true,
});
```

常用参数说明：

| 参数             | 说明                                      |
| ---------------- | ----------------------------------------- |
| `commitHash`     | 当前构建对应的 Git Commit Hash            |
| `buildTitle`     | 构建标题                                  |
| `inferBuildInfo` | 是否从 CI/CD 或环境变量中自动推断构建信息 |

---

### 自定义 URL 和 HTTP Header

可以覆盖页面默认 URL，也可以传入自定义请求头。

```js
debugbear.pages.analyze(pageId, {
  url: "http://staging.com",
  customHeaders: {
    "X-Feature-Flags": "tags",
  },
});
```

适合场景：

- 测试 Staging 环境
- 开启实验性功能
- 传递鉴权 Header
- 设置 Feature Flag

---

### 传入自定义 Cookie

你可以给测试页面传入 Cookie：

```js
debugbear.pages.analyze(pageId, {
  cookies: [
    {
      name: "testcookie",
      value: "testvalue",
      domain: "www.example.com",
      path: "/",
    },
  ],
});
```

Cookie 字段说明：

| 字段     | 说明            |
| -------- | --------------- |
| `name`   | Cookie 名称     |
| `value`  | Cookie 值       |
| `domain` | Cookie 所属域名 |
| `path`   | Cookie 生效路径 |

---

### 获取构建状态和指标

可以等待分析完成后获取测试结果、构建状态和性能指标。

```js
const analysis = await debugbear.pages.analyze(pageId, {
  commitHash: "abc123",
});

const res = await analysis.waitForResult();

console.log(res);
```

返回结果示例：

```json
{
  "url": "https://www.debugbear.com/viewResult/787431",
  "hasFinished": true,
  "build": {
    "status": "failure",
    "oneLineSummary": "PF 100 ➔ 96, SEO 85 ➔ 80, Req# +1",
    "metrics": {
      "analysis.date": "2020-02-14T19:06:42.201Z",
      "performance.speedIndex": 1087,
      "performance.interactive": 895,
      "performance.firstContentfulPaint": 845,
      "performance.firstMeaningfulPaint": 1301,
      "performance.score": 0.96,
      "accessibility.score": 0.55,
      "bestPractices.score": 0.79,
      "seo.score": 0.8,
      "pwa.score": 0.54,
      "pageWeight.total": 1666205,
      "pageWeight.document": 5745,
      "pageWeight.stylesheet": 4562,
      "pageWeight.image": 1571870,
      "pageWeight.script": 65597,
      "pageWeight.font": 18431,
      "pageWeight.ajax": 0,
      "pageWeight.media": 0,
      "pageWeight.other": 0,
      "pageWeight.redirect": 0,
      "cpu.total": 42,
      "cpu.scriptEvaluation": 8.4,
      "console.errors": 0,
      "console.warnings": 0,
      "html.errors": 1,
      "html.warnings": 1,
      "mark.start": 120,
      "mark.fully-rendered": 14125,
      "measure.timeout": 14005,
      "crux.granularity": "url",
      "crux.fcp.p75": 906,
      "crux.lcp.p75": 901,
      "crux.cls.p75": 0,
      "crux.fid.p75": 2
    }
  }
}
```

#### 构建状态说明

`build.status` 可能的值：

| 状态      | 说明               |
| --------- | ------------------ |
| `neutral` | 未设置性能预算     |
| `success` | 测试通过性能预算   |
| `failure` | 测试未通过性能预算 |

---

### 直接使用 HTTP API

如果不想使用 Node 模块，也可以直接调用 HTTP API。

#### 触发页面分析

```bash
curl https://www.debugbear.com/api/v1/page/PAGE_ID/analyze \
  -X POST \
  -H "x-api-key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://example.com","buildTitle":"Site update"}'
```

#### 请求说明

| 项目         | 内容                           |
| ------------ | ------------------------------ |
| 方法         | `POST`                         |
| URL          | `/api/v1/page/PAGE_ID/analyze` |
| 鉴权 Header  | `x-api-key: API_KEY`           |
| Content-Type | `application/json`             |

#### Body 示例

```json
{
  "url": "http://example.com",
  "buildTitle": "Site update"
}
```

---

### 批量运行测试

可以使用 `analyzeBulk` 一次触发多个页面测试。

```js
const bulkTests = await debugbear.pages.analyzeBulk([123, 124]);

const results = await bulkTests.waitForResult();
```

> 注意：
> 当前批量测试 API 不支持传入额外选项，例如 `commitHash` 或自定义 Header。
> 如果需要这些功能，需要联系 DebugBear 支持团队。

返回结果示例：

```json
{
  "hasFinished": true,
  "results": [
    {
      "hasFinished": true,
      "build": {
        "status": "neutral",
        "metrics": {
          "analysis.date": "2024-05-26T07:56:39.634Z",
          "performance.largestContentfulPaint": 1822,
          "performance.totalBlockingTime": 190,
          "...": "..."
        },
        "oneLineSummary": "No changes.",
        "budgets": []
      },
      "analysis": {
        "commitHash": null,
        "commitBranch": null,
        "buildTitle": null
      },
      "page": {
        "id": "123",
        "name": "MZ Finland",
        "url": "https://www.example.com/",
        "...": "..."
      }
    },
    "..."
  ]
}
```

---

## 导出实验室测试指标

`getMetrics` 函数可以获取和页面数据导出按钮相同的指标，例如：

- 性能指标
- 页面体积
- Lighthouse 分数

示例：

```js
let metrics = await debugbear.pages.getMetrics(pageId, {
  from: new Date(2022, 4, 1),
  to: new Date(2022, 5, 1),
});

console.log(metrics[0]["performance.score"]);
```

---

### 使用 cURL 获取页面指标

```bash
curl https://www.debugbear.com/api/v1/page/PAGE_ID/metrics \
  -X GET \
  -H "x-api-key: API_KEY" \
  -G \
  -d from=2022-02-01 \
  -d to=2022-03-01
```

这个请求会加载：

```text
2022-02-01 00:00:00 到 2022-03-01 00:00:00
```

之间的数据。

#### 请求说明

| 项目 | 内容                           |
| ---- | ------------------------------ |
| 方法 | `GET`                          |
| URL  | `/api/v1/page/PAGE_ID/metrics` |
| 参数 | `from`, `to`                   |
| 鉴权 | `x-api-key`                    |

---

## 获取详细分析数据

可以通过分析 ID 获取某次具体分析的详细数据。

---

### 获取网络请求

`getRequests` 函数会返回测试期间产生的所有网络请求列表。

```js
const requests = await debugbear.analyses.getRequests(analysisId);

console.log(requests);
```

#### 使用 cURL

```bash
curl https://www.debugbear.com/api/v1/analysis/ANALYSIS_ID/requests \
  -X GET \
  -H "x-api-key: API_KEY"
```

#### 请求说明

| 项目 | 内容                                    |
| ---- | --------------------------------------- |
| 方法 | `GET`                                   |
| URL  | `/api/v1/analysis/ANALYSIS_ID/requests` |
| 鉴权 | `x-api-key`                             |

---

### 获取 Lighthouse 报告

`getLighthouseReport` 函数会返回被测页面完整的 Lighthouse JSON 报告。

```js
const lhr = await debugbear.analyses.getLighthouseReport(analysisId);

console.log(lhr);
```

#### 使用 cURL

```bash
curl https://www.debugbear.com/api/v1/analysis/ANALYSIS_ID/lhr \
  -X GET \
  -H "x-api-key: API_KEY"
```

#### 请求说明

| 项目 | 内容                               |
| ---- | ---------------------------------- |
| 方法 | `GET`                              |
| URL  | `/api/v1/analysis/ANALYSIS_ID/lhr` |
| 返回 | Lighthouse JSON                    |
| 鉴权 | `x-api-key`                        |

---

## 获取项目中页面的最近结果

调用 `projects.getPageMetrics` 可以获取项目中所有页面的最新指标，类似 DebugBear 网站中项目概览页面展示的数据。

```js
const pageMetrics = await debugbear.projects.getPageMetrics(project.id);

pageMetrics.forEach((item) => {
  console.log(`SEO score for ${item.page.name}: ${item.metrics["seo.score"]}`);
});
```

---

### 获取较早的指标

默认情况下，API 会返回最近的结果。

如果需要获取某个时间点之前的结果，可以传入 `before` 参数。这样该时间之后的结果会被忽略。

```js
const pageMetrics = await debugbear.projects.getPageMetrics(project.id, {
  before: new Date(2020, 8, 4),
});
```

---

### 获取其他环境的结果

默认情况下，API 只返回被认为是主测试环境的结果。

所谓主测试，是指能够准确反映页面常规表现的测试。

如果你通过 UI 或自定义 Header 运行过实验性测试，这类结果默认会被排除，因为它们可能不能代表页面通常的执行情况。

如需包含非主环境结果，可以在页面级别的 `getMetrics` 方法中设置：

```js
const metrics = await debugbear.pages.getMetrics(pageId, {
  environments: "all",
});
```

---

#### 使用 cURL 获取项目页面指标

```bash
curl https://www.debugbear.com/api/v1/projects/PROJECT_ID/pageMetrics \
  -X GET \
  -H "x-api-key: API_KEY" \
  -G \
  -d before=2020-02-01
```

#### 请求说明

| 项目 | 内容                                      |
| ---- | ----------------------------------------- |
| 方法 | `GET`                                     |
| URL  | `/api/v1/projects/PROJECT_ID/pageMetrics` |
| 参数 | `before`                                  |
| 鉴权 | `x-api-key`                               |

---

### 获取项目信息

使用 `projects.get` 可以获取项目信息，包括项目中的页面列表。

```js
const project = await debugbear.projects.get(project.id);

console.log(project.name, project.pages);
```

#### 使用 cURL

```bash
curl https://www.debugbear.com/api/v1/projects/PROJECT_ID \
  -X GET \
  -H "x-api-key: API_KEY"
```

#### 请求说明

| 项目 | 内容                          |
| ---- | ----------------------------- |
| 方法 | `GET`                         |
| URL  | `/api/v1/projects/PROJECT_ID` |
| 返回 | 项目详情和页面列表            |
| 鉴权 | `x-api-key`                   |

---

## 时间线注释

可以调用 `debugbear.annotations.create` 创建时间线注释。

```js
await debugbear.annotations.create(project.id, {
  title: "Staging release",
  description: "some description",
  pageFilter: "",
  date: new Date(),
});
```

可以使用 `debugbear.annotations.list(projectId)` 获取注释列表。

---

### `pageFilter` 属性

`pageFilter` 是一个过滤字符串，用于只将注释应用到特定页面。

如果你只想给某个特定页面添加注释，可以使用：

```text
pageId:1234
```

---

### 使用 cURL 创建注释

```bash
curl https://www.debugbear.com/api/v1/project/PROJECT_ID/annotation \
  -X POST \
  -H "x-api-key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "V5 release", "date": "2022-12-21T11:00:00.000Z"}'
```

#### Body 示例

```json
{
  "title": "V5 release",
  "date": "2022-12-21T11:00:00.000Z"
}
```

---

### 使用 cURL 列出注释

```bash
curl https://www.debugbear.com/api/v1/project/PROJECT_ID/annotations \
  -H "x-api-key: API_KEY"
```

---

## 加载 RUM 指标

RUM 即 Real User Monitoring，真实用户监控。

使用 `getRumMetrics(projectId)` 方法可以加载某个项目的 RUM 数据。

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  filters: {
    device: "mobile",
  },
});

console.log(rumData);
```

接口返回聚合后的 RUM 指标。

其中：

| 字段    | 说明                               |
| ------- | ---------------------------------- |
| `value` | 指标值，默认是第 75 百分位，即 p75 |
| `count` | 包含的页面访问数量                 |

返回示例：

```json
{
  "info": {
    "groupBy": "urlPath",
    "stat": "p75",
    "from": "2024-04-25T20:15:00.000Z",
    "to": "2024-05-26T20:15:00.000Z"
  },
  "lcp": [
    {
      "count": 115,
      "urlPath": "/",
      "value": 1614
    },
    {
      "count": 70,
      "urlPath": "/product",
      "value": 698
    },
    "..."
  ],
  "cls": ["..."],
  "inp": ["..."],
  "fcp": ["..."],
  "ttfb": ["..."]
}
```

---

### 指定时间范围、指标和过滤条件

可以使用 `from` 和 `to` 指定日期范围。

可以通过 `metrics` 参数传入自定义指标。

可以使用 `device` 或 `urlPath` 等过滤条件，只包含特定用户体验数据。

```js
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const rumData = await debugbear.projects.getRumMetrics("123", {
  from: new Date(new Date().valueOf() - 31 * MS_PER_DAY),
  to: new Date(),
  metrics: ["load", "dcl", "fcp"],
  filters: {
    urlPath: ["/"],
  },
});
```

---

## 可用指标、过滤和分组选项

完整的 RUM 指标列表可查看：

```text
/docs/real-user-monitoring-metrics
```

完整的过滤和分组属性列表可查看：

```text
/docs/real-user-monitoring-properties
```

---

## `stat` 参数

默认情况下，API 返回指标值的第 75 百分位，即 `p75`。

你也可以传入以下值：

| `stat` 值 | 说明                 |
| --------- | -------------------- |
| `avg`     | 平均值               |
| `sum`     | 总和                 |
| `p50`     | 第 50 百分位         |
| `p75`     | 第 75 百分位，默认值 |
| `p90`     | 第 90 百分位         |
| `p95`     | 第 95 百分位         |

示例：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  stat: "p90",
});
```

---

## 按指标值过滤

可以在过滤条件中使用指标，并通过对象传入 `from` 和 / 或 `to`。

```js
const rumData = await debugbear.projects.getRumMetrics(project.id, {
  groupBy: "navigationType",
  filters: {
    fcp: { to: 2000 },
  },
});
```

这个例子表示只包含：

```text
FCP <= 2000ms
```

的用户体验数据。

---

### 使用 cURL 获取 RUM 指标

```bash
curl https://www.debugbear.com/api/v1/project/12345/rumMetrics \
  -X GET \
  -G \
  -d from=2020-02-01T00:00:00Z \
  -d to=2025-08-01T00:00:00Z \
  -d fcp=-2000 \
  -H "x-api-key: API_KEY"
```

---

## 指定过滤类型

除了默认的精确匹配，也可以使用：

- 负向过滤
- 通配符匹配
- 通配符排除

可用的过滤类型如下：

| 类型           | 说明                                    |
| -------------- | --------------------------------------- |
| `is`           | 默认值，只包含精确匹配                  |
| `isNot`        | 排除精确匹配                            |
| `matches`      | 包含通配符模式匹配，使用 `*` 作为通配符 |
| `doesNotMatch` | 排除通配符模式匹配                      |

---

### 通配符匹配示例

```js
const rumData = await debugbear.projects.getRumMetrics(project.id, {
  filters: {
    urlPath: { value: "/blog/changelog-*", type: "matches" },
  },
});
```

---

### 负向过滤示例

```js
const rumData = await debugbear.projects.getRumMetrics(project.id, {
  filters: {
    urlPath: { value: ["/admin", "/internal"], type: "isNot" },
  },
});
```

---

### 另一种写法：单独指定过滤类型

```js
const rumData = await debugbear.projects.getRumMetrics(project.id, {
  filters: {
    urlPath: "/blog/*",
    urlPath_type: "matches",
  },
});
```

---

### 过滤类型限制

| 过滤类型       | 可用范围                                              |
| -------------- | ----------------------------------------------------- |
| `is`           | 所有过滤条件，包括维度属性和指标                      |
| `isNot`        | 所有过滤条件，包括维度属性和指标                      |
| `matches`      | 仅适用于维度属性，例如 `urlPath`、`country`、`device` |
| `doesNotMatch` | 仅适用于维度属性，例如 `urlPath`、`country`、`device` |

> `matches` 和 `doesNotMatch` 不支持用于指标过滤。

---

## 排序和限制结果

当使用 `groupBy` 时，可以控制返回分类的数量和排序方式。

---

### `maxCategories`

限制返回的分类数量。

| 属性   | 说明  |
| ------ | ----- |
| 默认值 | `20`  |
| 最大值 | `500` |

如果分类数量超过该限制，只会基于排序参数返回排名靠前的分类。

示例：只返回前 10 个 URL。

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  maxCategories: 10,
});
```

---

### `orderBy`

控制按照什么字段排序。

| 值      | 说明                       |
| ------- | -------------------------- |
| `count` | 按页面访问数量排序，默认值 |
| `value` | 按指标值排序               |

按访问量排序：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  orderBy: "count",
});
```

按指标值排序：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  orderBy: "value",
});
```

---

### `orderByDirection`

设置排序方向。

| 值     | 说明         |
| ------ | ------------ |
| `desc` | 降序，默认值 |
| `asc`  | 升序         |

获取 LCP 最慢的 URL：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  orderBy: "value",
  orderByDirection: "desc",
});
```

获取 LCP 最快的 URL：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  orderBy: "value",
  orderByDirection: "asc",
});
```

---

### 组合排序参数

获取访问量最高的 5 个 URL：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  maxCategories: 5,
  orderBy: "count",
  orderByDirection: "desc",
});
```

获取 LCP 最慢的 10 个 URL：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  groupBy: "urlPath",
  maxCategories: 10,
  orderBy: "value",
  orderByDirection: "desc",
});
```

---

## 完整过滤示例

### 按单个 URL Path 过滤

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  filters: {
    urlPath: "/product/123",
  },
});
```

---

### 按多个 URL Path 过滤

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  filters: {
    urlPath: ["/product/123", "/product/456"],
  },
});
```

---

### 排除指定路径

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  filters: {
    urlPath: ["/admin", "/internal"],
    urlPath_type: "isNot",
  },
});
```

---

### 使用通配符匹配路径

支持多个通配符。

例如：

```text
/project/*/rum/*/overview
```

可以匹配：

```text
/project/123/rum/54/overview
```

代码示例：

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  filters: {
    urlPath: "/project/*/rum/*/overview",
    urlPath_type: "matches",
  },
});
```

---

### 组合多个过滤条件

```js
const rumData = await debugbear.projects.getRumMetrics("123", {
  filters: {
    urlPath: "/checkout/*",
    urlPath_type: "matches",
    device: "mobile",
    lcp: { from: 2500 },
  },
});
```

这个示例表示：

- URL Path 匹配 `/checkout/*`
- 设备为移动端
- LCP 大于等于 `2500ms`

---

## 常用 HTTP API 汇总

| 功能                 |   方法 | Endpoint                                  |
| -------------------- | -----: | ----------------------------------------- |
| 触发页面分析         | `POST` | `/api/v1/page/PAGE_ID/analyze`            |
| 获取页面指标         |  `GET` | `/api/v1/page/PAGE_ID/metrics`            |
| 获取分析网络请求     |  `GET` | `/api/v1/analysis/ANALYSIS_ID/requests`   |
| 获取 Lighthouse 报告 |  `GET` | `/api/v1/analysis/ANALYSIS_ID/lhr`        |
| 获取项目页面指标     |  `GET` | `/api/v1/projects/PROJECT_ID/pageMetrics` |
| 获取项目详情         |  `GET` | `/api/v1/projects/PROJECT_ID`             |
| 创建时间线注释       | `POST` | `/api/v1/project/PROJECT_ID/annotation`   |
| 列出时间线注释       |  `GET` | `/api/v1/project/PROJECT_ID/annotations`  |
| 获取 RUM 指标        |  `GET` | `/api/v1/project/PROJECT_ID/rumMetrics`   |

---

## 鉴权方式

HTTP API 使用 `x-api-key` Header 进行鉴权。

示例：

```bash
-H "x-api-key: API_KEY"
```

Node API 初始化：

```js
const { DebugBear } = require("debugbear");

const debugbear = new DebugBear(process.env.DEBUGBEAR_API_KEY);
```

推荐通过环境变量存储 API Key：

```bash
DEBUGBEAR_API_KEY=你的_API_KEY
```

---

## 常见对象与参数速查

### 页面分析参数

| 参数             | 说明               |
| ---------------- | ------------------ |
| `url`            | 覆盖测试 URL       |
| `buildTitle`     | 构建标题           |
| `commitHash`     | Git Commit Hash    |
| `inferBuildInfo` | 自动推断构建信息   |
| `customHeaders`  | 自定义 HTTP Header |
| `cookies`        | 自定义 Cookie      |

---

### 页面指标参数

| 参数           | 说明                              |
| -------------- | --------------------------------- |
| `from`         | 开始时间                          |
| `to`           | 结束时间                          |
| `before`       | 获取某时间之前的最近结果          |
| `environments` | 环境筛选，可用 `all` 包含非主环境 |

---

### RUM 参数

| 参数               | 说明                             |
| ------------------ | -------------------------------- |
| `from`             | 起始时间                         |
| `to`               | 结束时间                         |
| `metrics`          | 指定返回的 RUM 指标              |
| `filters`          | 过滤条件                         |
| `groupBy`          | 分组字段                         |
| `stat`             | 聚合方式，如 `p75`、`avg`、`p90` |
| `maxCategories`    | 最大返回分类数量                 |
| `orderBy`          | 排序字段，`count` 或 `value`     |
| `orderByDirection` | 排序方向，`asc` 或 `desc`        |

---

## Node API 方法汇总

| 功能                 | 方法                                                    |
| -------------------- | ------------------------------------------------------- |
| 运行页面分析         | `debugbear.pages.analyze(pageId, options)`              |
| 批量运行页面分析     | `debugbear.pages.analyzeBulk([pageId1, pageId2])`       |
| 获取页面指标         | `debugbear.pages.getMetrics(pageId, options)`           |
| 获取网络请求         | `debugbear.analyses.getRequests(analysisId)`            |
| 获取 Lighthouse 报告 | `debugbear.analyses.getLighthouseReport(analysisId)`    |
| 获取项目页面指标     | `debugbear.projects.getPageMetrics(projectId, options)` |
| 获取项目详情         | `debugbear.projects.get(projectId)`                     |
| 创建注释             | `debugbear.annotations.create(projectId, data)`         |
| 获取注释列表         | `debugbear.annotations.list(projectId)`                 |
| 获取 RUM 指标        | `debugbear.projects.getRumMetrics(projectId, options)`  |

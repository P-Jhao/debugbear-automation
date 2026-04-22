
# 使用 API 管理项目和页面

你可以使用 [Node API](/docs/api) 在 DebugBear 中创建和管理项目（Projects）与页面（Pages）。

请注意：要执行这些操作，你需要使用 **Admin API Key**，而不是项目级别的 API Key。

---

## 创建项目和页面

使用 `debugbear.projects.create` 创建一个新项目，然后在该项目上调用 `createPage` 来创建页面。

```js
const { DebugBear } = require("debugbear");

const debugbear = new DebugBear(process.env.DEBUGBEAR_API_KEY);

const project = await debugbear.projects.create({
  name: "My project",
});

const page = await project.createPage({
  name: "Example",
  url: "http://example.com/",
  region: "germany",
  testScheduleName: "Every 12 hours",
  deviceName: "Desktop",
  advancedSettings: ["Staging Basic Auth"],
  tags: ["Tag 1"],
});

console.log(page);
```


创建后的页面示例如下：

```json
{
  "id": "11111",
  "name": "Example",
  "url": "http://example.com/",
  "region": "germany",
  "testSchedules": [
    {
      "id": "22222",
      "name": "Every 12 hours"
    }
  ],
  "device": {
    "id": "33333",
    "name": "Desktop",
    "rtt": 40,
    "bandwidthKbps": 8192,
    "formFactor": "desktop",
    "cpuThrottling": 1
  },
  "advancedSettings": [
    {
      "id": "18",
      "name": "Staging Basic Auth",
      "type": "basicAuth"
    }
  ],
  "tags": ["Tag 1"]
}
```

### 使用 curl 创建项目

```bash
curl https://www.debugbear.com/api/v1/projects \
  -X POST \
  -H "x-api-key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Project Name"}'
```

返回结果示例：

```json
{ "id": "123456", "name": "Project Name", "pages": [] }
```

### 使用 curl 创建页面

```bash
curl https://www.debugbear.com/api/v1/projects/123456/pages \
  -X POST \
  -H "x-api-key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Example Homepage", "url": "https://example.com", "region": "uk", "tags": ["homepage"]}'
```

---

## 获取项目和页面列表

```js
const projects = await debugbear.projects.list();
```

返回结果示例：

```json
[
  {
    "id": 123456789,
    "name": "My project",
    "pages": [
      {
        "id": 999999,
        "name": "Example",
        "url": "http://example.com/",
        "region": "germany",
        "testSchedules": [
          {
            "id": "22222",
            "name": "Every 12 hours",
            "days": [0, 1, 2, 3, 4, 5, 6],
            "times": []
          }
        ],
        "device": {
          "id": "25321",
          "name": "Mobile",
          "rtt": 150,
          "bandwidthKbps": 1638,
          "formFactor": "mobile",
          "cpuThrottling": 4
        }
      }
    ]
  }
]
```

### 使用 curl 获取项目列表

```bash
curl https://www.debugbear.com/api/v1/projects \
  -H "x-api-key: API_KEY"
```

---

## 更新页面

```js
await debugbear.pages.update(PAGE_ID, {
  tags: ["staging"],
  advancedSettings: ["Staging Auth"],
});
```

---

## 删除项目

```js
const project = await debugbear.projects.create({
  name: "My project",
});

await project.delete();
```

---

## 删除页面

```js
const project = await debugbear.projects.create({
  name: "My project",
});

const page = await project.createPage({
  name: "Example",
  url: "http://example.com/",
});

await project.deletePage(page.id);
```

### 使用 curl 删除页面

```bash
curl https://www.debugbear.com/api/v1/pages/123456 \
  -X DELETE \
  -H "x-api-key: API_KEY"
```

---

## 可用的测试服务器区域

支持以下服务器区域：

- `australia`
- `belgium`
- `brazil`
- `canada`
- `chile`
- `finland`
- `france`
- `germany`
- `hongkong`
- `india`
- `indonesia`
- `israel`
- `italy`
- `japan`
- `mexico`
- `netherlands`
- `poland`
- `qatar`
- `singapore`
- `southafrica`
- `southkorea`
- `spain`
- `sweden`
- `switzerland`
- `taiwan`
- `uk`
- `us-east`
- `us-central`
- `us-ca`
- `us-west`

---

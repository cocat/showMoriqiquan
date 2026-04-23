# 派生内容层后端方案 v1

> 适用项目：门塔特的视界
> 目标：在保留现有日报发布库的前提下，新增一层由 LLM 生成的结构化“判断对象”，供前端的 `今日信号 / 本周 Playbook / 信号看板` 三类页面复用。

---

## 一、为什么要做派生内容层

当前后端 schema 已经能稳定产出这些核心原料：

- `report_overview`
- `report_news_briefs`
- `report_alerts`
- `report_topic_comparison`
- `report_market_snapshot`
- `report_sentiment`

这些数据足够支撑旧版日报，但还不够直接支撑新版前端产品结构。  
新版前端真正需要的是更高一层的内容对象：

- `thesis`
- `market_view`
- `confirmation`
- `theme_state`
- 后续再补：
  - `pathway`
  - `track_record`

因此最合适的做法不是重构现有表，而是：

**保留现有表作为“原料层”，再新增一层“派生内容层”。**

---

## 二、总体设计原则

### 1. 现有发布库不动
现有日报写库逻辑继续保留，不阻塞当前生产。

### 2. 派生内容与原料层分离
LLM 生成的新对象不要强塞进旧字段，而是单独存储。

### 3. 第一阶段优先支持日报页
先做：

- `thesis`
- `market_views`
- `confirmations`
- `themes`

这四类已经足够支撑：

- 首页今日信号预览
- 今日信号页
- Playbook 的主线基础版
- 信号看板基础版

### 4. 周报和对账第二阶段补齐
第二阶段再增加：

- `pathways`
- `track_record`

---

## 三、建议新增的数据表

当前阶段建议先新增 **2 张派生表**。

---

## 1. `report_derived_content`

### 用途
按 `report_id` 挂载一份日报派生内容。

### 推荐字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL PK | 是 | 自增主键 |
| `report_id` | VARCHAR(64) UNIQUE | 是 | 关联 `reports.report_id` |
| `content_version` | VARCHAR(32) | 是 | 内容结构版本，如 `v1` |
| `thesis_json` | JSONB | 否 | 当日核心判断对象 |
| `market_views_json` | JSONB | 否 | 新闻翻译对象数组 |
| `confirmations_json` | JSONB | 否 | 验证点对象数组 |
| `themes_json` | JSONB | 否 | 当日主线状态数组 |
| `llm_provider` | VARCHAR(32) | 否 | 如 `deepseek` |
| `llm_model` | VARCHAR(64) | 否 | 模型名 |
| `review_provider` | VARCHAR(32) | 否 | 如 `grok` |
| `review_model` | VARCHAR(64) | 否 | 校验模型名 |
| `review_status` | VARCHAR(16) | 否 | `pending / passed / flagged / failed` |
| `source_hash` | VARCHAR(128) | 否 | 原料层输入内容哈希，用于判断是否需要重算 |
| `created_at` | DATETIME | 是 | 创建时间 |
| `updated_at` | DATETIME | 是 | 更新时间 |

### 备注
- `report_id` 建议唯一，一份日报只对应一份派生对象集合
- 如果后续需要保留多版本，可以把唯一约束改成 `(report_id, content_version)`

---

## 2. `weekly_derived_content`

### 用途
按周聚合生成周度 Playbook 内容。

### 推荐字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL PK | 是 | 自增主键 |
| `week_key` | VARCHAR(32) UNIQUE | 是 | 周标识，如 `2026-W15` |
| `range_start` | DATE | 是 | 周开始日期 |
| `range_end` | DATE | 是 | 周结束日期 |
| `thesis_json` | JSONB | 否 | 周度核心判断 |
| `themes_json` | JSONB | 否 | 周度三大主线 |
| `pathways_json` | JSONB | 否 | A/B 情景路径 |
| `confirmations_json` | JSONB | 否 | 周度重点验证点 |
| `track_record_json` | JSONB | 否 | 上周对账 |
| `llm_provider` | VARCHAR(32) | 否 | 如 `deepseek` |
| `llm_model` | VARCHAR(64) | 否 | 模型名 |
| `review_provider` | VARCHAR(32) | 否 | 如 `grok` |
| `review_model` | VARCHAR(64) | 否 | 校验模型名 |
| `review_status` | VARCHAR(16) | 否 | `pending / passed / flagged / failed` |
| `source_report_ids` | JSONB | 否 | 本周使用了哪些日报 ID |
| `created_at` | DATETIME | 是 | 创建时间 |
| `updated_at` | DATETIME | 是 | 更新时间 |

---

## 四、第一阶段建议的 JSON 结构

下面这些 JSON 结构，是给 LLM 输出和前端消费共同使用的建议格式。

---

## 1. `thesis_json`

```json
{
  "id": "thesis_20260408_daily_01",
  "scope": "daily",
  "title": "今天市场真正交易的是利率压力能否继续缓和",
  "summary": "headline 很多，但市场定价核心仍然是收益率和美元方向。",
  "signal_level": "neutral",
  "confidence": 78,
  "status": "active",
  "timeframe": "today",
  "based_on_triggers": ["trigger_20260408_cpi"],
  "related_themes": ["theme_rates", "theme_tech"],
  "invalidations": [
    "10年美债收益率快速上行",
    "美元重新走强且科技股同步转弱"
  ],
  "editor_note": "这条判断高于当天大部分 headline。"
}
```

---

## 2. `market_views_json`

```json
[
  {
    "id": "mv_20260408_rates",
    "display_topic": "通胀与利率",
    "trigger_ref": "report_news_briefs:123",
    "surface_story": "CPI 低于预期",
    "market_interpretation": "市场真正交易的是利率压力缓和",
    "why_it_matters": "这会提高高估值主线的估值容忍度。",
    "misread_risk": "不能只看 headline，需要确认收益率和美元是否同步回落。",
    "affected_layer": "rates",
    "priority": 1
  }
]
```

说明：
- `trigger_ref` 可以先用“来源定位字符串”，不必第一阶段就强依赖真正外键
- 后续稳定后再改成真实 `trigger_id`

---

## 3. `confirmations_json`

```json
[
  {
    "id": "confirmation_us10y",
    "thesis_ref": "thesis_20260408_daily_01",
    "name": "10 年美债收益率",
    "type": "rates",
    "priority": "high",
    "check_window": "premarket",
    "expected_direction": "down",
    "current_status": "confirmed",
    "supports_thesis": true,
    "value_snapshot": "4.12%",
    "notes": "若继续下行，成长股更容易延续强势。"
  }
]
```

---

## 4. `themes_json`

```json
[
  {
    "id": "theme_rates",
    "name": "利率路径",
    "summary": "收益率变化仍然主导高估值资产定价。",
    "direction": "中性偏紧",
    "status": "watching",
    "strength": 72,
    "next_focus": "周中数据后收益率是否继续下行",
    "editor_note": "当前仍高于地缘风险主线。",
    "related_refs": {
      "topic_ids": ["macro_rates"],
      "alert_ids": [1001, 1003]
    }
  }
]
```

---

## 5. `pathways_json`（第二阶段）

```json
[
  {
    "id": "pathway_weekly_a",
    "thesis_ref": "thesis_2026W15_01",
    "name": "A 情景：利率压力继续缓和",
    "trigger_condition": "周中数据和联储表态继续压低利率压力",
    "expected_market_response": "科技股和成长股更可能继续获得溢价",
    "key_confirmations": ["confirmation_us10y", "confirmation_ndx"],
    "probability_level": "high",
    "timeframe": "this_week",
    "risk_if_wrong": "市场会快速从扩张切回定价约束"
  }
]
```

---

## 6. `track_record_json`（第二阶段）

```json
{
  "thesis_ref": "thesis_2026W14_01",
  "result": "partially_confirmed",
  "what_played_out": "利率主线被验证，科技龙头继续主导指数情绪",
  "what_failed": "原油扰动没有扩散成更大范围的风险主线",
  "what_changed": "本周继续关注利率是否重新收紧美股估值空间",
  "editor_note": "整体判断方向正确，但对主题扩散速度需要下调预期。"
}
```

---

## 五、现有表到派生对象的映射关系

### 1. `thesis_json`

建议输入：

- `report_overview.content`
- `report_sentiment.score`
- `report_sentiment.level`
- `report_topic_comparison`
- `report_alerts`

说明：
- `report_overview` 提供整体叙事
- `report_sentiment` 提供市场状态
- `report_topic_comparison` 提供主线热度
- `report_alerts` 提供当天最强触发因素

---

### 2. `market_views_json`

建议输入：

- `report_news_briefs.body`
- `report_news_briefs.impact`
- `report_news_briefs.topic_name`
- `report_alerts.ai_summary`
- `report_alerts.direction_note`

说明：
- 第一阶段可以优先从 `report_news_briefs` 派生
- `report_alerts` 用来补充更尖锐的解释或误读风险

---

### 3. `confirmations_json`

建议输入：

- `report_market_snapshot`
- `report_alerts.assets`
- `report_alerts.direction`
- `report_sentiment`

说明：
- `market_snapshot` 提供最主要的验证对象
- `alerts.assets` 提供相关资产
- `direction` 提供预期方向

---

### 4. `themes_json`

建议输入：

- `report_topic_comparison`
- `report_news_briefs.topic_name`
- `report_alerts.topic_name`

说明：
- `topic_comparison` 是最核心来源
- `news_briefs` 和 `alerts` 用来增强解释与优先级

---

### 5. `pathways_json`

建议输入（第二阶段）：

- 最近 5-7 天 `report_derived_content.thesis_json`
- 最近 5-7 天 `themes_json`
- 最近 5-7 天 `confirmations_json`
- 最新 `report_overview.content`

---

### 6. `track_record_json`

建议输入（第二阶段）：

- 历史 `thesis_json`
- 后续几天 `confirmations_json`
- 后续几天 `themes_json`

---

## 六、派生生成任务建议

建议新增两个任务，而不是改原有日报生成任务。

---

## 1. `derive_daily_content.py`

### 输入

- `reports`
- `report_sentiment`
- `report_overview`
- `report_news_briefs`
- `report_alerts`
- `report_topic_comparison`
- `report_market_snapshot`

### 输出

写入 `report_derived_content`

### 第一阶段产出

- `thesis_json`
- `market_views_json`
- `confirmations_json`
- `themes_json`

---

## 2. `derive_weekly_content.py`

### 输入

- 最近 5-7 天 `report_derived_content`
- 最近 5-7 天 `reports`

### 输出

写入 `weekly_derived_content`

### 第一阶段产出

- `thesis_json`
- `themes_json`

### 第二阶段补充

- `pathways_json`
- `track_record_json`

---

## 七、LLM 分工建议

### 1. DeepSeek
负责：

- 结构化生成 `thesis_json`
- 结构化生成 `market_views_json`
- 结构化生成 `confirmations_json`
- 结构化生成 `themes_json`
- 第二阶段生成 `pathways_json`

### 2. Grok
负责：

- 检查 `thesis_json` 是否和原始输入矛盾
- 检查 `market_views_json` 是否有明显事实过度推断
- 检查 `pathways_json` 是否与输入数据冲突
- 第二阶段校验 `track_record_json`

### 3. 分工原则

- DeepSeek：生成
- Grok：校验

不要让 Grok 重写内容，主要做“事实偏差检查”和“结构完整性检查”。

---

## 八、推荐的处理顺序

### 第一阶段

1. 保持现有日报写库不动
2. 新增 `report_derived_content`
3. 实现 `derive_daily_content.py`
4. 用 DeepSeek 生成：
   - `thesis_json`
   - `market_views_json`
   - `confirmations_json`
   - `themes_json`
5. 可选：Grok 校验后更新 `review_status`
6. 前端首页 / 今日信号 / 看板基础版优先接入

### 第二阶段

1. 新增 `weekly_derived_content`
2. 实现 `derive_weekly_content.py`
3. 生成：
   - `thesis_json`
   - `themes_json`
   - `pathways_json`
4. 前端接 `Playbook`

### 第三阶段

1. 增加 `track_record_json`
2. 把历史判断正式纳入对账系统

---

## 九、前端消费建议

### 首页
优先消费：

- `report_derived_content.thesis_json`
- `report_derived_content.themes_json`

### 今日信号页
优先消费：

- `thesis_json`
- `market_views_json`
- `confirmations_json`

### 本周 Playbook
优先消费：

- `weekly_derived_content.thesis_json`
- `weekly_derived_content.themes_json`
- 第二阶段接 `pathways_json`

### 信号看板
优先消费：

- `themes_json`
- `confirmations_json`

---

## 十、当前最小落地建议

如果现在只做最小版本，请先完成这三件事：

1. 新增 `report_derived_content`
2. 生成 `thesis_json`
3. 生成 `market_views_json` 和 `confirmations_json`

这样新版前端最关键的内容就能先跑起来。

---

## 十一、一句话总结

**不要推翻现有日报 schema，而是把它们作为原料层，再新增一层由 DeepSeek 生成、Grok 校验的派生内容层。**

这样改动最小、复用最多，也最适合后续把新版三类页面真正接上可复用的数据结构。

export type SignalLevel = 'offense' | 'neutral' | 'defense'
export type ThemeStatus = 'strengthening' | 'watching' | 'weakening' | 'invalidated' | 'new'
export type ConfirmationPriority = 'high' | 'medium' | 'low'
export type ConfirmationStatus = 'confirmed' | 'unconfirmed' | 'mixed' | 'failed'

export interface DerivedThesis {
  id: string
  scope: 'daily' | 'weekly' | 'board'
  title: string
  summary: string
  signal_level: SignalLevel | null
  confidence: number | null
  status: 'active' | 'watching' | 'invalidated' | 'completed'
  timeframe: string | null
  based_on_triggers: string[]
  related_themes: string[]
  invalidations: string[]
  editor_note: string | null
}

export interface DerivedTheme {
  id: string
  name: string
  summary: string
  direction: string
  status: ThemeStatus
  strength: number | null
  next_focus: string | null
  editor_note: string | null
  related_refs: {
    topic_ids: string[]
    alert_ids: number[]
  }
}

export interface DerivedMarketView {
  id: string
  display_topic: string | null
  trigger_ref: string | null
  surface_story: string
  market_interpretation: string
  why_it_matters: string
  misread_risk: string | null
  affected_layer: 'rates' | 'dollar' | 'index' | 'sector' | 'risk_appetite' | 'commodity' | null
  priority: number | null
}

export interface DerivedConfirmation {
  id: string
  thesis_ref: string
  name: string
  type: 'rates' | 'dollar' | 'index' | 'sector' | 'volatility' | 'commodity' | 'sentiment'
  priority: ConfirmationPriority
  check_window: 'premarket' | 'open' | 'intraday' | 'weekly' | null
  expected_direction: string | null
  current_status: ConfirmationStatus
  supports_thesis: boolean | null
  value_snapshot: string | null
  notes: string | null
}

export interface DerivedPathway {
  id: string
  thesis_ref: string
  name: string
  trigger_condition: string
  expected_market_response: string
  key_confirmations: string[]
  probability_level: 'high' | 'medium' | 'low' | null
  timeframe: string | null
  risk_if_wrong: string | null
  editor_note: string | null
}

export interface DerivedTrackRecord {
  thesis_ref: string
  result: 'confirmed' | 'partially_confirmed' | 'invalidated'
  what_played_out: string | null
  what_failed: string | null
  what_changed: string | null
  editor_note: string | null
}

export const mockDailyContent = {
  report_id: '20260408',
  report_date: '2026-04-08',
  generated_at: '2026-04-08 10:52:56',
  thesis_json: {
    id: 'thesis_20260408_daily_01',
    scope: 'daily',
    title: '今天真正主导市场的，不是 headline 数量，而是避险情绪是否继续压过风险偏好。',
    summary: '地缘冲突把市场重新拉回避险模式，但真正需要确认的不是消息本身，而是黄金、VIX、美元和科技股会不会继续给出同向反馈。',
    signal_level: 'defense',
    confidence: 79,
    status: 'active',
    timeframe: 'today',
    based_on_triggers: ['alert:94', 'alert:93', 'brief:地缘与能源'],
    related_themes: ['theme_geopolitical_risk', 'theme_safe_haven_demand', 'theme_tech_fragility'],
    invalidations: ['地缘风险快速缓和', '风险资产强反弹且避险资产同步回落'],
    editor_note: '这条判断高于当天多数 headline。',
  } satisfies DerivedThesis,
  themes_json: [
    {
      id: 'theme_geopolitical_risk',
      name: '地缘政治风险升级',
      summary: '这是当前最强主线，正在把市场从基本面重新拉回避险与安全边际定价。',
      direction: '偏避险',
      status: 'strengthening',
      strength: 88,
      next_focus: '关键期限后的实际行动以及航道风险是否升级',
      editor_note: '短期内压过多数基本面因素。',
      related_refs: { topic_ids: ['地缘与能源'], alert_ids: [94, 93, 77] },
    },
    {
      id: 'theme_safe_haven_demand',
      name: '避险资产需求',
      summary: '黄金、白银和波动率的同步走强，说明市场正在为更差的尾部情景买保险。',
      direction: '偏利多避险资产',
      status: 'strengthening',
      strength: 81,
      next_focus: '黄金能否站稳高位以及 VIX 是否继续上行',
      editor_note: '这是情绪层最直接的确认主线。',
      related_refs: { topic_ids: ['贵金属（黄金/白银/铂金）'], alert_ids: [74, 95] },
    },
    {
      id: 'theme_tech_fragility',
      name: '科技股韧性测试',
      summary: '指数表面并未崩掉，但真正要看的是科技龙头还能不能继续顶住避险情绪的压力。',
      direction: '偏脆弱待验证',
      status: 'watching',
      strength: 67,
      next_focus: '纳指和龙头科技股能否继续相对抗跌',
      editor_note: '这是连接风险偏好与指数表现的桥梁主线。',
      related_refs: { topic_ids: ['科技股'], alert_ids: [78] },
    },
  ] satisfies DerivedTheme[],
  market_views_json: [
    {
      id: 'mv_20260408_01',
      display_topic: '地缘政治风险升级',
      trigger_ref: 'brief:地缘与能源',
      surface_story: '美伊对峙升级、关键航道与石油设施面临更高不确定性。',
      market_interpretation: '市场真正交易的是避险情绪和需求破坏，而不是单纯的供应中断溢价。',
      why_it_matters: '这会直接改变风险偏好、资金配置方向和跨资产反应顺序。',
      misread_risk: '不要把原油 headline 机械理解成油价一定上涨，市场可能优先交易衰退压力。',
      affected_layer: 'commodity',
      priority: 1,
    },
    {
      id: 'mv_20260408_02',
      display_topic: '避险资产需求',
      trigger_ref: 'alert:74',
      surface_story: '黄金、白银和波动率一起走强。',
      market_interpretation: '市场正在用传统避险资产和期权定价来对冲尾部风险。',
      why_it_matters: '这说明 headline 已经开始转化成真实资产配置动作，而不是只停留在媒体层。',
      misread_risk: '不能把贵金属大涨只理解成短线投机，它更可能是情绪与信用担忧的叠加。',
      affected_layer: 'risk_appetite',
      priority: 2,
    },
    {
      id: 'mv_20260408_03',
      display_topic: '科技股韧性',
      trigger_ref: 'overview:main',
      surface_story: '指数没有立刻大跌，但 VIX 已经抬升。',
      market_interpretation: '市场在“坏消息带来更宽松预期”和“风险偏好收缩”之间拉扯，科技股成了最关键的承压测试点。',
      why_it_matters: '如果科技龙头扛不住，当前的表面稳定很可能只是延后反应。',
      misread_risk: '不要把指数暂时没跌理解成风险偏好完好无损。',
      affected_layer: 'index',
      priority: 3,
    },
  ] satisfies DerivedMarketView[],
  confirmations_json: [
    {
      id: 'confirmation_20260408_gold',
      thesis_ref: 'thesis_20260408_daily_01',
      name: '黄金期货',
      type: 'commodity',
      priority: 'high',
      check_window: 'premarket',
      expected_direction: '上涨',
      current_status: 'confirmed',
      supports_thesis: true,
      value_snapshot: '4845 美元/盎司',
      notes: '高位延续说明避险需求仍在接力。',
    },
    {
      id: 'confirmation_20260408_vix',
      thesis_ref: 'thesis_20260408_daily_01',
      name: 'VIX 恐慌指数',
      type: 'volatility',
      priority: 'high',
      check_window: 'open',
      expected_direction: '上涨',
      current_status: 'confirmed',
      supports_thesis: true,
      value_snapshot: '盘中持续抬升',
      notes: '说明期权市场已经为更大波动定价。',
    },
    {
      id: 'confirmation_20260408_dxy',
      thesis_ref: 'thesis_20260408_daily_01',
      name: '美元指数',
      type: 'dollar',
      priority: 'medium',
      check_window: 'intraday',
      expected_direction: '走强或至少维持强势',
      current_status: 'mixed',
      supports_thesis: null,
      value_snapshot: null,
      notes: '需要继续确认美元是否真正接过避险定价角色。',
    },
    {
      id: 'confirmation_20260408_ndx',
      thesis_ref: 'thesis_20260408_daily_01',
      name: '纳指 / 科技龙头',
      type: 'index',
      priority: 'high',
      check_window: 'intraday',
      expected_direction: '承压或相对转弱',
      current_status: 'mixed',
      supports_thesis: null,
      value_snapshot: null,
      notes: '这是今天风险偏好是否真正收缩的关键验证点。',
    },
  ] satisfies DerivedConfirmation[],
}

export const mockWeeklyContent = {
  thesis_json: {
    id: 'thesis_2026w15_weekly_01',
    scope: 'weekly',
    title: '这一周的关键，不是 headline 会不会更多，而是利率路径和避险主线谁能继续接管市场。',
    summary: '如果利率压力缓和，科技股和高估值主线还有延续空间；如果避险和收益率重新共振，本周更像一次定价修正。',
    signal_level: null,
    confidence: 74,
    status: 'active',
    timeframe: 'this week',
    based_on_triggers: ['weekly:macro', 'weekly:geopolitics'],
    related_themes: ['theme_rates', 'theme_tech_valuation', 'theme_geopolitical_risk'],
    invalidations: ['利率和避险双双快速回落', '市场重新回到全面风险扩张'],
    editor_note: '本周真正重要的是判断哪条旧主线会继续，哪条会被打断。',
  } satisfies DerivedThesis,
  themes_json: [
    {
      id: 'theme_rates',
      name: '利率路径',
      summary: '收益率仍然是决定高估值资产能否继续获得溢价的核心约束。',
      direction: '中性偏紧',
      status: 'watching',
      strength: 82,
      next_focus: '周中数据和联储相关表态',
      editor_note: '如果重新上行，会迅速压制风险偏好。',
      related_refs: { topic_ids: ['FOMC/美联储'], alert_ids: [81, 78] },
    },
    {
      id: 'theme_tech_valuation',
      name: '科技股估值',
      summary: '科技龙头能否继续承接买盘，决定本周指数情绪会不会维持稳定。',
      direction: '偏强待验证',
      status: 'watching',
      strength: 76,
      next_focus: '龙头股盘前表现与纳指相对强弱',
      editor_note: '是本周最敏感的情绪承压点。',
      related_refs: { topic_ids: ['科技股'], alert_ids: [78] },
    },
    {
      id: 'theme_geopolitical_risk',
      name: '地缘与避险',
      summary: '地缘风险仍可能随时切回市场主线，尤其在油价、黄金和 VIX 出现共振时。',
      direction: '偏扰动',
      status: 'new',
      strength: 71,
      next_focus: '关键期限后的实际行动',
      editor_note: '当前不是主导一切，但足够随时升级成主线。',
      related_refs: { topic_ids: ['地缘与能源'], alert_ids: [94, 93, 77] },
    },
  ] satisfies DerivedTheme[],
  pathways_json: [
    {
      id: 'pathway_2026w15_a',
      thesis_ref: 'thesis_2026w15_weekly_01',
      name: 'A 情景：利率压力继续缓和',
      trigger_condition: '周中数据和联储表态继续压低利率压力',
      expected_market_response: '科技股和成长股更可能继续获得溢价，市场延续风险扩张。',
      key_confirmations: ['confirmation_us10y_down', 'confirmation_ndx_up'],
      probability_level: 'medium',
      timeframe: 'this week',
      risk_if_wrong: '市场会重新回到收益率主导的估值压缩逻辑。',
      editor_note: '这是延续路径，不是切换路径。',
    },
    {
      id: 'pathway_2026w15_b',
      thesis_ref: 'thesis_2026w15_weekly_01',
      name: 'B 情景：收益率与避险重新共振',
      trigger_condition: '收益率重新抬头，同时避险资产继续走强',
      expected_market_response: '市场从讲故事切回讲约束，高估值方向更容易承压。',
      key_confirmations: ['confirmation_us10y_up', 'confirmation_vix_up'],
      probability_level: 'high',
      timeframe: 'this week',
      risk_if_wrong: '若科技股继续韧性上行，说明市场仍在延续旧逻辑。',
      editor_note: '这是更需要警惕的切换路径。',
    },
  ] satisfies DerivedPathway[],
  track_record_json: {
    thesis_ref: 'thesis_2026w14_weekly_01',
    result: 'partially_confirmed',
    what_played_out: '利率路径继续主导估值，科技股仍然是最关键的情绪承接点。',
    what_failed: '原油与地缘扰动还没有全面扩散成全市场主线。',
    what_changed: '本周需要提高对避险资产共振的敏感度，不再只看 headline 数量。',
    editor_note: '方向对，但要下调对主题扩散速度的预期。',
  } satisfies DerivedTrackRecord,
}

export const mockBoardContent = {
  updated_at: '2026-04-08',
  themes_json: [
    {
      id: 'theme_rates',
      name: '利率路径',
      summary: '收益率变化仍然主导高估值资产定价。',
      direction: '中性偏紧',
      status: 'watching',
      strength: 82,
      next_focus: '周中数据后收益率是否继续上行',
      editor_note: '当前仍是市场最稳定的硬约束。',
      related_refs: { topic_ids: ['FOMC/美联储'], alert_ids: [81, 78] },
    },
    {
      id: 'theme_tech_valuation',
      name: '科技股动能',
      summary: '科技龙头依旧是指数情绪的第一观察点。',
      direction: '偏强待确认',
      status: 'strengthening',
      strength: 79,
      next_focus: '龙头股盘前反馈',
      editor_note: '如果龙头失速，指数韧性会明显下降。',
      related_refs: { topic_ids: ['科技股'], alert_ids: [78] },
    },
    {
      id: 'theme_geopolitical_risk',
      name: '地缘与避险',
      summary: 'headline 本身不是重点，关键在于它有没有升级成跨资产共振。',
      direction: '偏扰动',
      status: 'new',
      strength: 71,
      next_focus: '黄金、油价和 VIX 是否继续共振',
      editor_note: '这条线一旦升级，会迅速改变市场节奏。',
      related_refs: { topic_ids: ['地缘与能源'], alert_ids: [94, 93, 77] },
    },
    {
      id: 'theme_risk_appetite',
      name: '风险偏好',
      summary: '市场并未全面转向防守，但对新增风险的容忍度已经明显下降。',
      direction: '收缩边缘',
      status: 'watching',
      strength: 68,
      next_focus: '纳指与 VIX 的背离是否扩大',
      editor_note: '这是判断市场是否真正切换节奏的总开关。',
      related_refs: { topic_ids: ['情绪'], alert_ids: [95] },
    },
  ] satisfies DerivedTheme[],
  recent_updates: [
    {
      time: '04/08',
      title: '地缘与避险从噪音升级为新信号',
      body: '因为黄金、VIX 与 headline 同步抬升，这条线已经值得单独跟踪。',
    },
    {
      time: '04/07',
      title: '利率路径从延续逻辑转入待验证',
      body: '市场开始重新确认周中数据会不会打断之前的宽松预期。',
    },
    {
      time: '04/06',
      title: '科技股动能仍在，但依赖估值约束不再上升',
      body: '龙头股仍撑住情绪，但无法完全脱离利率影响。',
    },
  ],
}

export function formatSignalLevel(level: SignalLevel | null): string {
  if (level === 'offense') return '进攻'
  if (level === 'defense') return '防守'
  return '观望'
}

export function formatThemeStatus(status: ThemeStatus): string {
  switch (status) {
    case 'strengthening':
      return '强化中'
    case 'watching':
      return '待验证'
    case 'weakening':
      return '转弱中'
    case 'invalidated':
      return '已失效'
    case 'new':
      return '新信号'
    default:
      return status
  }
}

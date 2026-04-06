import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  ChartCandlestick,
  CircleAlert,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const heroStats = [
  { value: '06:50', label: '晨报交付时间' },
  { value: '120+', label: '核心跟踪信号' },
  { value: '7x24', label: '主题脉络更新' },
  { value: '3 min', label: '单次阅读成本' },
]

const serviceCards = [
  {
    title: '开盘前决策视图',
    description: '用更轻的阅读结构，把风险等级、重点事件和建议动作压缩在同一屏。',
    icon: Sparkles,
    accent: 'amber',
  },
  {
    title: '跨资产联动观察',
    description: '指数、资金、宏观、主题与期权情绪并排呈现，减少来回切换。',
    icon: Globe2,
    accent: 'blue',
  },
  {
    title: 'AI 风险优先级',
    description: '红黄两级预警直接排序，帮助先处理需要动作的部分，再看背景信息。',
    icon: ShieldCheck,
    accent: 'rose',
  },
]

const workflowCards = [
  {
    step: '01',
    title: '先看风险体温',
    description: '情绪指数与预警密度告诉你今天是稳态、波动还是需要防守。',
  },
  {
    step: '02',
    title: '再看关键事件',
    description: '重要新闻和主题热度聚合在一起，方便快速判断驱动来源。',
  },
  {
    step: '03',
    title: '最后看执行建议',
    description: '用方向提示和资产线索，把信息直接变成观察清单。',
  },
]

const pulseCards = [
  { name: 'A 股情绪', value: '+12%', tone: 'up' },
  { name: '港股科技', value: '修复中', tone: 'flat' },
  { name: '美元流动性', value: '关注', tone: 'warn' },
  { name: '黄金避险', value: '+1.8%', tone: 'up' },
]

const topicCards = [
  'AI 算力与半导体',
  '出海链与消费修复',
  '大宗商品轮动',
  '美债与汇率压力',
]

export default function HomeV2Page() {
  return (
    <div className="new-home-shell">
      <section className="new-home-hero">
        <div className="new-home-orb new-home-orb-left" />
        <div className="new-home-orb new-home-orb-right" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="relative z-10">
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                Professional market brief, redesigned
              </div>
              <h1
                className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                把专业金融信息做得更清晰，也更适合每天打开。
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                这是保留旧版后的新版首页提案。视觉上更现代，阅读节奏更轻，但仍然保留金融产品应有的专业感、数据感和可信度。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  进入今日报告
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="new-home-secondary-btn">
                  返回旧版首页
                </Link>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroStats.map((item) => (
                  <div key={item.label} className="new-home-stat-card">
                    <div className="new-home-stat-value">{item.value}</div>
                    <div className="new-home-stat-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="new-home-terminal-card">
              <div className="new-home-terminal-top">
                <div>
                  <p className="new-home-panel-kicker">Today&apos;s market pulse</p>
                  <h2 className="new-home-terminal-title">晨间总览面板</h2>
                </div>
                <div className="new-home-status-chip">
                  <BellRing className="h-4 w-4" />
                  风险中性偏谨慎
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {pulseCards.map((item) => (
                  <div key={item.name} className={`new-home-pulse-card new-home-pulse-${item.tone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-500">{item.name}</span>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-4 text-2xl font-semibold text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="new-home-chart-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="new-home-panel-kicker">Signal dashboard</p>
                    <h3 className="text-lg font-semibold text-slate-950">数据与事件同屏联动</h3>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                    AI Summary
                  </div>
                </div>
                <div className="mt-6 new-home-bars">
                  <span style={{ height: '42%' }} />
                  <span style={{ height: '68%' }} />
                  <span style={{ height: '56%' }} />
                  <span style={{ height: '84%' }} />
                  <span style={{ height: '61%' }} />
                  <span style={{ height: '92%' }} />
                  <span style={{ height: '73%' }} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="new-home-mini-metric">
                    <CircleAlert className="h-4 w-4 text-rose-500" />
                    <div>
                      <p>重点预警</p>
                      <strong>08 条</strong>
                    </div>
                  </div>
                  <div className="new-home-mini-metric">
                    <BarChart3 className="h-4 w-4 text-sky-500" />
                    <div>
                      <p>跨资产信号</p>
                      <strong>26 组</strong>
                    </div>
                  </div>
                  <div className="new-home-mini-metric">
                    <Layers3 className="h-4 w-4 text-amber-600" />
                    <div>
                      <p>热门主题</p>
                      <strong>04 个</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Home direction</p>
              <h2
                className="new-home-section-title"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                更像现代金融产品首页，而不是单纯的数据陈列页。
              </h2>
            </div>
            <p className="new-home-section-copy">
              设计重点是“高级但不压迫，专业但不沉闷”。首页会先建立信任感，再把核心价值用卡片和面板化语言讲清楚。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {serviceCards.map(({ title, description, icon: Icon, accent }) => (
              <article key={title} className={`new-home-service-card new-home-service-${accent}`}>
                <div className="new-home-service-icon">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section new-home-section-contrast">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="new-home-insight-panel">
              <p className="new-home-kicker">Reading flow</p>
              <h2
                className="new-home-section-title text-white"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                新首页适合 3 分钟内完成首次判断。
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                用户先被首页吸引，再用更顺手的阅读路径进入报告详情。这种结构更适合产品化，而不是只展示内容本身。
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {topicCards.map((item) => (
                  <span key={item} className="new-home-topic-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {workflowCards.map((item) => (
                <article key={item.step} className="new-home-flow-card">
                  <span className="new-home-flow-step">{item.step}</span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-cta-panel">
            <div>
              <p className="new-home-kicker">Preview route</p>
              <h2
                className="new-home-section-title mb-3"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                新版首页已经独立补充完成。
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                你现在可以保留旧版首页继续使用，同时单独预览这个更年轻、更产品化的新版本。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/home-v2" className="new-home-primary-btn">
                当前页面
                <ChartCandlestick className="h-4 w-4" />
              </Link>
              <Link href="/reports/latest" className="new-home-ghost-btn">
                查看报告详情
              </Link>
              <Link href="/" className="new-home-ghost-btn">
                对比旧版首页
              </Link>
            </div>
            <div className="new-home-cta-note">
              <BriefcaseBusiness className="h-4 w-4 text-amber-700" />
              如果你认可这个方向，下一步我们可以继续把列表页、详情页也统一成这一套视觉系统。
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

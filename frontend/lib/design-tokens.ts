/**
 * Mentat 设计系统 Token
 *
 * 仅做语义分组，不改变现有颜色值，方便在组件里统一使用。
 */

export const colors = {
  // 基础层级
  bg: '#1A1A1B',
  bgCard: '#1E1E1F',
  bgHover: '#222222',
  border: '#3A3A3A',

  // 语义别名（供组件使用）
  bgRoot: '#1A1A1B',
  bgElevated: '#1E1E1F',
  bgSubtle: '#222222',
  borderWeak: '#2A2A2A',
  borderStrong: '#3A3A3A',

  text: '#E5E5E5',
  textMuted: '#999999',
  textFaint: '#888888',

  // 品牌色
  gold: '#C19A6B',
  goldDim: 'rgba(193, 154, 107, 0.1)',
  goldActive: 'rgba(193, 154, 107, 0.2)',

  // 风险色阶
  red: '#FF4444',
  green: '#4CAF50',
  blue: '#5A9FD4',
  purple: '#9B8DC4',
  warning: '#D4A55A',
} as const

export const navIds = [
  { id: 'sentiment', label: '情绪仪表盘' },
  { id: 'market', label: '市场行情' },
  { id: 'overview', label: '市场综述' },
  { id: 'alerts', label: '核心预警' },
  { id: 'briefs', label: '新闻简报' },
  { id: 'options', label: '期权策略' },
  { id: 'topics', label: '主题热度' },
] as const

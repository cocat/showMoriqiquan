/**
 * Mentat 设计系统 Token
 */

export const colors = {
  bg: '#1A1A1B',
  bgCard: '#1E1E1F',
  bgHover: '#222222',
  border: '#3A3A3A',
  text: '#E5E5E5',
  muted: '#999999',
  gold: '#C19A6B',
  goldDim: 'rgba(193, 154, 107, 0.1)',
  goldActive: 'rgba(193, 154, 107, 0.2)',
  red: '#FF4444',
  green: '#4CAF50',
  blue: '#5A9FD4',
  purple: '#9B8DC4',
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

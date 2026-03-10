'use client'

import { Fragment } from 'react'

export interface OptionsData {
  body_text?: string
  direction?: string
  candidates?: Array<{
    contract_code?: string
    strike?: number
    expiry?: string
    iv?: number
    leverage?: number
    reason?: string
    rank?: number
    bid?: number
    ask?: number
    delta?: number
  }>
}

export function OptionsPanel({ data }: { data: OptionsData }) {
  const candidates = data.candidates ?? []

  return (
    <section id="options" className="scroll-mt-20">
      <div className="report-card">
        <div className="report-card-header purple">期权策略</div>
        {data.body_text && (
          <div className="option-body">{data.body_text}</div>
        )}
        {candidates.length > 0 && (
          <div className="option-candidates">
            <div className="option-candidates-title">
              {data.direction && (
                <span
                  className="option-dir-badge"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 2,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: data.direction === 'put' ? 'var(--red-mid)' : 'var(--green-mid)',
                    color: data.direction === 'put' ? 'var(--red)' : 'var(--green)',
                  }}
                >
                  {data.direction}
                </span>
              )}
              推荐合约
            </div>
            <table className="option-table">
              <thead>
                <tr>
                  <th>合约</th>
                  <th>行权</th>
                  <th>到期</th>
                  <th>IV</th>
                  <th>杠杆</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <Fragment key={i}>
                    <tr>
                      <td>{c.contract_code ?? '-'}</td>
                      <td>{c.strike != null ? c.strike : '-'}</td>
                      <td>{c.expiry ?? '-'}</td>
                      <td>{c.iv != null ? `${c.iv}%` : '-'}</td>
                      <td>{c.leverage != null ? `${c.leverage}x` : '-'}</td>
                    </tr>
                    {c.reason && (
                      <tr className="candidate-reason-row" style={{ padding: 0, borderTop: 'none' }}>
                        <td colSpan={5} style={{ padding: '8px 12px 12px', background: 'var(--ghost)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                          {c.reason}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

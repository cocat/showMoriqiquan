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
    <section id="options" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="report-card">
        <div className="report-card-header purple">延伸交易视角</div>
        <div className="px-4 pt-4 pb-1 text-sm leading-7 text-slate-500 sm:px-5">
          这一段是从研究走向交易的附加层，帮助你把结论继续映射到更具体的期权观察，而不是替代日报主判断。
        </div>

        {data.body_text ? (
          <div className="option-body">{data.body_text}</div>
        ) : null}

        {candidates.length > 0 ? (
          <div className="option-candidates">
            <div className="option-candidates-title">
              {data.direction ? (
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
              ) : null}
              观察合约
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
                {candidates.map((candidate, i) => (
                  <Fragment key={i}>
                    <tr>
                      <td>{candidate.contract_code ?? '-'}</td>
                      <td>{candidate.strike != null ? candidate.strike : '-'}</td>
                      <td>{candidate.expiry ?? '-'}</td>
                      <td>{candidate.iv != null ? `${candidate.iv}%` : '-'}</td>
                      <td>{candidate.leverage != null ? `${candidate.leverage}x` : '-'}</td>
                    </tr>
                    {candidate.reason ? (
                      <tr className="candidate-reason-row" style={{ padding: 0, borderTop: 'none' }}>
                        <td colSpan={5} style={{ padding: '8px 12px 12px', background: 'var(--ghost)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                          {candidate.reason}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}

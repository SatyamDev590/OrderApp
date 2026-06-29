import React, { useRef } from 'react'
import { Button, Modal, Space, Typography } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import logo from './download.png'

const { Text } = Typography

/**
 * For each order, groups that order's jobs by assignee → one slip per
 * (order × assignee) combination.
 */
export default function PrintSlips({ open, orders, onClose }) {
  const printRef = useRef(null)

  // Build list of slips: [{ order, assigneeName, jobs[] }]
  const slips = []
  for (const order of orders) {
    const byAssignee = {}
    for (const job of order.jobs) {
      const name = job.assignee || 'Unassigned'
      if (!byAssignee[name]) byAssignee[name] = []
      byAssignee[name].push(job)
    }
    for (const assigneeName of Object.keys(byAssignee).sort()) {
      slips.push({ order, assigneeName, jobs: byAssignee[assigneeName] })
    }
  }

  const totalJobs = orders.flatMap((o) => o.jobs).length

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML
    if (!printContents) return

    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <title>Job Slips – ${dayjs().format('DD MMM YYYY')}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              background: #fff;
              color: #000;
            }
            .slip {
              width: 72mm;
              padding: 4mm 3mm;
              page-break-after: always;
              border: none;
            }
            .slip:last-child { page-break-after: avoid; }

            /* ── Header ── */
            .slip-header {
              text-align: center;
              padding-bottom: 5px;
              margin-bottom: 6px;
              border-bottom: 2px solid #000;
            }
            .slip-header img {
              height: 48px;
              width: 48px;
              object-fit: contain;
              display: block;
              margin: 0 auto 4px;
            }
            .shop-name {
              font-size: 14px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin: 2px 0 1px;
              line-height: 1.2;
            }
            .slip-title {
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 2px;
              padding: 2px 0;
              margin-top: 3px;
            }

            /* ── Order info ── */
            .order-section {
              margin: 6px 0;
              font-size: 10px;
              line-height: 1.7;
            }
            .order-section .label {
              font-weight: bold;
            }
            .customer-name {
              font-size: 12px;
              font-weight: bold;
            }
            .assignee-block {
              background: #000;
              color: #fff;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              letter-spacing: 1px;
              padding: 2px 4px;
              margin: 5px 0;
            }

            /* ── Jobs ── */
            .jobs-heading {
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 1px;
              border-bottom: 1px dashed #000;
              padding-bottom: 2px;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .job-row {
              margin-bottom: 5px;
            }
            .job-num {
              font-size: 11px;
              font-weight: bold;
            }
            .job-detail {
              padding-left: 12px;
              font-size: 10px;
              line-height: 1.6;
            }
            .job-detail .due-urgent {
              font-weight: bold;
            }
            .divider {
              border: none;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }

            /* ── Footer ── */
            .footer {
              border-top: 2px solid #000;
              margin-top: 7px;
              padding-top: 4px;
              text-align: center;
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 1px;
            }

            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.onload = () => {
      win.print()
      win.close()
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <PrinterOutlined />
          Print Job Slips — {dayjs().format('DD MMM YYYY')}
        </Space>
      }
      onCancel={onClose}
      width={520}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print All Slips
          </Button>
        </Space>
      }
    >
      {/* Preview area */}
      <div
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 6,
        }}
      >
        {slips.length === 0 ? (
          <Text type="secondary">No jobs found.</Text>
        ) : (
          <div ref={printRef}>
            {slips.map(({ order, assigneeName, jobs }, slipIdx) => {
              const slipStyle = {
                background: '#fff',
                border: '2px solid #222',
                borderRadius: 4,
                padding: '10px 12px',
                marginBottom: 16,
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                width: 288,
              }
              return (
              <div
                key={`${order.order_id}-${assigneeName}`}
                className="slip"
                style={slipStyle}
              >
                {/* Header */}
                <div className="slip-header" style={{ textAlign: 'center', paddingBottom: 5, marginBottom: 6, borderBottom: '2px solid #000' }}>
                  <img src={logo} alt="Saraswat Printing Press" style={{ height: 48, width: 48, objectFit: 'contain', marginBottom: 4 }} />
                  <div className="shop-name" style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', margin: '2px 0 1px', lineHeight: 1.2 }}>Saraswat Printing Press</div>
                  <div className="slip-title" style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 2, padding: '2px 0', marginTop: 3 }}>◆ JOB SLIP ◆</div>
                </div>

                {/* Assignee block */}
                <div className="assignee-block" style={{ background: '#000', color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, padding: '3px 4px', margin: '5px 0' }}>▶ {assigneeName.toUpperCase()} ◀</div>

                {/* Order info */}
                <div className="order-section" style={{ margin: '6px 0', fontSize: 10, lineHeight: 1.7 }}>
                  <span className="label" style={{ fontWeight: 'bold' }}>Order&nbsp;&nbsp;&nbsp;:</span> {order.order_id}<br />
                  <span className="label" style={{ fontWeight: 'bold' }}>Customer:</span> <span className="customer-name" style={{ fontWeight: 'bold', fontSize: 12 }}>{order.customer?.name}</span><br />
                  <span className="label" style={{ fontWeight: 'bold' }}>Mobile&nbsp;&nbsp;:</span> {order.customer?.mobile_number}<br />
                  <span className="label" style={{ fontWeight: 'bold' }}>Date&nbsp;&nbsp;&nbsp;&nbsp;:</span> {dayjs().format('DD/MM/YYYY')}
                </div>

                <hr className="divider" style={{ border: 'none', borderTop: '1px dashed #000', margin: '4px 0' }} />

                {/* Jobs heading */}
                <div className="jobs-heading" style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1, borderBottom: '1px dashed #000', paddingBottom: 2, marginBottom: 4, textTransform: 'uppercase' }}>📋 Work Items ({jobs.length})</div>

                {/* Jobs */}
                {jobs.map((job, idx) => (
                  <div key={job.job_id} className="job-row" style={{ marginBottom: 5 }}>
                    <div className="job-num" style={{ fontWeight: 'bold', fontSize: 11 }}>▸ {idx + 1}. {job.job_name}</div>
                    <div className="job-detail" style={{ paddingLeft: 12, fontSize: 10, lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 'bold' }}>ID&nbsp;&nbsp;&nbsp;&nbsp;:</span> {job.job_id}<br />
                      {job.delivery_date && (
                        <><span style={{ fontWeight: 'bold' }}>Due&nbsp;&nbsp;&nbsp;:</span> {dayjs(job.delivery_date).format('DD MMM YYYY')}<br /></>
                      )}
                      <span style={{ fontWeight: 'bold' }}>Status:</span> {job.status}
                    </div>
                    {idx < jobs.length - 1 && <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '4px 0' }} />}
                  </div>
                ))}

                {/* Footer */}
                <div className="footer" style={{ borderTop: '2px solid #000', marginTop: 7, paddingTop: 4, textAlign: 'center', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>— THANK YOU — SARASWAT PRINTING PRESS —</div>
              </div>
            )})}  
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
        {slips.length} slip{slips.length !== 1 ? 's' : ''} will be printed
        ({totalJobs} total jobs across {orders.length} orders)
      </div>
    </Modal>
  )
}

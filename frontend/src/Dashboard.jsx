import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import EditOrderModal from './EditOrderModal'
import PrintSlips from './PrintSlips'
import './Dashboard.css'

const { Title, Text } = Typography

// ── helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  'not started': 'default',
  'in progress': 'processing',
  'completed': 'success',
  'done': 'success',
  'on hold': 'warning',
  'cancelled': 'error',
}

function statusColor(name = '') {
  return STATUS_COLOR[name.toLowerCase()] ?? 'default'
}

function deliveryBadge(dateStr) {
  if (!dateStr) return <Text type="secondary">—</Text>
  const d = dayjs(dateStr)
  const today = dayjs().startOf('day')
  const diff = d.diff(today, 'day')
  const label = d.format('DD MMM YYYY')
  if (diff < 0) return <Tag color="error" icon={<WarningOutlined />}>{label} (Overdue)</Tag>
  if (diff === 0) return <Tag color="warning" icon={<ClockCircleOutlined />}>{label} (Today)</Tag>
  if (diff <= 3) return <Tag color="orange">{label} ({diff}d left)</Tag>
  return <Tag color="blue">{label}</Tag>
}

// ── component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignees, setAssignees] = useState([])
  const [statuses, setStatuses] = useState([])
  const [editingOrder, setEditingOrder] = useState(null)
  const [printingOrders, setPrintingOrders] = useState(null) // null = closed, array = open
  const [globalQuery, setGlobalQuery] = useState('')
  const searchInput = useRef(null)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    axios
      .get('/api/orders/')
      .then((r) => setOrders(r.data))
      .catch(() => message.error('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchOrders()
    // Fetch dropdown options for the edit modal
    axios.get('/api/assignees/').then((r) => setAssignees(r.data)).catch(() => {})
    axios.get('/api/job-statuses/').then((r) => setStatuses(r.data)).catch(() => {})
  }, [fetchOrders])

  // ── helpers ────────────────────────────────────────────────────────────
  // Earliest job delivery date for an order (null if none)
  const earliestDue = (order) => {
    const dates = order.jobs
      .filter((j) => j.delivery_date)
      .map((j) => dayjs(j.delivery_date))
    if (!dates.length) return null
    return dates.reduce((min, d) => (d.isBefore(min) ? d : min))
  }

  // Text-search filter props factory
  const getSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={placeholder ?? `Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
            onClick={() => confirm()}
          >
            Search
          </Button>
          <Button
            size="small"
            style={{ width: 90 }}
            onClick={() => { clearFilters?.(); confirm() }}
          >
            Reset
          </Button>
          <Button type="link" size="small" onClick={close}>Close</Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1a1a1a' : undefined }} />
    ),
    onFilter: (value, record) =>
      String(record[dataIndex] ?? '')
        .toLowerCase()
        .includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (open) => {
        if (open) setTimeout(() => searchInput.current?.select(), 100)
      },
    },
  })

  // Unique assignee list across all orders (for filter options)
  const allAssigneeNames = [...new Set(orders.flatMap((o) => o.jobs.map((j) => j.assignee)))].sort()

  // ── global search filter ─────────────────────────────────────────────────
  const filteredOrders = globalQuery.trim()
    ? orders.filter((o) => {
        const q = globalQuery.toLowerCase()
        return (
          o.order_id.toLowerCase().includes(q) ||
          (o.customer?.name ?? '').toLowerCase().includes(q) ||
          (o.customer?.mobile_number ?? '').toLowerCase().includes(q) ||
          (o.description ?? '').toLowerCase().includes(q) ||
          o.jobs.some(
            (j) =>
              j.job_id.toLowerCase().includes(q) ||
              j.job_name.toLowerCase().includes(q) ||
              j.assignee.toLowerCase().includes(q) ||
              j.status.toLowerCase().includes(q)
          )
        )
      })
    : orders

  // ── summary stats ────────────────────────────────────────────────────────
  const allJobs = orders.flatMap((o) => o.jobs)

  const completedJobs = allJobs.filter((j) =>
    ['completed', 'done'].includes(j.status.toLowerCase())
  )
  const overdueOrders = orders.filter((o) =>
    o.jobs.some(
      (j) => j.delivery_date && dayjs(j.delivery_date).isBefore(dayjs().startOf('day'))
    )
  )

  // ── expanded row: jobs table ───────────────────────────────────────────────
  const jobColumns = [
    {
      title: 'Job ID',
      dataIndex: 'job_id',
      key: 'job_id',
      width: 110,
      render: (id) => <Text code style={{ fontSize: 12 }}>{id}</Text>,
    },
    {
      title: 'Job Name',
      dataIndex: 'job_name',
      key: 'job_name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (name) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Badge status={statusColor(s)} text={s} />,
    },
    {
      title: 'Delivery Date',
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      render: deliveryBadge,
    },
  ]

  const expandedRowRender = (record) => (
    <div className="order-jobs-card">
      <div className="order-jobs-card-header">
        <Text strong style={{ fontSize: 13, color: '#1a1a1a' }}>
          Jobs for {record.order_id}
        </Text>
        <Tag color="blue" style={{ marginBottom: 0 }}>
          {record.jobs.length} job{record.jobs.length !== 1 ? 's' : ''}
        </Tag>
      </div>
      <Table
        columns={jobColumns}
        dataSource={record.jobs}
        rowKey="job_id"
        pagination={false}
        size="small"
      />
    </div>
  )

  // ── main order columns ──────────────────────────────────────────────────
  const orderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 120,
      sorter: (a, b) => a.order_id.localeCompare(b.order_id),
      render: (id) => <Text strong style={{ color: '#1a1a1a' }}>{id}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer_name',
      sorter: (a, b) => (a.customer?.name ?? '').localeCompare(b.customer?.name ?? ''),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder="Search customer…"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" icon={<SearchOutlined />} size="small" style={{ width: 90 }} onClick={() => confirm()}>Search</Button>
            <Button size="small" style={{ width: 90 }} onClick={() => { clearFilters?.(); confirm() }}>Reset</Button>
            <Button type="link" size="small" onClick={close}>Close</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1a1a1a' : undefined }} />,
      onFilter: (value, record) => (record.customer?.name ?? '').toLowerCase().includes(value.toLowerCase()),
      filterDropdownProps: { onOpenChange: (open) => { if (open) setTimeout(() => searchInput.current?.select(), 100) } },
      render: (_, record) => (
        <div>
          <Text strong>{record.customer?.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customer?.mobile_number}</Text>
        </div>
      ),
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      responsive: ['md'],
      defaultSortOrder: 'descend',
      sorter: (a, b) => dayjs(a.order_date).valueOf() - dayjs(b.order_date).valueOf(),
      render: (d) => d ? dayjs(d).format('DD MMM YYYY, hh:mm A') : '—',
    },
    {
      title: 'Due Date',
      key: 'due_date',
      sorter: (a, b) => {
        const da = earliestDue(a)
        const db = earliestDue(b)
        if (!da && !db) return 0
        if (!da) return 1
        if (!db) return -1
        return da.valueOf() - db.valueOf()
      },
      filters: [
        { text: 'Overdue', value: 'overdue' },
        { text: 'Due Today', value: 'today' },
        { text: 'Due This Week', value: 'week' },
        { text: 'No Due Date', value: 'none' },
      ],
      onFilter: (value, record) => {
        const d = earliestDue(record)
        if (value === 'none') return !d
        if (!d) return false
        const today = dayjs().startOf('day')
        if (value === 'overdue') return d.isBefore(today)
        if (value === 'today') return d.isSame(today, 'day')
        if (value === 'week') return !d.isBefore(today) && d.isBefore(dayjs().add(7, 'day'))
        return false
      },
      render: (_, record) => deliveryBadge(earliestDue(record)?.format('YYYY-MM-DD') ?? null),
    },
    {
      title: 'Assignees',
      key: 'assignees',
      responsive: ['lg'],
      filters: allAssigneeNames.map((a) => ({ text: a, value: a })),
      onFilter: (value, record) => record.jobs.some((j) => j.assignee === value),
      render: (_, record) => {
        const unique = [...new Set(record.jobs.map((j) => j.assignee))]
        return unique.map((a) => (
          <Tag key={a} color="purple" style={{ marginBottom: 2 }}>
            {a}
          </Tag>
        ))
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space size={0}>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => setEditingOrder(record)}
          >
            Edit
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="link"
            onClick={() => setPrintingOrders([record])}
          >
            Print
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={styles.page}>
      {/* ── Summary cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={styles.statCard}>
            <Statistic
              title="Total Orders"
              value={orders.length}
              prefix={<FileTextOutlined style={{ color: '#1a1a1a' }} />}
              valueStyle={{ color: '#1a1a1a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={styles.statCard}>
            <Statistic
              title="Total Jobs"
              value={allJobs.length}
              prefix={<SyncOutlined style={{ color: '#595959' }} />}
              valueStyle={{ color: '#595959' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={styles.statCard}>
            <Statistic
              title="Jobs Completed"
              value={completedJobs.length}
              suffix={`/ ${allJobs.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#3d3d3d' }} />}
              valueStyle={{ color: '#3d3d3d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={styles.statCard}>
            <Statistic
              title="Overdue Orders"
              value={overdueOrders.length}
              prefix={<WarningOutlined style={{ color: overdueOrders.length ? '#ff4d4f' : '#8c8c8c' }} />}
              valueStyle={{ color: overdueOrders.length ? '#ff4d4f' : '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Orders table ── */}
      <Card
        variant="borderless"
        style={styles.tableCard}
        title={<Title level={5} style={{ margin: 0 }}>All Orders</Title>}
        extra={
          <Space>
            <Input
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="Search orders, jobs, assignees…"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              allowClear
              style={{ width: 280 }}
            />
            <Button
              icon={<PrinterOutlined />}
              onClick={() => setPrintingOrders(orders)}
            >
              Print All Slips
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchOrders}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={orderColumns}
            dataSource={filteredOrders}
            rowKey="order_id"
            rowClassName={() => 'order-row'}
            className="orders-table"
            expandable={{
              expandedRowRender,
              rowExpandable: (r) => r.jobs.length > 0,
            }}
            locale={{ emptyText: <Empty description="No orders yet" /> }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 600 }}
          />
        </Spin>
      </Card>

      {/* ── Print Slips Modal ── */}
      <PrintSlips
        open={printingOrders !== null}
        orders={printingOrders ?? []}
        onClose={() => setPrintingOrders(null)}
      />

      {/* ── Edit Modal ── */}
      <EditOrderModal
        order={editingOrder}
        assignees={assignees}
        statuses={statuses}
        onClose={() => setEditingOrder(null)}
        onSaved={fetchOrders}
      />
    </div>
  )
}

const styles = {
  page: {
    padding: '24px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  statCard: {
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  tableCard: {
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
}

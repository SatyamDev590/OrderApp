import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  DeleteOutlined,
  FileAddOutlined,
  PrinterOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import logo from './download.png'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

export default function OrderForm({ onSuccess }) {
  const [form] = Form.useForm()
  const [assignees, setAssignees] = useState([])
  const [statuses, setStatuses] = useState([])
  const [customers, setCustomers] = useState([])
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [successOrder, setSuccessOrder] = useState(null)

  // ── fetch dropdown data on mount ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/assignees/'),
      axios.get('/api/job-statuses/'),
      axios.get('/api/customers/'),
    ])
      .then(([aRes, sRes, cRes]) => {
        setAssignees(aRes.data)
        setStatuses(sRes.data)
        setCustomers(cRes.data)
        // pre-select default status for first job row
        const defaultStatus = sRes.data.find(
          (s) => s.status_name.toLowerCase() === 'not started'
        )
        if (defaultStatus) {
          form.setFieldsValue({
            jobs: [{ status: defaultStatus.status_id }],
          })
        }
      })
      .catch(() => message.error('Failed to load form data. Is the server running?'))
      .finally(() => setBootstrapping(false))
  }, [form])

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const customerPayload = isNewCustomer
        ? { customer_name: values.customer_name.trim(), customer_mobile: values.customer_mobile.trim() }
        : { customer_id: values.customer_id }
      const payload = {
        ...customerPayload,
        description: values.description?.trim() ?? '',
        jobs: values.jobs.map((j) => ({
          job_name: j.job_name.trim(),
          assignee: j.assignee,
          status: j.status,
          delivery_date: j.delivery_date ? j.delivery_date.format('YYYY-MM-DD') : null,
        })),
      }
      const { data } = await axios.post('/api/orders/', payload)
      setSuccessOrder(data)
      form.resetFields()
      if (onSuccess) onSuccess()
    } catch (err) {
      const detail = err.response?.data
      if (detail && typeof detail === 'object') {
        const msgs = Object.entries(detail)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n')
        message.error(msgs)
      } else {
        message.error('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrder = () => {
    setSuccessOrder(null)
    const defaultStatus = statuses.find(
      (s) => s.status_name.toLowerCase() === 'not started'
    )
    form.setFieldsValue({
      jobs: [{ status: defaultStatus?.status_id }],
    })
  }

  // ── success screen ────────────────────────────────────────────────────────
  if (successOrder) {
    return (
      <div style={styles.page}>
        <Card style={styles.successCard} variant="borderless">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src={logo} alt="Saraswat Printing Press" style={{ height: 64, width: 64, objectFit: 'contain' }} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Order Placed Successfully!
            </Title>
            <Text type="secondary">
              Order ID:{' '}
              <Text strong style={{ fontSize: 16 }}>
                {successOrder.order_id}
              </Text>
            </Text>
          </div>

          <Divider />

          <Row gutter={16} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Text type="secondary">Customer</Text>
              <br />
              <Text strong>{successOrder.customer?.name}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Mobile</Text>
              <br />
              <Text strong>{successOrder.customer?.mobile_number}</Text>
            </Col>
          </Row>
          {successOrder.delivery_date && (
            <Row style={{ marginBottom: 8 }}>
              <Col span={24}>
                <Text type="secondary">Delivery Date</Text>
                <br />
                <Text strong>{dayjs(successOrder.delivery_date).format('DD MMM YYYY')}</Text>
              </Col>
            </Row>
          )}
          {successOrder.description && (
            <Row style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Text type="secondary">Description</Text>
                <br />
                <Text>{successOrder.description}</Text>
              </Col>
            </Row>
          )}

          <Divider orientation="left">Jobs</Divider>
          {successOrder.jobs.map((job) => (
            <Card
              key={job.job_id}
              size="small"
              style={{ marginBottom: 8, background: '#f5f5f5' }}
              variant="borderless"
            >
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <Text strong>{job.job_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {job.job_id}
                  </Text>
                </Col>
                <Col>
                  <Tag color="blue">{job.status}</Tag>
                </Col>
                <Col>
                  <Tag color="purple">{job.assignee}</Tag>
                </Col>
              </Row>
            </Card>
          ))}

          <Button
            type="primary"
            icon={<FileAddOutlined />}
            block
            size="large"
            style={{ marginTop: 24 }}
            onClick={handleNewOrder}
          >
            Place Another Order
          </Button>
        </Card>
      </div>
    )
  }

  // ── form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...styles.page, paddingTop: 32 }}>
      <Spin spinning={bootstrapping} tip="Loading…">
        <Card variant="borderless" style={styles.formCard}>
          {/* Header */}
          <div style={styles.header}>
            <img src={logo} alt="Saraswat Printing Press" style={{ height: 44, width: 44, objectFit: 'contain' }} />
            <div style={{ marginLeft: 14 }}>
              <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>
                Saraswat Printing Press
              </Title>
              <Text type="secondary">New Order Form</Text>
            </div>
          </div>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            scrollToFirstError
            initialValues={{ jobs: [{}] }}
          >
            {/* ── Order Details ── */}
            <Title level={5} style={styles.sectionTitle}>
              Order Details
            </Title>

            {/* ── Customer ── */}
            <Row gutter={16}>
              {!isNewCustomer ? (
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Customer"
                    name="customer_id"
                    rules={[{ required: true, message: 'Select a customer or add new' }]}
                  >
                    <Select
                      showSearch
                      size="large"
                      placeholder="Search existing customer…"
                      optionFilterProp="label"
                      options={customers.map((c) => ({
                        value: c.id,
                        label: `${c.name} — ${c.mobile_number}`,
                      }))}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <div
                            style={{ padding: '8px 12px', cursor: 'pointer', color: '#1a1a1a', fontWeight: 500, borderTop: '1px solid #f0f0f0' }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setIsNewCustomer(true); form.setFieldValue('customer_id', undefined) }}
                          >
                            + Add New Customer
                          </div>
                        </>
                      )}
                    />
                  </Form.Item>
                </Col>
              ) : (
                <>
                  <Col xs={24} md={10}>
                    <Form.Item
                      label="Customer Name"
                      name="customer_name"
                      rules={[{ required: true, message: 'Customer name is required' }]}
                    >
                      <Input placeholder="e.g. Ramesh Kumar" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Mobile Number"
                      name="customer_mobile"
                      rules={[
                        { required: true, message: 'Mobile number is required' },
                        { pattern: /^[0-9+\-\s]{7,15}$/, message: 'Enter a valid number' },
                      ]}
                    >
                      <Input placeholder="e.g. 9876543210" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
                    <Button onClick={() => { setIsNewCustomer(false); form.setFieldValue('customer_name', undefined); form.setFieldValue('customer_mobile', undefined) }}>
                      ← Pick Existing
                    </Button>
                  </Col>
                </>
              )}
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Order Description" name="description">
                  <TextArea
                    rows={3}
                    placeholder="Wedding cards – 500 copies, premium finish…"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* ── Jobs ── */}
            <Title level={5} style={styles.sectionTitle}>
              Jobs
            </Title>

            <Form.List
              name="jobs"
              rules={[
                {
                  validator: async (_, jobs) => {
                    if (!jobs || jobs.length === 0) {
                      return Promise.reject(new Error('Add at least one job.'))
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Card
                      key={key}
                      size="small"
                      style={styles.jobCard}
                      title={
                        <Text strong style={{ color: '#1a1a1a' }}>
                          Job {index + 1}
                        </Text>
                      }
                      extra={
                        fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        )
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            {...restField}
                            label="Job Name"
                            name={[name, 'job_name']}
                            rules={[{ required: true, message: 'Job name is required' }]}
                          >
                            <Input placeholder="e.g. Offset Printing, Lamination…" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...restField}
                            label="Assignee"
                            name={[name, 'assignee']}
                            rules={[{ required: true, message: 'Select an assignee' }]}
                          >
                            <Select placeholder="Select assignee" allowClear>
                              {assignees.map((a) => (
                                <Option key={a.assignee_id} value={a.assignee_id}>
                                  {a.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={5}>
                          <Form.Item
                            {...restField}
                            label="Status"
                            name={[name, 'status']}
                            rules={[{ required: true, message: 'Select a status' }]}
                          >
                            <Select placeholder="Select status" allowClear>
                              {statuses.map((s) => (
                                <Option key={s.status_id} value={s.status_id}>
                                  {s.status_name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={5}>
                          <Form.Item
                            {...restField}
                            label="Delivery Date"
                            name={[name, 'delivery_date']}
                            rules={[{ required: true, message: 'Delivery date is required' }]}
                          >
                            <DatePicker
                              style={{ width: '100%' }}
                              format="DD MMM YYYY"
                              disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))}
                              placeholder="Select date"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  <Form.ErrorList errors={errors} />

                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const defaultStatus = statuses.find(
                        (s) => s.status_name.toLowerCase() === 'not started'
                      )
                      add({ status: defaultStatus?.status_id })
                    }}
                    block
                    style={{ marginTop: 8 }}
                  >
                    Add Job
                  </Button>
                </>
              )}
            </Form.List>

            <Divider />

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<PrinterOutlined />}
                block
                style={{ height: 48, fontSize: 16 }}
              >
                Place Order
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  )
}

// ── styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 16px',
  },
  formCard: {
    width: '100%',
    maxWidth: 860,
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    padding: '8px 8px',
  },
  successCard: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    padding: '8px 8px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#555',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  jobCard: {
    marginBottom: 12,
    borderRadius: 10,
    border: '1px solid #d6e4ff',
    background: '#fafafa',
  },
}

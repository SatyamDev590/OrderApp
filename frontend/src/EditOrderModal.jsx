import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

export default function EditOrderModal({ order, assignees, statuses, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // Pre-fill form whenever the selected order changes
  useEffect(() => {
    if (!order) return
    form.setFieldsValue({
      description: order.description ?? '',
      jobs: order.jobs.map((j) => ({
        job_id: j.job_id,
        job_name: j.job_name,
        status: statuses.find((s) => s.status_name === j.status)?.status_id ?? null,
        assignee: assignees.find((a) => a.name === j.assignee)?.assignee_id ?? null,
        delivery_date: j.delivery_date ? dayjs(j.delivery_date) : null,
      })),
    })
  }, [order, form, assignees, statuses])

  const handleSave = async (values) => {
    setSaving(true)
    try {
      // 1. Update order fields
      await axios.patch(`/api/orders/${order.order_id}/`, {
        description: values.description?.trim() ?? '',
      })

      // 2. Update each job individually
      await Promise.all(
        values.jobs.map((job) =>
          axios.patch(`/api/jobs/${job.job_id}/`, {
            job_name: job.job_name.trim(),
            status: job.status,
            assignee: job.assignee,
            delivery_date: job.delivery_date
              ? job.delivery_date.format('YYYY-MM-DD')
              : null,
          })
        )
      )

      message.success(`Order ${order.order_id} updated successfully`)
      onSaved()
      onClose()
    } catch (err) {
      const detail = err.response?.data
      if (detail && typeof detail === 'object') {
        const msgs = Object.entries(detail)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        message.error(msgs)
      } else {
        message.error('Failed to save changes. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!order}
      title={
        <span>
          Edit Order&nbsp;
          <Text strong style={{ color: '#1677ff' }}>
            {order?.order_id}
          </Text>
        </span>
      }
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnHidden
    >
      <Spin spinning={saving} tip="Saving…">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 8 }}
        >
          {/* ── Order Details ──────────────────────────────────────── */}
          <Title level={5} style={sectionStyle}>Order Details</Title>

          {/* Customer info (read-only) */}
          {order?.customer && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} md={10}>
                <Text type="secondary">Customer</Text><br />
                <Text strong style={{ fontSize: 15 }}>{order.customer.name}</Text>
              </Col>
              <Col xs={24} md={7}>
                <Text type="secondary">Mobile</Text><br />
                <Text strong>{order.customer.mobile_number}</Text>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* ── Jobs ───────────────────────────────────────────────── */}
          <Title level={5} style={sectionStyle}>Jobs</Title>

          <Form.List name="jobs">
            {(fields) =>
              fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  style={jobCardStyle}
                  title={
                    <span>
                      <Text strong style={{ color: '#1677ff' }}>
                        Job {index + 1}
                      </Text>
                      {'  '}
                      <Tag style={{ fontSize: 11 }}>
                        {order?.jobs[index]?.job_id}
                      </Tag>
                    </span>
                  }
                >
                  {/* Hidden field to carry job_id */}
                  <Form.Item {...restField} name={[name, 'job_id']} hidden>
                    <Input />
                  </Form.Item>

                  <Row gutter={12}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'job_name']}
                        label="Job Name"
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Input placeholder="Job name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'assignee']}
                        label="Assignee"
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Select placeholder="Select assignee" disabled>
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
                        name={[name, 'status']}
                        label="Status"
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Select placeholder="Select status">
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
                        name={[name, 'delivery_date']}
                        label="Delivery Date"
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          format="DD MMM YYYY"
                          placeholder="Select date"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))
            }
          </Form.List>

          <Divider />

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={onClose}>Cancel</Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Changes
              </Button>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  )
}

const sectionStyle = {
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 12,
}

const jobCardStyle = {
  marginBottom: 12,
  borderRadius: 10,
  border: '1px solid #d6e4ff',
  background: '#fafcff',
}

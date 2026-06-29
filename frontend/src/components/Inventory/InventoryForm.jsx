import { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  Table,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from "antd";

import {
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { createInventory } from "../../api";

const { Title } = Typography;

export default function InventoryForm({ onSuccess }) {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [card, setCard] = useState({
    code: "",
    total_stock: 0,
  });

  const [prices, setPrices] = useState([
    {
      key: 1,
      min_quantity: 1,
      max_quantity: 100,
      price: "",
    },
  ]);

  const handleImage = ({ fileList: newList }) => {
    // Keep only files the user hasn't removed; never auto-upload
    setFileList(newList);
  };

  const addRow = () => {
    const last = prices[prices.length - 1];

    setPrices([
      ...prices,
      {
        key: Date.now(),
        min_quantity: last.max_quantity
          ? last.max_quantity + 1
          : "",
        max_quantity: "",
        price: "",
      },
    ]);
  };

  const deleteRow = (key) => {
    if (prices.length === 1) {
      message.warning("At least one price slab is required.");
      return;
    }

    setPrices(prices.filter((x) => x.key !== key));
  };

  const updateRow = (key, field, value) => {
    setPrices((old) =>
      old.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const columns = [
    {
      title: "Min Qty",
      dataIndex: "min_quantity",
      render: (_, record) => (
        <InputNumber
          value={record.min_quantity}
          min={1}
          style={{ width: "100%" }}
          onChange={(v) =>
            updateRow(record.key, "min_quantity", v)
          }
        />
      ),
    },
    {
      title: "Max Qty",
      dataIndex: "max_quantity",
      render: (_, record) => (
        <InputNumber
          value={record.max_quantity}
          style={{ width: "100%" }}
          onChange={(v) =>
            updateRow(record.key, "max_quantity", v)
          }
        />
      ),
    },
    {
      title: "Price / Card (₹)",
      dataIndex: "price",
      render: (_, record) => (
        <InputNumber
          value={record.price}
          min={0}
          style={{ width: "100%" }}
          onChange={(v) =>
            updateRow(record.key, "price", v)
          }
        />
      ),
    },
    {
      title: "",
      width: 70,
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteRow(record.key)}
        />
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!card.code.trim()) {
      message.error("Card code is required.");
      return;
    }
    setLoading(true);
    try {
      const imageFiles = fileList
        .map((f) => f.originFileObj)
        .filter(Boolean);
      await createInventory(card, imageFiles, prices);
      message.success("Inventory saved successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data;
      const msg =
        detail && typeof detail === "object"
          ? Object.entries(detail)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join("\n")
          : "Failed to save inventory. Please try again.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 1200,
        margin: "auto",
      }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: 12,
          boxShadow: "0 3px 12px rgba(0,0,0,.08)",
        }}
      >
        <Title level={3}>
          Add Card Inventory
        </Title>

        <Divider />

        <Row gutter={32}>
          <Col span={8}>
            <Card
              size="small"
              title={`Card Images (${fileList.length} selected)`}
              style={{ textAlign: "center" }}
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
                beforeUpload={() => false}
                onChange={handleImage}
                multiple
                accept="image/*"
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 6, fontSize: 12 }}>Add Image</div>
                </div>
              </Upload>
              {fileList.length === 0 && (
                <div
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  First image will be the primary photo
                </div>
              )}
            </Card>
          </Col>

          <Col span={16}>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Card Code">
                    <Input
                      placeholder="Enter Card Code"
                      value={card.code}
                      onChange={(e) =>
                        setCard({
                          ...card,
                          code: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Total Stock">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      value={card.total_stock}
                      onChange={(v) =>
                        setCard({
                          ...card,
                          total_stock: v,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>

        <Divider />

        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <Title
            level={4}
            style={{ margin: 0 }}
          >
            Quantity Wise Pricing
          </Title>

          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={addRow}
          >
            Add Price Slab
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={prices}
          pagination={false}
          variant="bordered"
        />

        <div
          style={{
            marginTop: 35,
            textAlign: "right",
          }}
        >
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
          >
            Save Inventory
          </Button>
        </div>
      </Card>
    </div>
  );
}
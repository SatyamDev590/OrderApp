import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  Col,
  Empty,
  Image,
  Row,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { getInventory } from "../../api";

const { Text, Title } = Typography;

const PLACEHOLDER = (
  <div
    style={{
      width: "100%",
      height: 220,
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#bbb",
      gap: 8,
      borderRadius: "8px 8px 0 0",
    }}
  >
    <PictureOutlined style={{ fontSize: 40 }} />
    <Text type="secondary" style={{ fontSize: 12 }}>
      No Image
    </Text>
  </div>
);

function PriceTable({ prices }) {
  if (!prices?.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <Text
        type="secondary"
        style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}
      >
        Price Slabs
      </Text>
      <table style={{ width: "100%", marginTop: 6, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            {["Min Qty", "Max Qty", "₹ / Card"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#888",
                  border: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.min_quantity}</td>
              <td style={tdStyle}>{p.max_quantity ?? "∞"}</td>
              <td style={{ ...tdStyle, fontWeight: 600, color: "#1a1a1a" }}>
                {Number(p.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tdStyle = {
  padding: "4px 8px",
  fontSize: 12,
  border: "1px solid #f0f0f0",
  textAlign: "center",
  color: "#555",
};

function CardItem({ item }) {
  const primary = item.images?.find((i) => i.is_primary) ?? item.images?.[0];
  const extras = item.images?.filter((i) => i !== primary) ?? [];

  const stockColor =
    item.available_stock > 20
      ? "success"
      : item.available_stock > 0
      ? "warning"
      : "error";

  return (
    <Badge.Ribbon
      text={
        item.available_stock > 0
          ? `${item.available_stock} available`
          : "Out of stock"
      }
      color={item.available_stock > 0 ? "#1a1a1a" : "#ff4d4f"}
    >
      <Card
        hoverable
        style={{
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #eee",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        styles={{ body: { padding: 16, flex: 1 } }}
        cover={
          primary ? (
            <Image.PreviewGroup
              items={item.images.map((img) => ({ src: img.image }))}
            >
              <Image
                src={primary.image}
                alt={item.code}
                height={220}
                style={{ objectFit: "cover", width: "100%" }}
                preview={{ mask: "View All Photos" }}
              />
            </Image.PreviewGroup>
          ) : (
            PLACEHOLDER
          )
        }
      >
        {/* Card code */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            {item.code}
          </Title>
          <Tag color={stockColor} style={{ marginLeft: 4 }}>
            {item.available_stock > 0 ? "In Stock" : "Sold Out"}
          </Tag>
        </div>

        {/* Stock counters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
          <div style={statBox}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              TOTAL
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {item.total_stock}
            </Text>
          </div>
          <div style={statBox}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              RESERVED
            </Text>
            <Text strong style={{ fontSize: 16, color: "#faad14" }}>
              {item.reserved_stock}
            </Text>
          </div>
          <div style={statBox}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              AVAILABLE
            </Text>
            <Text
              strong
              style={{
                fontSize: 16,
                color: item.available_stock > 0 ? "#52c41a" : "#ff4d4f",
              }}
            >
              {item.available_stock}
            </Text>
          </div>
        </div>

        {/* Extra images thumbnails */}
        {extras.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {extras.map((img) => (
              <Image
                key={img.id}
                src={img.image}
                width={44}
                height={44}
                style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                preview
              />
            ))}
          </div>
        )}

        <PriceTable prices={item.prices} />
      </Card>
    </Badge.Ribbon>
  );
}

const statBox = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "#fafafa",
  borderRadius: 8,
  padding: "6px 4px",
};

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventory()
      .then(setItems)
      .catch(() => message.error("Failed to load inventory."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <Empty
        description="No inventory added yet"
        style={{ padding: 60 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Row gutter={[20, 24]}>
      {items.map((item) => (
        <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
          <CardItem item={item} />
        </Col>
      ))}
    </Row>
  );
}

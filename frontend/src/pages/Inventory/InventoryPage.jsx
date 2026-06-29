import { useState } from "react";
import { Button, Typography } from "antd";
import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";
import InventoryForm from "../../components/Inventory/InventoryForm";
import InventoryList from "../../components/Inventory/InventoryList";

const { Title } = Typography;

export default function InventoryPage() {
  const [view, setView] = useState("list"); // "list" | "add"

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "auto" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Card Inventory
        </Title>

        {view === "list" ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setView("add")}
          >
            Add New Card
          </Button>
        ) : (
          <Button
            icon={<AppstoreOutlined />}
            size="large"
            onClick={() => setView("list")}
          >
            View All Cards
          </Button>
        )}
      </div>

      {view === "list" ? <InventoryList /> : <InventoryForm onSuccess={() => setView("list")} />}
    </div>
  );
}

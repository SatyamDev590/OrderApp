import { useState } from 'react'
import { ConfigProvider, Layout, Menu, Typography } from 'antd'
import { DashboardOutlined, FileAddOutlined, DatabaseOutlined } from '@ant-design/icons'
import Dashboard from './Dashboard'
import OrderForm from './OrderForm'
import logo from './download.png'
import InventoryPage from "./pages/Inventory/InventoryPage";


const { Header, Content } = Layout
const { Text } = Typography

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1a1a1a',
          colorLink: '#1a1a1a',
          colorInfo: '#595959',
          borderRadius: 8,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          colorBgContainer: '#ffffff',
          colorBorder: '#d9d9d9',
        },
        components: {
          Button: {
            colorPrimary: '#1a1a1a',
            colorPrimaryHover: '#333333',
            colorPrimaryActive: '#000000',
          },
          Menu: {
            itemSelectedColor: '#1a1a1a',
            itemSelectedBg: '#f0f0f0',
            itemHoverColor: '#1a1a1a',
            itemHoverBg: '#f5f5f5',
            itemActiveBg: '#e8e8e8',
          },
          Table: {
            colorLink: '#1a1a1a',
          },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f2f2f2' }}>
        {/* ── Top Nav ── */}
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            background: '#1a1a1a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            padding: '0 24px',
            height: 72,
          }}
        >
          {/* Centre — logo + name (absolutely centred so it's always at the midpoint) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'none',
            }}
          >
            <img
              src={logo}
              alt="Saraswat Printing Press"
              style={{ height: 52, width: 52, objectFit: 'contain', borderRadius: 6 }}
            />
            <Text strong style={{ fontSize: 20, color: '#ffffff', whiteSpace: 'nowrap' }}>
              Saraswat Printing Press
            </Text>
          </div>

          {/* Right — nav items */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Menu
              mode="horizontal"
              theme="dark"
              selectedKeys={[page]}
              onClick={(e) => setPage(e.key)}
              style={{ border: 'none', background: 'transparent' }}
              items={[
                {
                  key: 'dashboard',
                  icon: <DashboardOutlined />,
                  label: 'Dashboard',
                },
                {
                  key: 'order',
                  icon: <FileAddOutlined />,
                  label: 'New Order',
                },
                {
                    key: 'inventory',
                    icon: <DatabaseOutlined />,
                    label: 'Inventory',
                },
              ]}
            />
          </div>
        </Header>

        {/* ── Page Content ── */}
        <Content style={{ background: '#f2f2f2', minHeight: 'calc(100vh - 72px)' }}>
          {page === 'dashboard' && (
            <Dashboard />
            )}

            {page === 'order' && (
            <OrderForm onSuccess={() => setPage('dashboard')} />
            )}

            {page === 'inventory' && (
            <InventoryPage />
            )}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

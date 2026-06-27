import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getLocalProducts, saveLocalProducts, getLocalCategories, saveLocalCategories } from '../data/products';
import {
  LayoutDashboard, ShoppingBag, FolderOpen, ClipboardList,
  AlertTriangle, Users, MessageSquare, Plus, Edit2, Trash2,
  Calendar, Check, Download, Eye, FileText, X
} from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const { showToast } = useNotification();

  // Active Admin Tab: 'overview', 'products', 'categories', 'orders', 'inventory', 'customers', 'tickets'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    totalCustomers: 0,
    totalSubscriptions: 0,
    totalTickets: 0,
    recentOrders: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Products CRUD State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding new
  
  // Product Form Fields
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Sweets');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodDiscountPrice, setProdDiscountPrice] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodShelfLife, setProdShelfLife] = useState('30 Days');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=85&w=600&auto=format&fit=crop');

  // Categories CRUD State
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=85&w=600&auto=format&fit=crop');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Inventory State
  const [inventoryList, setInventoryList] = useState([]);
  const [alerts, setAlerts] = useState({ lowStockAlerts: [], expiryAlerts: [] });
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProductId, setBatchProductId] = useState('');
  const [batchNum, setBatchNum] = useState('');
  const [batchQty, setBatchQty] = useState(10);
  const [batchMfgDate, setBatchMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchExpDate, setBatchExpDate] = useState('');

  // Customers State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');

  // Initial fetches
  useEffect(() => {
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'tickets') fetchTickets();
  }, [activeTab]);

  // Fetches definitions
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/stats/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats({
          ...data,
          totalProducts: getLocalProducts().length
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchProducts = () => {
    setLoadingProducts(true);
    try {
      const data = getLocalProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = () => {
    try {
      const data = getLocalCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const resInv = await fetch('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataInv = await resInv.json();
      if (resInv.ok) setInventoryList(dataInv);

      const resAlert = await fetch('http://localhost:5000/api/inventory/alerts/warnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAlert = await resAlert.json();
      if (resAlert.ok) setAlerts(dataAlert);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Products Add/Edit CRUD operations
  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setProdTitle(product.title);
      setProdDesc(product.description);
      setProdCategory(product.category);
      setProdPrice(product.price);
      setProdDiscountPrice(product.discountPrice);
      setProdStock(product.stock);
      setProdShelfLife(product.shelfLife);
      setProdIngredients(product.ingredients.join(', '));
      setProdImage(product.images[0]);
    } else {
      setProdTitle('');
      setProdDesc('');
      setProdCategory('Sweets');
      setProdPrice(0);
      setProdDiscountPrice(0);
      setProdStock(0);
      setProdShelfLife('30 Days');
      setProdIngredients('');
      setProdImage('https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=85&w=600&auto=format&fit=crop');
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const all = getLocalProducts();
    const productData = {
      title: prodTitle,
      description: prodDesc,
      category: prodCategory,
      price: Number(prodPrice),
      discountPrice: Number(prodDiscountPrice),
      stock: Number(prodStock),
      shelfLife: prodShelfLife,
      ingredients: prodIngredients.split(',').map(i => i.trim()).filter(Boolean),
      images: [prodImage]
    };

    try {
      if (editingProduct) {
        // Update
        const updated = all.map(p => p._id === editingProduct._id ? { ...p, ...productData } : p);
        saveLocalProducts(updated);
        showToast('Product updated successfully.', 'success');
      } else {
        // Create
        const newProd = {
          _id: String(Date.now()),
          rating: 4.5,
          numReviews: 0,
          reviews: [],
          ...productData
        };
        saveLocalProducts([...all, newProd]);
        showToast('Product created successfully.', 'success');
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      showToast('Error saving product.', 'error');
    }
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const all = getLocalProducts();
      const updated = all.filter(p => p._id !== id);
      saveLocalProducts(updated);
      showToast('Product removed successfully.', 'success');
      fetchProducts();
    } catch (err) {
      showToast('Error deleting product.', 'error');
    }
  };

  // Categories CRUD operations locally
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const all = getLocalCategories();
      const newCat = {
        _id: String(Date.now()),
        name: newCatName,
        description: newCatDesc,
        image: newCatImage
      };
      saveLocalCategories([...all, newCat]);
      showToast('Category created.', 'success');
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (e) {
      showToast('Error creating category.', 'error');
    }
  };

  const handleDeleteCategory = (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const all = getLocalCategories();
      const updated = all.filter(c => c._id !== id);
      saveLocalCategories(updated);
      showToast('Category removed.', 'success');
      fetchCategories();
    } catch (e) {
      showToast('Error deleting category.', 'error');
    }
  };

  // Update Order Status Stepper
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus, trackingNumber: `SH${Date.now().toString().slice(-8)}IN`, carrier: 'Sharadha Fast Courier' })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Order status updated to ${newStatus}.`, 'success');
        setSelectedOrder(data);
        fetchOrders();
      }
    } catch (e) {
      showToast('Error updating order.', 'error');
    }
  };

  // Inventory Batch setup
  const handleOpenBatchModal = (prodId, shelfLifeDays) => {
    setBatchProductId(prodId);
    setBatchNum(`B-${Date.now().toString().slice(-6)}`);
    
    // Set expiry date defaults
    const expDate = new Date();
    const days = parseInt(shelfLifeDays) || 30;
    expDate.setDate(expDate.getDate() + days);
    setBatchExpDate(expDate.toISOString().split('T')[0]);
    
    setShowBatchModal(true);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/inventory/${batchProductId}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          batchNumber: batchNum,
          manufactureDate: batchMfgDate,
          expiryDate: batchExpDate,
          quantity: Number(batchQty)
        })
      });
      if (response.ok) {
        showToast('Batch added successfully. Product stock updated.', 'success');
        setShowBatchModal(false);
        fetchInventory();
      }
    } catch (e) {
      showToast('Error adding batch.', 'error');
    }
  };

  // Support Tickets management
  const handleTicketReplySubmit = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${selectedTicket._id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: ticketReply })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Reply sent.', 'success');
        setSelectedTicket(data);
        setTicketReply('');
        fetchTickets();
      }
    } catch (e) {
      showToast('Error replying.', 'error');
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Closed' })
      });
      if (response.ok) {
        showToast('Ticket marked resolved/closed.', 'success');
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (e) {
      showToast('Error closing ticket.', 'error');
    }
  };

  // Export Sales Report (CSV download)
  const handleExportSalesCSV = () => {
    if (orders.length === 0) {
      showToast('No orders available to export.', 'warning');
      return;
    }
    const headers = ['Order ID', 'Customer', 'Date', 'Items', 'Total Price', 'Payment Method', 'Paid', 'Status'];
    const rows = orders.map(order => [
      order._id,
      order.user?.name || 'Unknown',
      new Date(order.createdAt).toLocaleDateString(),
      order.orderItems.map(i => `${i.title} (${i.quantity})`).join('; '),
      order.totalPrice,
      order.paymentMethod,
      order.isPaid ? 'Yes' : 'No',
      order.orderStatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sharadha_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales CSV report generated and downloaded!', 'success');
  };

  // Export Inventory alerts (PDF / Printable text panel popup)
  const handleExportInventoryPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sharadha Stores - Inventory Alert Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
            .warning { color: #FF6B35; font-weight: bold; }
            .expired { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Inventory Alert Report - ${new Date().toLocaleDateString()}</h1>
          
          <h2>⚠️ Low Stock Alerts</h2>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Low Threshold</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.lowStockAlerts.length === 0 ? '<tr><td colspan="3">No items low in stock.</td></tr>' : 
                alerts.lowStockAlerts.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td class="warning">${item.stockCount}</td>
                    <td>${item.threshold}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>

          <h2>📅 Expiry Warnings</h2>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Batch Number</th>
                <th>Expiry Date</th>
                <th>Days to Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.expiryAlerts.length === 0 ? '<tr><td colspan="5">No batch expiry issues.</td></tr>' : 
                alerts.expiryAlerts.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.batchNumber}</td>
                    <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td>${item.daysToExpiry} days</td>
                    <td class="${item.isExpired ? 'expired' : 'warning'}">${item.isExpired ? 'EXPIRED' : 'EXPIRING SOON'}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Printable Inventory Report PDF generated in new window!', 'success');
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
      
      {/* Sidebar Navigation */}
      <nav style={{ flex: '1 1 220px', minWidth: '220px' }} className="card-glass">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Kitchen Control</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sharadha Admin Panel</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem' }}>
          {[
            { id: 'overview', label: 'Overview Dashboard', icon: <LayoutDashboard size={16} /> },
            { id: 'products', label: 'Product Catalogue', icon: <ShoppingBag size={16} /> },
            { id: 'categories', label: 'Category Settings', icon: <FolderOpen size={16} /> },
            { id: 'orders', label: 'Order Processing', icon: <ClipboardList size={16} /> },
            { id: 'inventory', label: 'Batch Inventory', icon: <AlertTriangle size={16} /> },
            { id: 'customers', label: 'Customer Profiles', icon: <Users size={16} /> },
            { id: 'tickets', label: 'Support Tickets', icon: <MessageSquare size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--text)',
                background: activeTab === tab.id ? 'var(--secondary)' : 'transparent',
                textAlign: 'left'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Pane */}
      <main style={{ flex: '3 1 600px' }} className="card-glass">
        <div style={{ padding: '2rem' }}>
          
          {/* TAB 1: OVERVIEW STATS */}
          {activeTab === 'overview' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Kitchen Summary</h2>
                <button onClick={handleExportSalesCSV} className="btn btn-outline btn-sm" style={{ display: 'flex', gap: '0.25rem' }}>
                  <Download size={14} /> Export Sales CSV
                </button>
              </div>

              {loadingStats ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Calculating kitchen details...</div>
              ) : (
                <>
                  {/* Grid Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Earnings</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>Rs. {stats.revenue}</span>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Orders</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalOrders}</span>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Products Catalogue</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalProducts}</span>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Active Subscriptions</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.totalSubscriptions}</span>
                    </div>
                  </div>

                  {/* Recent Orders table */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Order Submissions</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem' }}>Order ID</th>
                          <th style={{ padding: '0.75rem' }}>Customer</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                          <th style={{ padding: '0.75rem' }}>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map(order => (
                          <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem' }}>#{order._id.slice(-6)}</td>
                            <td style={{ padding: '0.75rem' }}>{order.user?.name || 'Guest'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`badge ${order.orderStatus === 'Delivered' ? 'badge-secondary' : 'badge-primary'}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>Rs. {order.totalPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOGUE CRUD */}
          {activeTab === 'products' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Homemade catalogue</h2>
                <button onClick={() => handleOpenProductModal(null)} className="btn btn-secondary btn-sm" style={{ display: 'flex', gap: '0.25rem' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>

              {loadingProducts ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading products database...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Image</th>
                        <th style={{ padding: '0.75rem' }}>Title</th>
                        <th style={{ padding: '0.75rem' }}>Category</th>
                        <th style={{ padding: '0.75rem' }}>Price</th>
                        <th style={{ padding: '0.75rem' }}>Stock</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(prod => (
                        <tr key={prod._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <img src={prod.images[0]} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{prod.title}</td>
                          <td style={{ padding: '0.75rem' }}>{prod.category}</td>
                          <td style={{ padding: '0.75rem' }}>Rs. {prod.price}</td>
                          <td style={{ padding: '0.75rem', color: prod.stock <= 10 ? 'red' : 'inherit' }}>{prod.stock}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => handleOpenProductModal(prod)} style={{ color: 'var(--secondary)' }}><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteProduct(prod._id)} style={{ color: 'var(--primary)' }}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES CRUD */}
          {activeTab === 'categories' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2rem' }}>Category Settings</h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {/* Add Category Form */}
                <form onSubmit={handleCategorySubmit} style={{ flex: '1 1 280px', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Create Category</h4>
                  <div className="form-group">
                    <label className="form-label">Category Name</label>
                    <input type="text" className="form-input" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Sweets, Pickles..." required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea rows={3} className="form-input" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Category descriptions..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Create</button>
                </form>

                {/* Categories listings */}
                <div style={{ flex: '2 1 350px' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Category Catalogue</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {categories.map(cat => (
                      <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{cat.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.description || 'No description provided'}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat._id)} style={{ color: 'var(--primary)' }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Order Processing</h2>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading kitchen orders...</div>
              ) : selectedOrder ? (
                /* Detailed Order stepper details view */
                <div>
                  <button onClick={() => setSelectedOrder(null)} style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                    &larr; Back to Orders list
                  </button>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', background: 'var(--background)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Order details: #{selectedOrder._id}</h3>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      <span className="badge badge-primary">Status: {selectedOrder.orderStatus}</span>
                      <span className="badge badge-secondary">{selectedOrder.paymentMethod}</span>
                    </div>

                    {/* Stepper progress buttons for admin status updates */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {selectedOrder.orderStatus === 'Pending' && (
                        <button onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'Packed')} className="btn btn-secondary btn-sm">Mark Packed</button>
                      )}
                      {selectedOrder.orderStatus === 'Packed' && (
                        <button onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'Shipped')} className="btn btn-secondary btn-sm">Ship Order</button>
                      )}
                      {selectedOrder.orderStatus === 'Shipped' && (
                        <button onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'Delivered')} className="btn btn-secondary btn-sm">Confirm Delivered</button>
                      )}
                      {selectedOrder.orderStatus === 'Delivered' && (
                        <span style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.9rem' }}>✓ Delivered & Paid (Complete)</span>
                      )}
                    </div>

                    {/* Items table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                      {selectedOrder.orderItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span>{item.title} (x{item.quantity})</span>
                          <span>Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Grid listings */
                <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Order ID</th>
                        <th style={{ padding: '0.75rem' }}>Date</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem' }}>Total Price</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.orderStatus !== 'Cancelled').map(order => (
                        <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>#{String(order._id).slice(-6)}</td>
                          <td style={{ padding: '0.75rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.6rem', borderRadius: '2rem',
                              fontWeight: 600, fontSize: '0.78rem',
                              background: {
                                Pending: 'rgba(234,179,8,0.15)',
                                Packed: 'rgba(59,130,246,0.15)',
                                Shipped: 'rgba(99,102,241,0.15)',
                                Delivered: 'rgba(34,197,94,0.15)',
                              }[order.orderStatus] || 'var(--border)',
                              color: {
                                Pending: '#b45309',
                                Packed: '#1d4ed8',
                                Shipped: '#4f46e5',
                                Delivered: '#15803d',
                              }[order.orderStatus] || 'var(--text-muted)',
                            }}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>Rs. {order.totalPrice}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button onClick={() => setSelectedOrder(order)} style={{ color: 'var(--secondary)' }}><Eye size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cancelled Orders — separate reporting table */}
                {orders.filter(o => o.orderStatus === 'Cancelled').length > 0 && (
                  <div style={{ marginTop: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                      <X size={16} /> Cancelled Orders ({orders.filter(o => o.orderStatus === 'Cancelled').length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid rgba(239,68,68,0.2)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.6rem' }}>Order ID</th>
                            <th style={{ padding: '0.6rem' }}>Customer</th>
                            <th style={{ padding: '0.6rem' }}>Cancelled On</th>
                            <th style={{ padding: '0.6rem' }}>Total</th>
                            <th style={{ padding: '0.6rem' }}>Reason</th>
                            <th style={{ padding: '0.6rem', textAlign: 'center' }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter(o => o.orderStatus === 'Cancelled').map(order => (
                            <tr key={`c-${order._id}`} style={{ borderBottom: '1px solid var(--border)', opacity: 0.85 }}>
                              <td style={{ padding: '0.6rem' }}>#{String(order._id).slice(-6)}</td>
                              <td style={{ padding: '0.6rem' }}>{order.user?.name || 'Unknown'}</td>
                              <td style={{ padding: '0.6rem' }}>
                                {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : '—'}
                              </td>
                              <td style={{ padding: '0.6rem', fontWeight: 600 }}>Rs. {order.totalPrice}</td>
                              <td style={{ padding: '0.6rem', color: '#ef4444', fontStyle: order.cancellationReason ? 'normal' : 'italic' }}>
                                {order.cancellationReason || 'Not specified'}
                              </td>
                              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                <button onClick={() => setSelectedOrder(order)} style={{ color: 'var(--secondary)' }}><Eye size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}</>
              )}
            </div>
          )}

          {/* TAB 5: BATCH INVENTORY MANAGEMENT & ALERTS */}
          {activeTab === 'inventory' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Batch Inventory</h2>
                <button onClick={handleExportInventoryPDF} className="btn btn-outline btn-sm" style={{ display: 'flex', gap: '0.25rem' }}>
                  <FileText size={14} /> Export Expiry Report
                </button>
              </div>

              {/* Warning Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Low Stock Warning */}
                <div style={{ border: '1px solid #FF6B35', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,107,53,0.03)' }}>
                  <h4 style={{ color: '#FF6B35', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={18} /> Low Stock Warnings
                  </h4>
                  {alerts.lowStockAlerts.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All items within safe thresholds.</p>
                  ) : (
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                      {alerts.lowStockAlerts.map((al, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{al.title}</span>: Only {al.stockCount} left in stock (Threshold: {al.threshold})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Expiry alerts warnings */}
                <div style={{ border: '1px solid red', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,0,0,0.02)' }}>
                  <h4 style={{ color: 'red', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Calendar size={18} /> Shelf-Life Expiry Warnings
                  </h4>
                  {alerts.expiryAlerts.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No batch expiry concerns recorded.</p>
                  ) : (
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                      {alerts.expiryAlerts.map((al, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{al.title}</span> (Batch: {al.batchNumber}) - {al.isExpired ? 'EXPIRED' : `Expiring in ${al.daysToExpiry} days`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Inventory details list */}
              {loadingInventory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory data...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Product Name</th>
                        <th style={{ padding: '0.75rem' }}>Total Stock</th>
                        <th style={{ padding: '0.75rem' }}>Active Batches</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.map(inv => (
                        <tr key={inv._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{inv.title}</td>
                          <td style={{ padding: '0.75rem' }}>{inv.stockCount}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {inv.batches.filter(b => !b.isExpired).length} batch(es)
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenBatchModal(inv.product, '30 Days')}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Add Batch
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CUSTOMERS PROFILES */}
          {activeTab === 'customers' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2rem' }}>Customer Profiles</h2>

              {loadingCustomers ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading user profiles...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customers.map(cust => (
                    <div key={cust._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', background: 'var(--card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ fontWeight: 600 }}>{cust.name}</h4>
                        <span className="badge badge-secondary">{cust.role}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Email: {cust.email} • Registered: {new Date(cust.createdAt).toLocaleDateString()}
                      </div>
                      {cust.addresses && cust.addresses.length > 0 && (
                        <div style={{ marginTop: '0.75rem', background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Shipping Address:</span>
                          {cust.addresses[0].street}, {cust.addresses[0].city}, {cust.addresses[0].state} - {cust.addresses[0].postalCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SUPPORT TICKET REPLIES */}
          {activeTab === 'tickets' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Support Ticket Center</h2>

              {loadingTickets ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading tickets catalogue...</div>
              ) : selectedTicket ? (
                /* View Conversation thread details */
                <div>
                  <button onClick={() => setSelectedTicket(null)} style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                    &larr; Back to Tickets center
                  </button>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedTicket.subject}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sender: {selectedTicket.name} ({selectedTicket.email})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {selectedTicket.status !== 'Closed' && (
                          <button onClick={() => handleCloseTicket(selectedTicket._id)} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                            Mark Resolved
                          </button>
                        )}
                        <span className={`badge ${selectedTicket.status === 'Open' ? 'badge-primary' : selectedTicket.status === 'In_Progress' ? 'badge-accent' : 'badge-secondary'}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>User Message:</span>
                      {selectedTicket.message}
                    </div>

                    {/* Replies mapping */}
                    {selectedTicket.responses.map((rep, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.9rem',
                        maxWidth: '85%',
                        alignSelf: rep.sender === 'Admin' ? 'flex-end' : 'flex-start',
                        background: rep.sender === 'Admin' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(255, 107, 53, 0.08)',
                        border: rep.sender === 'Admin' ? '1px solid rgba(46, 125, 50, 0.15)' : '1px solid rgba(255, 107, 53, 0.15)'
                      }}>
                        <span style={{ fontSize: '0.75rem', display: 'block', fontWeight: 600, color: 'var(--text-muted)' }}>{rep.senderName} ({rep.sender})</span>
                        {rep.message}
                      </div>
                    ))}

                    {/* Send reply form */}
                    {selectedTicket.status !== 'Closed' && (
                      <form onSubmit={handleTicketReplySubmit} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                          placeholder="Type reply as Admin..."
                          required
                        />
                        <button type="submit" className="btn btn-secondary btn-sm">Reply</button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                /* Ticket list */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>User</th>
                        <th style={{ padding: '0.75rem' }}>Subject</th>
                        <th style={{ padding: '0.75rem' }}>Priority</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>{ticket.name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{ticket.subject}</td>
                          <td style={{ padding: '0.75rem', color: ticket.priority === 'High' ? 'red' : 'inherit' }}>{ticket.priority}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge ${ticket.status === 'Open' ? 'badge-primary' : ticket.status === 'In_Progress' ? 'badge-accent' : 'badge-secondary'}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button onClick={() => setSelectedTicket(ticket)} style={{ color: 'var(--secondary)' }}><Eye size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* POPUP MODAL: ADD/EDIT PRODUCT */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }} className="fade-in" onClick={() => setShowProductModal(false)}>
          <div className="card-glass" style={{
            background: 'var(--card)',
            padding: '2rem',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{editingProduct ? 'Edit Product' : 'Add Homemade Product'}</h3>
              <button onClick={() => setShowProductModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Title</label>
                <input type="text" className="form-input" value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} className="form-input" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} required></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="form-input">
                    <option value="Sweets">Sweets</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Pickles">Pickles</option>
                    <option value="Spice Powders">Spice Powders</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf Life</label>
                  <input type="text" className="form-input" placeholder="30 Days / 12 Months" value={prodShelfLife} onChange={(e) => setProdShelfLife(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Original Price</label>
                  <input type="number" className="form-input" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Price (0 if none)</label>
                  <input type="number" className="form-input" value={prodDiscountPrice} onChange={(e) => setProdDiscountPrice(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Stock Count</label>
                  <input type="number" className="form-input" value={prodStock} onChange={(e) => setProdStock(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input type="text" className="form-input" value={prodImage} onChange={(e) => setProdImage(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ingredients (Comma separated)</label>
                <input type="text" className="form-input" placeholder="Gram Flour, Cow Ghee, Sugar" value={prodIngredients} onChange={(e) => setProdIngredients(e.target.value)} />
              </div>
              
              <button type="submit" className="btn btn-secondary btn-gradient" style={{ height: '42px', marginTop: '0.5rem' }}>
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD BATCH */}
      {showBatchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }} className="fade-in" onClick={() => setShowBatchModal(false)}>
          <div className="card-glass" style={{
            background: 'var(--card)',
            padding: '2rem',
            width: '100%',
            maxWidth: '400px',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Create New Batch</h3>
              <button onClick={() => setShowBatchModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Batch Code</label>
                <input type="text" className="form-input" value={batchNum} onChange={e => setBatchNum(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacture Date</label>
                <input type="date" className="form-input" value={batchMfgDate} onChange={e => setBatchMfgDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={batchExpDate} onChange={e => setBatchExpDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Batch Quantity</label>
                <input type="number" className="form-input" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))} required />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ height: '40px', marginTop: '0.5rem' }}>
                Add Batch
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

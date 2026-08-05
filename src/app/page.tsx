'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  productname: string;
  price: number;
  in_stock: boolean;
  category?: string;
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Inventory state
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  // AI Description state
  const [aiProduct, setAiProduct] = useState('');
  const [aiPrice, setAiPrice] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load token from localStorage on boot
  useEffect(() => {
  // Ensure we are in the browser before reading localStorage
  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
    }
  }, []);

  // Fetch products whenever token is available
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');

        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setMessage('');
      } else {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        setMessage('Registration successful! Logging you in...');
        setIsLogin(true);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You must be logged in to add products.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productname: newProductName,
          price: parseFloat(newPrice),
          in_stock: true,
          category: newCategory || 'General',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail ? JSON.stringify(data.detail) : 'Failed to create product');
      }

      setNewProductName('');
      setNewPrice('');
      fetchProducts();
    } catch (err: any) {
      console.error('Create product error:', err);
      alert(`Error adding product: ${err.message}`);
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiDescription('');
    setIsGenerating(true);

    try {
      const res = await fetch(`${API_URL}/ai/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productname: aiProduct,
          price: parseFloat(aiPrice),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail ? JSON.stringify(errorData.detail) : `HTTP status: ${res.status}`);
      }

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setAiDescription((prev) => prev + chunk);
      }
    } catch (err: any) {
      console.error('AI Stream Error:', err);
      alert(`AI Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  setToken(null);
  setProducts([]);
  };

  return (
    <main style={{ maxWidth: '650px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      {!token ? (
        <div style={{ border: '1px solid #ccc', padding: '24px', borderRadius: '8px' }}>
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {isLogin ? 'Log In' : 'Register'}
            </button>
            <p style={{ fontSize: '14px', textAlign: 'center' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
                style={{ color: '#0070f3', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isLogin ? 'Register' : 'Log In'}
              </span>
            </p>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Dashboard</h2>
            <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Log Out
            </button>
          </div>

          {/* ADD PRODUCT FORM */}
          <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3>Add New Product</h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
              <input
                type="text"
                placeholder="Product Name"
                required
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={{ flex: '2 1 0%', minWidth: 0, padding: '8px', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Category Name"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ flex: '1.5 1 0%', minWidth: 0, padding: '8px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ flex: '1 1 0%', minWidth: 0, padding: '8px', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Add
              </button>
            </form>
          </section>

          {/* INVENTORY LIST */}
          <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3>Inventory Items</h3>
            {products.length === 0 ? (
              <p>No products found in database.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {products.map((p) => (
                  <li key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: '600' }}>{p.productname}</span>
                    <span style={{ display: 'inline-block', padding: '3px 8px', background: '#e9ecef', color: '#495057',borderRadius: '12px', fontSize: '12px', fontWeight: '500'}}>{p.category}</span>
                    <span style={{ textAlign: 'right', fontWeight: '500' }}>${p.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* AI DESCRIPTION GENERATOR */}
          <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
            <h3>Test AI Streaming Generator</h3>
            <form onSubmit={handleGenerateAI} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Product Name"
                required
                value={aiProduct}
                onChange={(e) => setAiProduct(e.target.value)}
                style={{ flex: 2, padding: '8px' }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                required
                value={aiPrice}
                onChange={(e) => setAiPrice(e.target.value)}
                style={{ flex: 1, padding: '8px' }}
              />
              <button type="submit" disabled={isGenerating} style={{ padding: '8px 16px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </form>
            {aiDescription && (
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                {aiDescription}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
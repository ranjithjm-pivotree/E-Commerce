const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-Memory Product Database ───────────────────────────────────────────────
const products = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    price: 299.99,
    originalPrice: 399.99,
    category: "Electronics",
    rating: 4.8,
    reviewCount: 2341,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    badge: "Best Seller",
    description: "Experience crystal-clear audio with our premium wireless headphones. Featuring 40-hour battery life, adaptive noise cancellation, and a foldable design for easy travel. The custom-tuned 40mm drivers deliver rich, detailed sound across all genres.",
    features: ["40-hour battery life", "Adaptive ANC", "Bluetooth 5.2", "Foldable design", "USB-C charging"],
    stock: 45,
    colors: ["Midnight Black", "Pearl White", "Navy Blue"]
  },
  {
    id: 2,
    name: "Mechanical Gaming Keyboard",
    price: 149.99,
    originalPrice: 179.99,
    category: "Electronics",
    rating: 4.6,
    reviewCount: 1872,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    badge: "New",
    description: "Dominate every game with tactile Cherry MX switches, per-key RGB lighting with 16.8 million colors, and a durable aluminum frame. Includes programmable macros and a detachable USB-C cable.",
    features: ["Cherry MX Switches", "Per-key RGB", "Aluminum frame", "N-key rollover", "Detachable cable"],
    stock: 30,
    colors: ["Space Gray", "White"]
  },
  {
    id: 3,
    name: "4K Ultra HD Smart Monitor",
    price: 549.99,
    originalPrice: 699.99,
    category: "Electronics",
    rating: 4.9,
    reviewCount: 987,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    badge: "Top Rated",
    description: "A stunning 27-inch 4K IPS panel with 144Hz refresh rate, HDR600 support, and 1ms response time. Perfect for both creative professionals and hardcore gamers.",
    features: ["27\" 4K IPS", "144Hz refresh", "HDR600", "1ms response", "USB-C 90W PD"],
    stock: 18,
    colors: ["Black"]
  },
  {
    id: 4,
    name: "Ergonomic Mesh Office Chair",
    price: 449.99,
    originalPrice: 599.99,
    category: "Furniture",
    rating: 4.7,
    reviewCount: 3104,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
    badge: "Best Seller",
    description: "Work comfortably for hours with lumbar support, adjustable armrests, and breathable mesh back. Certified for 8-hour daily use with a 10-year warranty.",
    features: ["Lumbar support", "Adjustable armrests", "Breathable mesh", "4D armrests", "10-year warranty"],
    stock: 22,
    colors: ["Black", "Gray", "Navy"]
  },
  {
    id: 5,
    name: "Minimalist Leather Wallet",
    price: 79.99,
    originalPrice: 99.99,
    category: "Accessories",
    rating: 4.5,
    reviewCount: 5621,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
    badge: "Popular",
    description: "Hand-stitched full-grain leather bifold wallet with RFID blocking technology. Holds up to 8 cards and cash with a slim 6mm profile.",
    features: ["Full-grain leather", "RFID blocking", "8 card slots", "6mm slim", "Hand-stitched"],
    stock: 200,
    colors: ["Tan", "Black", "Brown", "Cognac"]
  },
  {
    id: 6,
    name: "Stainless Steel Water Bottle",
    price: 34.99,
    originalPrice: 44.99,
    category: "Lifestyle",
    rating: 4.8,
    reviewCount: 8932,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    badge: "Eco Pick",
    description: "Triple-wall vacuum insulated 32oz bottle keeps drinks cold for 48 hours and hot for 24 hours. BPA-free, dishwasher safe, and made from recycled stainless steel.",
    features: ["Triple-wall insulation", "48hr cold / 24hr hot", "32oz capacity", "BPA-free", "Dishwasher safe"],
    stock: 150,
    colors: ["Matte Black", "Powder Blue", "Forest Green", "Blush Pink"]
  },
  {
    id: 7,
    name: "Portable Bluetooth Speaker",
    price: 129.99,
    originalPrice: 159.99,
    category: "Electronics",
    rating: 4.6,
    reviewCount: 4211,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    badge: "Waterproof",
    description: "IP67 waterproof speaker with 360° surround sound, 20-hour battery, and a rugged design built for adventure. Connect two units for true stereo pairing.",
    features: ["IP67 waterproof", "360° sound", "20-hour battery", "Stereo pairing", "Built-in mic"],
    stock: 67,
    colors: ["Black", "Red", "Teal", "Sand"]
  },
  {
    id: 8,
    name: "Wool Blend Trench Coat",
    price: 289.99,
    originalPrice: 389.99,
    category: "Clothing",
    rating: 4.7,
    reviewCount: 1456,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80",
    badge: "Premium",
    description: "A timeless double-breasted trench coat crafted from a premium wool-cashmere blend. Features a removable liner for year-round versatility and a tailored silhouette.",
    features: ["Wool-cashmere blend", "Removable liner", "Double-breasted", "Tailored fit", "Dry clean only"],
    stock: 35,
    colors: ["Camel", "Charcoal", "Cream"]
  }
];

let orders = [];
let nextOrderId = 1000;

// ─── API Routes ────────────────────────────────────────────────────────────────

// GET all products
app.get('/api/products', (req, res) => {
  const { category, search, sort } = req.query;
  let result = [...products];

  if (category && category !== 'all') {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);

  res.json(result);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// GET categories
app.get('/api/categories', (req, res) => {
  const cats = ['all', ...new Set(products.map(p => p.category))];
  res.json(cats);
});

// POST create order
app.post('/api/orders', (req, res) => {
  const { customer, items, total } = req.body;
  if (!customer || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const order = {
    id: nextOrderId++,
    customer,
    items,
    total,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json({ success: true, orderId: order.id, message: 'Order placed successfully!' });
});

// Serve frontend for all other routes (SPA-style)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 ShopWave running at http://localhost:${PORT}`);
  console.log(`📦 ${products.length} products loaded`);
  console.log(`\n⚠️  Note: This app contains intentional accessibility bugs for testing.\n`);
});

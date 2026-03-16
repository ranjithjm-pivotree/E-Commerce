/* ═══════════════════════════════════════════════════════════════
   ShopWave — app.js
   Contains intentional accessibility bugs for testing
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('sw_cart') || '[]');
let allProducts = [];
let currentCategory = 'all';

// ─── DOM Helpers ──────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── Page Router ──────────────────────────────────────────────
function showPage(name) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const page = $(`#page-${name}`);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  updateCartBadge();
}

// ─── Toast Notifications ──────────────────────────────────────
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Cart Persistence ─────────────────────────────────────────
function saveCart() {
  localStorage.setItem('sw_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((acc, item) => acc + item.qty, 0);
  const badge = $('#cart-count');
  if (badge) badge.textContent = total;
}

function resetCart() {
  cart = [];
  saveCart();
  updateCartBadge();
}

// ─── Add to Cart ──────────────────────────────────────────────
function addToCart(productId, qty = 1, color = '') {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId && item.color === color);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, name: product.name, price: product.price, image: product.image, qty, color, category: product.category });
  }
  saveCart();
  showToast(`✓ "${product.name}" added to cart`);
}

// ─── Stars Helper ─────────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  return s;
}

// ─── Savings Calc ─────────────────────────────────────────────
function calcSavings(orig, curr) {
  return Math.round(((orig - curr) / orig) * 100);
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT CARD RENDERER
//  BUG #1: alt="" on product images (empty alt — fails WCAG 1.1.1)
//           Empty alt is fine for decorative images, but these are
//           informative product images — they MUST have descriptive alt text.
//  BUG #5: Add-to-cart uses <div onclick> not <button> (WCAG 4.1.2, 2.1.1)
//  BUG #9: card-wishlist button uses same id="wishlist-btn" for every card
// ═══════════════════════════════════════════════════════════════
function createProductCard(product) {
  const savings = calcSavings(product.originalPrice, product.price);

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="card-img-wrap">
        <!-- BUG #1: Missing alt attribute on product image (WCAG 1.1.1) -->
        <img src="${product.image}" class="card-img" loading="lazy">
        <div class="card-badge-wrap">
          ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
          <span class="badge badge-sale">-${savings}%</span>
        </div>
        <!-- BUG #9: Non-unique ID — every card renders id="wishlist-btn" (WCAG 4.1.1) -->
        <button class="card-wishlist" id="wishlist-btn" aria-label="Add to wishlist">♡</button>
      </div>
      <div class="card-body">
        <div class="card-category">${product.category}</div>
        <h3 class="card-name">${product.name}</h3>
        <div class="card-rating">
          <span class="stars" aria-hidden="true">${renderStars(product.rating)}</span>
          <span class="review-count">(${product.reviewCount.toLocaleString()})</span>
        </div>
        <div class="card-footer">
          <div class="price-wrap">
            <span class="price">$${product.price.toFixed(2)}</span>
            <span class="price-original">$${product.originalPrice.toFixed(2)}</span>
          </div>
          <!-- BUG #5: Interactive "Add to Cart" uses <div> with onclick handler, not a <button>.
               - Cannot be focused via Tab key
               - Screen readers do not announce it as a button
               - No keyboard Enter/Space activation
               (WCAG Success Criteria 4.1.2 and 2.1.1) -->
          <div class="div-add-btn" onclick="addToCart(${product.id})">
            Add to Cart
          </div>
        </div>
      </div>
      <!-- Clicking the card (except the button) goes to detail page -->
      <a class="card-overlay-link" href="#" onclick="event.preventDefault(); loadDetail(${product.id})" aria-label="View ${product.name} details"></a>
    </article>
  `;
}

// ─── Load Featured Products (Home) ───────────────────────────
async function loadFeatured() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    const featured = allProducts.slice(0, 4);
    const grid = $('#featured-grid');
    if (grid) grid.innerHTML = featured.map(createProductCard).join('');
  } catch (e) {
    console.error('Failed to load featured products', e);
  }
}

// ─── Load All Products Page ───────────────────────────────────
async function loadProducts() {
  const sort = $('#sort-select')?.value || '';
  const params = new URLSearchParams();
  if (currentCategory !== 'all') params.set('category', currentCategory);
  if (sort) params.set('sort', sort);

  try {
    const res = await fetch(`/api/products?${params}`);
    const products = await res.json();
    allProducts = products.length ? products : allProducts;

    const grid = $('#products-grid');
    const countLabel = $('#product-count-label');

    if (grid) grid.innerHTML = products.map(createProductCard).join('');
    if (countLabel) countLabel.textContent = `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`;

    const filterLabel = $('#active-filter-label');
    if (filterLabel) filterLabel.textContent = currentCategory !== 'all' ? `Category: ${currentCategory}` : '';
  } catch (e) {
    console.error('Failed to load products', e);
  }
}

// ─── Filter by Category ───────────────────────────────────────
function filterCategory(cat) {
  currentCategory = cat;
  $$('.cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === cat.toLowerCase() ||
      (cat === 'all' && btn.textContent === 'All'));
  });
  showPage('products');
  loadProducts();
}

// ─── Product Detail Page ──────────────────────────────────────
async function loadDetail(id) {
  showPage('detail');
  const container = $('#detail-content');
  if (!container) return;

  container.innerHTML = `<div class="skeleton" style="height:500px;border-radius:20px"></div>`;

  try {
    const res = await fetch(`/api/products/${id}`);
    const p = await res.json();
    const savings = calcSavings(p.originalPrice, p.price);

    container.innerHTML = `
      <div class="detail-img-wrap">
        <!-- Product detail image also missing alt (BUG #1 continued) -->
        <img src="${p.image}" loading="eager">
      </div>
      <div class="detail-info">
        <div class="detail-category">${p.category}</div>
        <h1 class="detail-title">${p.name}</h1>
        <div class="detail-rating">
          <span class="stars" aria-hidden="true">${renderStars(p.rating)}</span>
          <span class="review-count">${p.rating} · ${p.reviewCount.toLocaleString()} reviews</span>
        </div>
        <div class="detail-price-wrap">
          <span class="detail-price">$${p.price.toFixed(2)}</span>
          <span class="detail-price-orig">$${p.originalPrice.toFixed(2)}</span>
          <span class="savings-badge">Save ${savings}%</span>
        </div>
        <p class="detail-description">${p.description}</p>
        <div class="detail-features">
          <h3>Key Features</h3>
          <ul>${p.features.map(f => `<li class="feature-tag">${f}</li>`).join('')}</ul>
        </div>
        ${p.colors ? `
          <div class="detail-colors">
            <h3>Available Colors</h3>
            <div class="color-options">
              ${p.colors.map((c, i) => `
                <button class="color-btn${i === 0 ? ' selected' : ''}" onclick="selectColor(this)">${c}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="detail-qty">
          <label for="qty-detail">Quantity</label>
          <input type="number" id="qty-detail" class="qty-input" value="1" min="1" max="${p.stock}" />
        </div>
        <p class="stock-info">✓ ${p.stock} in stock — order soon</p>
        <button class="detail-add-btn" onclick="addDetailToCart(${p.id})">
          Add to Cart
        </button>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p>Product not found.</p>';
  }
}

function selectColor(btn) {
  btn.closest('.color-options').querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function addDetailToCart(id) {
  const qty = parseInt($('#qty-detail')?.value || 1);
  const color = $('.color-btn.selected')?.textContent || '';
  addToCart(id, qty, color);
}

// ─── Cart Page ────────────────────────────────────────────────
function renderCart() {
  const container = $('#cart-items-container');
  const summary = $('#cart-summary');
  if (!container || !summary) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.</p>
        <button class="btn btn-primary" style="margin-top:20px" onclick="showPage('products')">Browse Products</button>
      </div>
    `;
    summary.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <!-- BUG #1 (continued): Cart item images also missing alt -->
      <img class="cart-item-img" src="${item.image}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.color ? `Color: ${item.color} · ` : ''}${item.category}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.color}', -1)" aria-label="Decrease quantity">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.color}', 1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
      <button class="remove-btn" onclick="removeItem(${item.id}, '${item.color}')" aria-label="Remove ${item.name}">✕</button>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  summary.innerHTML = `
    <div class="cart-summary">
      <div class="summary-title">Order Summary</div>
      <div class="summary-line"><span>Subtotal (${cart.reduce((a,i)=>a+i.qty,0)} items)</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="summary-line"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span></div>
      <div class="summary-line"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
      <div class="summary-line total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      ${shipping > 0 ? `<p style="font-size:0.8rem;color:var(--clr-ink-soft);margin-top:8px">Add $${(75 - subtotal).toFixed(2)} more for free shipping!</p>` : ''}
      <button class="checkout-cta" onclick="goToCheckout()">Proceed to Checkout →</button>
    </div>
  `;
}

function changeQty(id, color, delta) {
  const item = cart.find(i => i.id === id && i.color === color);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
}

function removeItem(id, color) {
  cart = cart.filter(i => !(i.id === id && i.color === color));
  saveCart();
  renderCart();
  showToast('Item removed from cart');
}

// ─── Checkout ─────────────────────────────────────────────────
function goToCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!'); return; }
  renderCheckoutSummary();
  showPage('checkout');
}

function renderCheckoutSummary() {
  const panel = $('#checkout-summary');
  if (!panel) return;

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  panel.innerHTML = `
    <h3>Order Summary</h3>
    ${cart.map(item => `
      <div class="checkout-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="checkout-item-info">
          <strong>${item.name}</strong>
          <span>Qty: ${item.qty}${item.color ? ' · ' + item.color : ''}</span>
        </div>
        <span class="checkout-item-price">$${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `).join('')}
    <hr style="margin:16px 0;border:none;border-top:1px solid var(--clr-border)" />
    <div class="summary-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    <div class="summary-line"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span></div>
    <div class="summary-line"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
    <div class="summary-line total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
  `;
}

async function placeOrder() {
  const firstName = $('#first-name')?.value.trim();
  const lastName = $('#last-name')?.value.trim();
  const email = $('#email-input')?.value.trim();

  if (!firstName || !lastName || !email) {
    showToast('⚠️ Please fill in your contact details');
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { firstName, lastName, email },
        items: cart,
        total: total.toFixed(2)
      })
    });
    const data = await res.json();
    if (data.success) {
      const confirmMsg = $('#confirm-order-id');
      if (confirmMsg) confirmMsg.textContent = `Order #${data.orderId} has been placed.`;
      showPage('confirmation');
      resetCart();
    }
  } catch (e) {
    showToast('⚠️ Order failed. Please try again.');
  }
}

// ─── Navbar Search ────────────────────────────────────────────
function initSearch() {
  const input = $('#nav-search-input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (!q) return;
      currentCategory = 'all';
      fetch(`/api/products?search=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(products => {
          const grid = $('#products-grid');
          const label = $('#product-count-label');
          if (grid) grid.innerHTML = products.map(createProductCard).join('');
          if (label) label.textContent = `${products.length} result${products.length !== 1 ? 's' : ''} for "${q}"`;
          showPage('products');
        });
    }
  });
}

// ─── Initialise ───────────────────────────────────────────────
async function init() {
  updateCartBadge();
  await loadFeatured();
  await loadProducts();
  initSearch();

  // Cart nav link
  $('#cart-nav-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderCart();
    showPage('cart');
  });
}

document.addEventListener('DOMContentLoaded', init);

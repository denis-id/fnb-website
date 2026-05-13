import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

import aLogo from './assets/a-logo.png';
import aldiniImg from './assets/aldini.webp';
import headerImg from './assets/header.png';
import nasiTumpengWebp from './assets/nasi-tumpeng.webp';
import nasiKuningWebp from './assets/nasi-kuning.webp';
import nasiBentoWebp from './assets/nasi-bento.webp';
import nasiKotakWebp from './assets/nasi-kotak.webp';
import nasiStyrofoamWebp from './assets/nasi-styrofoam.webp';
import nasiKotakKrecekWebp from './assets/nasi-kotak-krecek.webp';

const MENU_ITEMS = [
  { id: 1, img: nasiTumpengWebp, name: 'Nasi Tumpeng', desc: 'Hidangan tradisional indonesia yang berasal dari Jawa yang dimasak perlahan dan kaya rasa, dibumbui dengan rempah-rempah aromatik untuk cita rasa tradisional. Makanan ini wajib disantap saat perayaan.', price: 700000, priceStr: 'Rp 700.000,00', hidden: false},
  { id: 2, img: nasiKuningWebp, name: 'Nasi Kuning Prasmanan', desc: 'Nasi kuning Prasmanan terbuat dari beras yang dimasak dengan kunyit, santan, dan rempah-rempah. Nasi kuning memiliki rasa gurih dan berwarna kuning.', price: 20000, priceStr: 'Rp 20.000,00', hidden: false},
  { id: 3, img: nasiBentoWebp, name: 'Nasi Bento', desc: 'Nasi bento terdiri dari nasi, lauk-pauk, dan makanan pelengkap lainnya dalam kemasan praktis. Nasi bento cocok untuk bekal kamu.', price: 25000, priceStr: 'Rp 25.000,00', hidden: false},
  { id: 4, img: nasiKotakWebp, name: 'Nasi Kotak', desc: 'Nasi kotak memiliki banyak variasi dan kombinasi bahan makanan yang dapat disajikan, seperti ayam goreng, daging sapi tumis, ikan bakar, tahu, dan tempe goreng.', price: 15000, priceStr: 'Rp 15.000,00', hidden: true},
  { id: 5, img: nasiStyrofoamWebp, name: 'Nasi Styrofoam', desc: 'Nasi Styrofoam nasi yang dikemas dalam kotak styrofoam yang berisi potongan ayam, tahu bumbu bali, mie dan berbagai macam sayuran yang dimasak matang dengan bumbu rempah-rempah sehingga rasanya gurih.', price: 25000, priceStr: 'Rp 25.000,00', hidden: true},
  { id: 6, img: nasiKotakKrecekWebp, name: 'Nasi Kotak Krecek', desc: 'Lauk krecek dalam kemasan kotak berisi potongan kulit sapi, telur dan sayuran yang dikeringkan dan dimasak dengan bumbu rempah-rempah.', price: 15000, priceStr: 'Rp 15.000,00', hidden: true},
];

function generateInvoiceNumber() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `INV-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(Math.random()*9000)+1000}`;
}

function App() {
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const [skeletonHide, setSkeletonHide] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [navOpen, setNavOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart')) || [];

      return saved.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
      }));
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const alertTimerRef = useRef(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [menuHighlight, setMenuHighlight] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const invoiceContentRef = useRef(null);

  // Skeleton
  useEffect(() => {
    const t1 = setTimeout(() => {
      setSkeletonHide(true);
      const t2 = setTimeout(() => setSkeletonVisible(false), 500);
      return () => clearTimeout(t2);
    }, 1500);
    return () => clearTimeout(t1);
  }, []);

  // Dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Cart persist
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  // Menu highlight
  useEffect(() => {
    const t = setTimeout(() => { setMenuHighlight(true); setTimeout(() => setMenuHighlight(false), 1500); }, 700);
    return () => clearTimeout(t);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (cartOpen || checkoutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [cartOpen, checkoutOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setCartOpen(false); setCheckoutOpen(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Map init
  useEffect(() => {
    if (!checkoutOpen) return;
    const timer = setTimeout(() => {
      if (!window.L) return;
      if (mapObjRef.current) { mapObjRef.current.invalidateSize(); return; }
      if (!mapRef.current) return;
      const map = window.L.map(mapRef.current, { attributionControl: false }).setView([-8.65, 115.2167], 15);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);
      const marker = window.L.marker([-8.65, 115.2167], { draggable: true }).addTo(map);
      marker.on('dragend', () => { const ll = marker.getLatLng(); getAddressFromCoords(ll.lat, ll.lng); });
      map.on('click', (e) => { marker.setLatLng(e.latlng); getAddressFromCoords(e.latlng.lat, e.latlng.lng); });
      mapObjRef.current = map;
      markerRef.current = marker;
    }, 300);
    return () => clearTimeout(timer);
  }, [checkoutOpen]);

  const getAddressFromCoords = useCallback((lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => r.json())
      .then(data => {
        const raw = data.display_name || 'Alamat tidak ditemukan';

        const blacklist = [
          'Lesser Sunda Islands',
          'Nusa Tenggara'
        ];

        const cleaned = raw
          .split(',')
          .map(part => part.trim())
          .filter(part =>
            part &&
            !blacklist.some(b =>
              part.toLowerCase().includes(b.toLowerCase())
            )
          )
          .filter((part, index, arr) => arr.indexOf(part) === index)
          .join(', ')
          .replace(/\s+,/g, ',')
          .trim();

        setCustomerAddress(cleaned);
      })
      .catch(() => setCustomerAddress('Gagal mengambil alamat'));
  }, []);

  const showAlertMsg = useCallback((msg) => {
    setAlertMsg(msg);
    setAlertVisible(true);
    clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setAlertVisible(false), 2500);
  }, []);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        qty: 1,
        img: item.img
      }];
    });
    // Swal toast lalu buka panel keranjang
    window.Swal?.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${item.name}`,
      text: 'Berhasil ditambahkan ke keranjang!',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      didClose: () => {
        setCartOpen(true);
        // Scroll smooth ke area cart panel
        setTimeout(() => {
          const cartEl = document.getElementById('cartPanel');
          if (cartEl) cartEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      },
    });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }, []);

  const cartTotal = cart.reduce(
    (sum, c) => sum + (Number(c.price) || 0) * (Number(c.qty) || 0),
    0
  );
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      window.Swal?.fire({
        icon: 'warning',
        title: 'Keranjang Kosong!',
        html: `<p style="color:#555;font-size:15px;">Silahkan tambahkan menu terlebih dahulu ke keranjang Anda 🍽️</p>`,
        confirmButtonText: '🍴 Pilih Menu',
        confirmButtonColor: '#f95555',
      }).then(() => {
        setCartOpen(false);
        const s = document.querySelector('#menu');
        if (s) window.scrollTo({ top: s.offsetTop - 80, behavior: 'smooth' });
      });
      return;
    }
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  }, [cart]);

  const confirmCheckout = useCallback(async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      window.Swal?.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap!',
        html: `<p style="color:#555;font-size:15px;">Mohon lengkapi <strong>nama</strong>, <strong>nomor HP</strong>, dan <strong>alamat</strong> pengiriman terlebih dahulu.</p>`,
        confirmButtonText: 'Oke, Lengkapi',
        confirmButtonColor: '#f95555',
      });
      return;
    }
    const result = await window.Swal?.fire({
      title: '🚀 Konfirmasi Pesanan',
      html: `
        <p style="color:#555;font-size:15px;margin-bottom:10px;">Pesanan Anda senilai</p>
        <p style="font-size:22px;font-weight:700;color:#f95555;">Rp ${cartTotal.toLocaleString('id-ID')}</p>
        <p style="color:#555;font-size:14px;margin-top:8px;">akan dikirim via <strong>WhatsApp</strong> ke tim Dapur Aldini.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🚀 Ya, Kirim Sekarang!',
      cancelButtonText: '← Kembali',
      confirmButtonColor: '#f95555',
      cancelButtonColor: '#737373',
      reverseButtons: true,
    });
    if (!result?.isConfirmed) return;

    let message = 'Halo, saya ingin pesan:\n\n';
    let total = 0;
    cart.forEach(item => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      message += `${item.name}\nTotal Pesanan: ${item.qty}\nSubtotal: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
    });
    message += `Total: Rp ${total.toLocaleString('id-ID')}\n\nNama: ${customerName}\nNo HP: ${customerPhone}\nAlamat: ${customerAddress}`;
    window.open(`https://wa.me/6287887154163?text=${encodeURIComponent(message)}`, '_blank');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setInvoiceData({ number: generateInvoiceNumber(), date: `${dateStr}, ${timeStr}`, name: customerName, phone: customerPhone, address: customerAddress, items: [...cart], total });
    setInvoiceOpen(true);
    setCart([]); localStorage.removeItem('cart');
    setCheckoutOpen(false);

    window.Swal?.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '✅ Pesanan Berhasil Dikirim!',
      text: 'Tim kami akan segera menghubungi Anda.',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }, [cart, customerName, customerPhone, customerAddress, cartTotal]);

  const downloadInvoice = useCallback(() => {
    if (!invoiceContentRef.current || !window.html2pdf) return;
    const opt = { margin: 10, filename: `${invoiceData?.number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(invoiceContentRef.current).save();
  }, [invoiceData]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    window.Swal?.fire({
      toast: true,
      position: 'top-end',
      icon: newMode ? 'success' : 'info',
      title: newMode ? '🌙 Dark Mode Aktif' : '☀️ Light Mode Aktif',
      text: newMode ? 'Tampilan gelap dinyalakan.' : 'Tampilan terang dinyalakan.',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const orderHeader = (e) => {
    e.preventDefault();
    window.Swal?.fire({
      title: '🍽️ Pilih Menu Anda!',
      html: `<p style="color:#555;font-size:15px;">Temukan hidangan favorit Anda dari menu catering <strong>Dapur Aldini</strong> yang lezat dan bergizi.</p>`,
      icon: 'info',
      confirmButtonText: '🔍 Lihat Menu Sekarang',
      confirmButtonColor: '#f95555',
      allowOutsideClick: true,
      allowEscapeKey: true,
    }).then(() => {
      const s = document.querySelector('#menu');
      if (s) window.scrollTo({ top: s.offsetTop - 80, behavior: 'smooth' });
    });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapObjRef.current) mapObjRef.current.setView([lat, lng], 15);
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        getAddressFromCoords(lat, lng);
        window.Swal?.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: '📡 Lokasi Ditemukan!', text: 'Alamat berhasil diisi otomatis.',
          showConfirmButton: false, timer: 2500, timerProgressBar: true,
        });
      }, () => window.Swal?.fire({
        toast: true, position: 'top-end', icon: 'error',
        title: 'Gagal Mendapatkan Lokasi', text: 'Izinkan akses GPS di browser Anda 😢',
        showConfirmButton: false, timer: 2500,
      }));
    } else {
      window.Swal?.fire({
        toast: true, position: 'top-end', icon: 'error',
        title: 'GPS Tidak Didukung', text: 'Browser Anda tidak mendukung GPS 😢',
        showConfirmButton: false, timer: 2500,
      });
    }
  };

  const openMapsPicker = () => {
    window.Swal?.fire({
      toast: true, position: 'top-end', icon: 'info',
      title: '📍 Membuka Google Maps...', showConfirmButton: false, timer: 1800,
    });
    window.open('https://www.google.com/maps', '_blank');
    setTimeout(() => {
      const address = prompt('Paste link / alamat dari Google Maps:');
      if (address) {
        setCustomerAddress(address);
        window.Swal?.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: '✅ Alamat Berhasil Diisi!', showConfirmButton: false, timer: 2000, timerProgressBar: true,
        });
      }
    }, 1000);
  };

  return (
    <>
      {/* SKELETON */}
      {skeletonVisible && (
        <div id="skeletonLoader" className={skeletonHide ? 'hide' : ''}>
          <div className="skeleton-logo"></div>
          <div className="skeleton-brand"></div>
          <div className="skeleton-grid">
            {[1,2,3].map(i => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-img"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-btn"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALERT */}
      <div id="customAlert" className={`alert${alertVisible ? ' show' : ''}`}>
        <div className="alert__content"><span>{alertMsg}</span></div>
      </div>

      {/* FLOATING WA — desktop only */}
      <div className="fixed-element fixed-element--desktop" role="button">
        <a href="https://wa.me/6287887154163/?text=Cathering Dapur Aldini" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-whatsapp fa-2xl" style={{color:'#ffffff'}}></i>
        </a>
      </div>

      {/* CART FAB — desktop only */}
      <div id="cartButton" className="cart-btn--desktop" onClick={() => setCartOpen(o => !o)}>
        <span style={{fontSize:'18px'}}>🛒</span>
        <span style={{fontSize:'13px',fontWeight:700}}>Keranjang</span>
        <span id="cartCount">{cartCount}</span>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div id="mobileBottomNav">
        {/* WhatsApp */}
        <a
          href="https://wa.me/6287887154163/?text=Cathering Dapur Aldini"
          target="_blank" rel="noopener noreferrer"
          className="mob-nav-item mob-nav-wa"
        >
          <span className="mob-nav-icon">
            <i className="fa-brands fa-whatsapp"></i>
          </span>
          <span className="mob-nav-label">WhatsApp</span>
        </a>

        <div className="mob-nav-divider"></div>

        {/* Keranjang */}
        <div className="mob-nav-item mob-nav-cart" onClick={() => setCartOpen(o => !o)}>
          <span className="mob-nav-icon">
            <i className="ri-shopping-cart-2-line"></i>
            {cartCount > 0 && <span className="mob-nav-badge">{cartCount}</span>}
          </span>
          <span className="mob-nav-label">Keranjang</span>
        </div>

        <div className="mob-nav-divider"></div>

        {/* Dark Mode */}
        <div className="mob-nav-item mob-nav-theme" onClick={toggleDarkMode}>
          <span className="mob-nav-icon">
            <i className={isDarkMode ? 'ri-sun-line' : 'ri-moon-line'}></i>
          </span>
          <span className="mob-nav-label">{isDarkMode ? 'Light' : 'Dark'}</span>
        </div>
      </div>

      {/* OVERLAY */}
      <div id="cartOverlay" className={cartOpen ? 'show' : ''} onClick={() => setCartOpen(false)}></div>

      {/* ── CART PANEL PREMIUM ──────────────────────────────── */}
      <div id="cartPanel" className={cartOpen ? 'show' : ''}>
        <div id="dragHandle"></div>

        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-brand">
            <div className="cart-header-icon">🛒</div>
            <div>
              <h3>Keranjang Saya</h3>
              <div className="cart-header-subtitle">{cartCount} item dipilih</div>
            </div>
          </div>
          <div className="cart-header-actions">
            <button onClick={() => setCartOpen(false)} title="Tutup">
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div id="cartContent">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🍽️</div>
              <strong style={{color:'var(--cart-text)',fontSize:'16px'}}>Keranjang Kosong</strong>
              <p>Yuk tambahkan menu favorit kamu dari pilihan kami yang lezat</p>
            </div>
          ) : (
            <div id="cartItems">
              {cart.map((item, i) => (
                <div className="cart-item" key={item.id} style={{animationDelay:`${i*0.06}s`}}>
                  <div className="cart-item-img-wrap"><img src={item.img} alt={item.name} className="cart-item-img" /></div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">Rp {item.price.toLocaleString('id-ID')} / porsi</div>
                  </div>
                  <div className="cart-qty">
                    <button onClick={() => changeQty(item.id, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)}>+</button>
                  </div>
                  <div className="cart-item-subtotal">Rp {(item.price*item.qty).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-promo">
                <span>🎉</span>
                <span>Gratis ongkir untuk area Denpasar, Bali</span>
              </div>
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>Subtotal ({cartCount} item)</span>
                  <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Ongkos kirim</span>
                  <span style={{color:'#16a34a',fontWeight:700}}>Gratis</span>
                </div>
                <div className="cart-summary-total">
                  <span>Total</span>
                  <span className="cart-summary-total-amount">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <button className="cart-checkout-btn" onClick={openCheckout}>
                <span>Pesan Sekarang</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CHECKOUT MODAL PREMIUM ──────────────────────────── */}
      <div id="checkoutModal" className="checkout-modal" style={{display: checkoutOpen ? 'flex' : 'none'}}>
        <div className="checkout-box">
          {/* Header band */}
          <div className="checkout-header-band">
            <div className="checkout-header-tag">✦ Konfirmasi Pesanan</div>
            <h3 className="checkout-header-title">Checkout</h3>
            <p className="checkout-header-subtitle">Lengkapi data di bawah untuk menyelesaikan pesanan</p>
          </div>

          <div className="checkout-body">
            {/* Order summary */}
            <div>
              <div className="checkout-section-label">Ringkasan Pesanan</div>
              <div className="checkout-items">
                {cart.map(item => (
                  <div className="checkout-item-row" key={item.id}>
                    <img src={item.img} alt={item.name} className="checkout-item-thumb" />
                    <div className="checkout-item-info">
                      <div className="checkout-item-name">{item.name}</div>
                      <div className="checkout-item-qty">{item.qty} porsi × Rp {item.price.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="checkout-item-price">Rp {(item.price*item.qty).toLocaleString('id-ID')}</div>
                  </div>
                ))}
                <div className="checkout-total-row">
                  <span className="checkout-total-label">Total Pembayaran</span>
                  <span className="checkout-total-amount">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Customer form */}
            <div>
              <div className="checkout-section-label">Data Pemesan</div>
              <div className="checkout-form">
                <div className="checkout-field">
                  <span className="checkout-field-icon">👤</span>
                  <input type="text" placeholder="Nama lengkap Anda" value={customerName} onChange={e => setCustomerName(e.target.value)}/>
                </div>
                <div className="checkout-field">
                  <span className="checkout-field-icon">📞</span>
                  <input type="text" placeholder="Nomor HP aktif" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}/>
                </div>
                <div className="checkout-field">
                  <span className="checkout-field-icon textarea-icon">📍</span>
                  <textarea placeholder="Alamat lengkap pengiriman..." value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}></textarea>
                </div>
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="checkout-section-label">Lokasi Pengiriman</div>
              <div className="map-actions">
                <button onClick={openMapsPicker}>📍 Pilih dari Maps</button>
                <button onClick={getLocation}>📡 Gunakan GPS</button>
              </div>
              <div id="map" ref={mapRef} style={{marginTop:'12px'}}></div>
            </div>
          </div>

          {/* Actions */}
          <div className="checkout-actions">
            <button className="btn-primary" onClick={confirmCheckout}>
              🚀 Kirim Pesanan
            </button>
            <button className="btn-cancel" onClick={() => setCheckoutOpen(false)}>
              ← Kembali
            </button>
          </div>
        </div>
      </div>

      {/* ── INVOICE MODAL ──────────────────────────────────── */}
      <div id="invoiceModal" className={`checkout-modal${invoiceOpen ? ' show' : ''}`} style={{display: invoiceOpen ? 'flex' : 'none'}}>
        <div className="checkout-box" id="invoiceBox">
          <div id="invoiceContent" ref={invoiceContentRef}>
            <div style={{background:'linear-gradient(135deg, #c01111, #ff4444)',borderRadius:'12px',padding:'20px',textAlign:'center',marginBottom:'16px'}}>
              <img src={aLogo} alt="logo" style={{width:'60px',height:'60px',borderRadius:'50%',border:'3px solid white',marginBottom:'8px',display:'block',marginInline:'auto'}}/>
              <h2 style={{color:'white',fontSize:'20px',fontWeight:700,margin:0}}>Dapur Aldini</h2>
              <p style={{color:'rgba(255,255,255,0.85)',fontSize:'12px',margin:'4px 0 0'}}>Catering Masakan Lokal Khas Indonesia</p>
            </div>
            <div style={{background:'#f9f9f9',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><p style={{fontSize:'11px',color:'#888',margin:0}}>Nomor Invoice</p><p style={{fontSize:'13px',fontWeight:700,color:'#222',margin:'2px 0 0'}}>{invoiceData?.number}</p></div>
                <div style={{textAlign:'right'}}><p style={{fontSize:'11px',color:'#888',margin:0}}>Tanggal</p><p style={{fontSize:'12px',fontWeight:600,color:'#222',margin:'2px 0 0'}}>{invoiceData?.date}</p></div>
              </div>
            </div>
            <div style={{textAlign:'center',marginBottom:'14px'}}>
              <span style={{background:'#e8f5e9',color:'#2e7d32',fontSize:'12px',fontWeight:600,padding:'6px 16px',borderRadius:'20px'}}>✅ Pesanan Dikonfirmasi</span>
            </div>
            <div style={{border:'1px solid #eee',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
              <p style={{fontSize:'12px',fontWeight:700,color:'#c01111',margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>📋 Detail Pelanggan</p>
              <div style={{fontSize:'13px',lineHeight:2,color:'#444'}}>
                <div style={{display:'flex',gap:'8px'}}><span style={{minWidth:'60px',color:'#888'}}>Nama</span><span style={{color:'#222',fontWeight:600}}>{invoiceData?.name}</span></div>
                <div style={{display:'flex',gap:'8px'}}><span style={{minWidth:'60px',color:'#888'}}>No HP</span><span style={{color:'#222',fontWeight:600}}>{invoiceData?.phone}</span></div>
                <div style={{display:'flex',gap:'8px'}}><span style={{minWidth:'60px',color:'#888'}}>Alamat</span><span style={{color:'#222',fontWeight:600}}>{invoiceData?.address}</span></div>
              </div>
            </div>
            <div style={{border:'1px solid #eee',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
              <p style={{fontSize:'12px',fontWeight:700,color:'#c01111',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>🛒 Pesanan</p>
              {invoiceData?.items.map(item => {
                const subtotal = item.price * item.qty;
                return (
                  <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px dashed #eee'}}>
                    <div><p style={{margin:0,fontSize:'13px',fontWeight:600,color:'#222'}}>{item.name}</p><p style={{margin:0,fontSize:'12px',color:'#888'}}>{item.qty} x Rp {item.price.toLocaleString('id-ID')}</p></div>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#c01111'}}>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>
            <div style={{background:'linear-gradient(135deg, #c01111, #ff4444)',borderRadius:'10px',padding:'14px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontSize:'14px',fontWeight:600}}>Total Pembayaran</span>
              <span style={{color:'white',fontSize:'18px',fontWeight:700}}>Rp {invoiceData?.total.toLocaleString('id-ID')}</span>
            </div>
            <div style={{textAlign:'center',marginBottom:'8px'}}>
              <p style={{fontSize:'11px',color:'#aaa',marginBottom:'10px'}}>Ikuti kami di sosial media</p>
              <div style={{display:'flex',justifyContent:'center',gap:'12px'}}>
                <a href="https://www.instagram.com/dapuraldini/" target="_blank" rel="noopener noreferrer" style={{background:'#E1306C',color:'white',width:'36px',height:'36px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',textDecoration:'none'}}><i className="fab fa-instagram"></i></a>
                <a href="https://wa.me/6287887154163" target="_blank" rel="noopener noreferrer" style={{background:'#25D366',color:'white',width:'36px',height:'36px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',textDecoration:'none'}}><i className="fab fa-whatsapp"></i></a>
              </div>
            </div>
            <p style={{fontSize:'11px',color:'#bbb',textAlign:'center',marginTop:'10px'}}>Terima kasih telah memesan di Dapur Aldini! Kami akan segera memproses pesanan Anda.</p>
          </div>
          <div className="checkout-actions" style={{marginTop:'16px',padding:'16px 0 0',border:'none',position:'relative',background:'transparent'}}>
            <button onClick={downloadInvoice} className="btn-primary">⬇️ Download PDF</button>
            <button onClick={() => { setInvoiceOpen(false); window.Swal?.fire({ toast: true, position: 'top-end', icon: 'success', title: '🚀 Pesanan Berhasil Dikirim!', text: 'Terima kasih telah memesan di Dapur Aldini!', showConfirmButton: false, timer: 3000, timerProgressBar: true }); }} className="btn-cancel">Tutup</button>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky-navbar">
        <div className="nav__header">
          <div className="nav__logo">
            <a href="#">
              <img src={aLogo} alt="logo" className="logo-white"/>
              <img src={aLogo} alt="logo" className="logo-dark"/>
            </a>
          </div>
          <div className="nav__menu__btn" id="menu-btn" onClick={() => setNavOpen(o => !o)}>
            <i className={navOpen ? 'ri-close-line' : 'ri-menu-3-line'}></i>
          </div>
        </div>
        <ul className={`nav__links${navOpen ? ' open' : ''}`} id="nav-links" onClick={() => setNavOpen(false)}>
          <li><a href="#home">Home</a></li>
          <li><a href="#menu">Menu</a></li>
        </ul>
        <div className="nav__btns">
          <button id="theme-toggle" className="theme-btn" aria-label="Toggle dark mode" onClick={toggleDarkMode}>
            <i className={isDarkMode ? 'ri-sun-line' : 'ri-moon-line'}></i>
          </button>
        </div>
      </nav>
      <button id="theme-toggle-mobile" className="theme-btn theme-btn-mobile theme-btn--legacy" aria-label="Toggle dark mode" onClick={toggleDarkMode}>
        <i className={isDarkMode ? 'ri-sun-line' : 'ri-moon-line'}></i>
      </button>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="section__container header__container" id="home">
        <div className="header__image">
          <div className="image"><img src={nasiTumpengWebp} alt="header"/></div>
          <div className="header__image__footer">
            <img src={aldiniImg} alt="user"/>
            <p>Nikmati hidangan cathering kami yang lezat dan memanjakan selera, lengkap dengan pelayanan ramah yang membuat setiap sajian terasa istimewa✨</p>
          </div>
        </div>
        <div className="header__content">
          <div className="header__top">
            <span><img src={headerImg} alt="header"/></span>
            <h2>Masakan Lokal Khas, Indonesia</h2>
          </div>
          <h1 className="section__header">Dapur <span>Aldini</span></h1>
          <p>Dapur Aldini, menyediakan berbagai macam menu makanan Cathering yang lezat dan bergizi. Mulai dari Nasi Tumpeng, Nasi Kuning, Nasi Kotak, Nasi Bento, Tahu Bumbu Bali, dll.</p>
          <div className="header__btns">
            <button className="btn" onClick={orderHeader}>
              <a href="#menu" style={{color:'white'}}>Lihat Menu</a>
            </button>
          </div>
          <div className="header__flex">
            <div className="header__card"><img src={nasiTumpengWebp} alt="header__content"/><h4>Nasi Tumpeng</h4></div>
            <div className="header__card"><img src={nasiKuningWebp} alt="header__content"/><h4>Nasi Kuning Prasmanan</h4></div>
            <div className="header__card"><img src={nasiBentoWebp} alt="header__content"/><h4>Nasi Bento</h4></div>
          </div>
        </div>
      </header>

      {/* ── MENU ───────────────────────────────────────────── */}
      <section className={`section__container menu__container${menuHighlight ? ' highlight' : ''}`} id="menu">
        <h2 className="section__header">Menu <span>Kami</span></h2>
        <div className="menu__grid" id="allMenuGrid">
          {MENU_ITEMS.map(item => (
            <div key={item.id} className={`menu__card${item.hidden ? ' menu__hidden' : ''}${item.hidden && menuExpanded ? ' show' : ''}`}>
              <img src={item.img} alt="menu"/>
              <h4>{item.name}</h4>
              <p>{item.desc}</p>
              <div className="menu__card__footer">
                <h3>{item.priceStr}</h3>
                <button className="btn" onClick={() => addToCart(item)}>Order</button>
              </div>
            </div>
          ))}
        </div>
        <div className="menu__btn" style={{marginTop:'2rem'}}>
          <button className="btn" id="toggleMenuBtn" onClick={() => setMenuExpanded(e => !e)}>
            {menuExpanded ? 'Sembunyikan Menu' : 'Tampilkan Semua Menu'}
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer>
        <div className="footer__container">
          {/* Brand col */}
          <div className="footer__col">
            <a href="#" className="footer__logo">
              <img src={aLogo} alt="logo"/>
              <span className="footer__brand">Dapur <span>Aldini</span></span>
            </a>
            <p>Nikmati cita rasa nusantara yang memanjakan lidah. Catering profesional dengan cinta dan rempah pilihan untuk setiap momen istimewa Anda.</p>
            <div className="footer__social-row">
              <a href="https://www.instagram.com/dapuraldini/" target="_blank" rel="noopener noreferrer" className="footer__social-pill instagram">
                <i className="fab fa-instagram"></i> Instagram
              </a>
              <a href="https://wa.me/6287887154163/?text=Cathering Dapur Aldini" target="_blank" rel="noopener noreferrer" className="footer__social-pill whatsapp">
                <i className="fab fa-whatsapp"></i> WhatsApp
              </a>
            </div>
          </div>
          {/* Links col */}
          <div className="footer__col">
            <h4>Hubungi Kami</h4>
            <ul className="footer__links">
              <li>
                <a href="https://www.instagram.com/dapuraldini/" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i> @dapuraldini
                </a>
              </li>
              <li>
                <a href="https://wa.me/6287887154163" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp"></i> +62 878-8715-4163
                </a>
              </li>
              <li>
                <a href="#menu">
                  <i className="ri-restaurant-line"></i> Lihat Menu
                </a>
              </li>
              <li>
                <a href="#home">
                  <i className="ri-home-4-line"></i> Beranda
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bar">
          © {new Date().getFullYear()} Dapur Aldini · Catering Masakan Lokal Khas Indonesia · All rights reserved
        </div>
      </footer>
    </>
  );
}

export default App;

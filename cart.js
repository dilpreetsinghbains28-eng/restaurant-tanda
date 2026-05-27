let cart = JSON.parse(localStorage.getItem('galaxy_cart')) || [];

function addToCart(name, price) {

    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    
    // Visual feedback on button
    if (typeof event !== 'undefined' && event && event.currentTarget) {
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-outlined text-green-500">check_circle</span>`;
        setTimeout(() => { btn.innerHTML = originalHtml; }, 1000);
    }

    // Toast notification for mobile
    showToast('✓ ' + name + ' added to cart');

    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(50);
}

function showToast(message) {
    const toast = document.getElementById('toastNotif');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function removeFromCart(name) {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    updateCartUI();
}

function updateQuantity(name, change) {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(name);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('galaxy_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        if (totalItems > 0) {
            el.textContent = totalItems;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
    renderCartModal();
}

function toggleCartModal() {
    let modal = document.getElementById('cartModal');
    if (!modal) {
        createCartModal();
        modal = document.getElementById('cartModal');
    }
    modal.classList.toggle('hidden');
    document.body.style.overflow = modal.classList.contains('hidden') ? '' : 'hidden';
    renderCartModal();
}

function createCartModal() {
    const modalHTML = `
    <div id="cartModal" class="fixed inset-0 z-[100] flex items-center justify-end hidden">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="toggleCartModal()"></div>
        <div class="relative bg-surface w-full max-w-md h-full shadow-2xl flex flex-col">
            <div class="flex justify-between items-center p-md border-b border-outline-variant">
                <h2 class="text-headline-md font-bold text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined">shopping_cart</span> Your Cart
                </h2>
                <button onclick="toggleCartModal()" class="text-on-surface-variant hover:text-primary">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="cartItemsContainer" class="flex-grow overflow-y-auto p-md space-y-md">
            </div>
            <div id="cartFooter" class="p-md border-t border-outline-variant bg-surface-container-lowest">
                <!-- Checkout form will appear here -->
                <div id="checkoutForm" class="hidden space-y-md mb-md">
                    <h3 class="font-headline-md text-on-surface font-bold">Your Details</h3>
                    <input id="checkoutName" type="text" placeholder="Your Name *" class="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-sm"/>
                    <input id="checkoutPhone" type="tel" pattern="^[6-9]\d{9}$" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="Phone Number *" class="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-sm"/>
                </div>
                <div class="flex justify-between items-center mb-md">
                    <span class="font-headline-md text-on-surface">Total:</span>
                    <span id="cartTotal" class="font-headline-md text-primary font-bold">₹0</span>
                </div>
                <button id="checkoutBtn" onclick="handleCheckout()" class="w-full bg-primary text-on-primary py-md rounded-full font-label-md text-lg shadow-soft hover:brightness-110 transition-all">
                    Proceed to Checkout
                </button>
                <p id="checkoutError" class="text-red-500 text-sm mt-2 hidden text-center"></p>
                <p id="checkoutSuccess" class="text-green-600 text-sm mt-2 hidden text-center"></p>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    if (!container || !totalEl) return;

    // Reset checkout form visibility
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.classList.add('hidden');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.textContent = 'Proceed to Checkout';
        checkoutBtn.onclick = handleCheckout;
    }

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center text-on-surface-variant opacity-70">
                <span class="material-symbols-outlined text-6xl mb-4">remove_shopping_cart</span>
                <p class="font-body-lg">Your cart is empty</p>
                <button onclick="toggleCartModal()" class="mt-4 text-primary font-label-md hover:underline">Continue Shopping</button>
            </div>`;
        totalEl.textContent = '₹0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="flex items-center justify-between bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
                <div class="flex-1">
                    <h4 class="font-label-md text-on-surface">${item.name}</h4>
                    <p class="text-primary font-bold text-sm">₹${item.price}</p>
                </div>
                <div class="flex items-center gap-3 bg-surface rounded-full px-2 py-1 border border-outline-variant/30">
                    <button onclick="updateQuantity('${item.name}', -1)" class="text-on-surface-variant hover:text-primary material-symbols-outlined text-sm">remove</button>
                    <span class="font-label-md w-4 text-center">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.name}', 1)" class="text-on-surface-variant hover:text-primary material-symbols-outlined text-sm">add</button>
                </div>
            </div>`;
    }).join('');
    totalEl.textContent = '₹' + total;
}

let checkoutStep = 0; // 0 = show form, 1 = submit

// Helper to get logged-in user data from token or window.currentUser
function getLoggedInUser() {
    // First check if auth.js has already set it
    if (window.currentUser && window.currentUser.name) {
        return window.currentUser;
    }
    // Fallback: decode from localStorage token (static hosting)
    const token = localStorage.getItem('galaxy_token');
    if (!token) return null;
    try {
        const userData = JSON.parse(atob(token));
        if (userData && userData.name) {
            return { name: userData.name, phone: userData.phone || '' };
        }
    } catch(e) { /* Invalid token */ }
    return null;
}

function handleCheckout() {
    if (cart.length === 0) return;

    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const errorEl = document.getElementById('checkoutError');
    const successEl = document.getElementById('checkoutSuccess');

    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    // Always require login to checkout
    if (!localStorage.getItem('galaxy_token')) {
        if (confirm('You need to login to place an order.\n\nClick OK to go to the Login page.')) {
            window.location.href = 'login.html?redirect=cart';
        }
        return;
    }

    if (checkoutForm.classList.contains('hidden')) {
        // Step 1: Show the form with auto-filled data from login
        checkoutForm.classList.remove('hidden');
        checkoutBtn.textContent = 'Place Order & Chat on WhatsApp';
        
        // Auto-fill from login details
        const user = getLoggedInUser();
        if (user) {
            document.getElementById('checkoutName').value = user.name;
            document.getElementById('checkoutPhone').value = user.phone || '';
        }
        
        // Focus on phone if name is filled, otherwise name
        if (user && user.name) {
            const phoneInput = document.getElementById('checkoutPhone');
            if (!phoneInput.value) phoneInput.focus();
        } else {
            document.getElementById('checkoutName').focus();
        }
        return;
    }

    // Step 2: Validate and submit
    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();

    if (!name || !phone) {
        errorEl.textContent = 'Please enter your name and phone number.';
        errorEl.classList.remove('hidden');
        return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        errorEl.textContent = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.';
        errorEl.classList.remove('hidden');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Placing order...';

    // Check if backend is available (localhost) or static hosting
    const isStatic = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isStatic) {
        // Static hosting (GitHub Pages) — save to localStorage + WhatsApp
        const orderId = 'GR-' + Date.now().toString(36).toUpperCase();
        
        // Save order to localStorage for admin dashboard
        const orders = JSON.parse(localStorage.getItem('galaxy_orders') || '[]');
        orders.unshift({
            id: orderId,
            customerName: name,
            customerPhone: phone,
            items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
            total: total,
            status: 'New',
            createdAt: new Date().toISOString(),
            userId: getLoggedInUser() ? 'registered' : null
        });
        localStorage.setItem('galaxy_orders', JSON.stringify(orders));

        let orderDetails = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
        let message = `Hello Galaxy Restaurant! I'd like to place an order:%0A%0AName: ${name}%0APhone: ${phone}%0A%0A${orderDetails}%0A%0ATotal: ₹${total}%0AOrder ID: ${orderId}`;

        setTimeout(() => {
            window.open(`https://wa.me/918437227755?text=${message}`, '_blank');
            cart = [];
            saveCart();
            updateCartUI();
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Proceed to Checkout';
            document.getElementById('checkoutName').value = '';
            document.getElementById('checkoutPhone').value = '';
            checkoutForm.classList.add('hidden');
            successEl.textContent = `Order ${orderId} sent to WhatsApp!`;
            successEl.classList.remove('hidden');
        }, 500);
    } else {
        // Backend available — POST to API
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: name,
                customerPhone: phone,
                items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
                total: total,
                userId: typeof getUserId === "function" ? getUserId() : null
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                successEl.textContent = `Order ${data.order.id} placed! Redirecting to WhatsApp...`;
                successEl.classList.remove('hidden');
                let orderDetails = cart.map(item => `${item.quantity}x ${item.name}`).join('%0A');
                let message = `Hello Galaxy Restaurant! I'd like to place an order:%0A%0AName: ${name}%0APhone: ${phone}%0A%0A${orderDetails}%0A%0ATotal: ₹${total}%0AOrder ID: ${data.order.id}`;
                setTimeout(() => {
                    window.open(`https://wa.me/918437227755?text=${message}`, '_blank');
                    cart = [];
                    saveCart();
                    updateCartUI();
                    checkoutBtn.disabled = false;
                    checkoutBtn.textContent = 'Proceed to Checkout';
                    document.getElementById('checkoutName').value = '';
                    document.getElementById('checkoutPhone').value = '';
                    checkoutForm.classList.add('hidden');
                }, 1500);
            } else {
                errorEl.textContent = data.message || 'Order failed. Please try again.';
                errorEl.classList.remove('hidden');
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Place Order & Chat on WhatsApp';
            }
        })
        .catch(err => {
            errorEl.textContent = 'Connection error. Please try again.';
            errorEl.classList.remove('hidden');
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Place Order & Chat on WhatsApp';
        });
    }
}

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});

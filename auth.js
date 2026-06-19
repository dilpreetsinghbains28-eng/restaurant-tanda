window.currentUser = null;

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// // let window.currentUser = null;

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}



// Ensure UI components exist in DOM
function initAuthUI() {
    // 1. Add notification bell and login link to nav if not exists
    const cartBtn = document.querySelector('button[onclick="toggleCartModal()"]') || document.querySelector('button[onclick="toggleDarkMode()"]');
    const navRight = cartBtn ? cartBtn.parentElement : null;
    if (navRight && !document.getElementById('navNotifBtn')) {
        navRight.insertAdjacentHTML('afterbegin', `
            <button id="navNotifBtn" onclick="toggleNotifModal()" class="relative hidden text-on-surface-variant hover:text-primary transition-colors p-2">
                <span class="material-symbols-outlined text-2xl">notifications</span>
                <span id="notifBadge" class="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white hidden"></span>
            </button>
        `);
    }

    // 2. Add Notifications Modal
    if (!document.getElementById('notifModal')) {
        document.body.insertAdjacentHTML('beforeend', `
        <div id="notifModal" class="fixed inset-0 z-[100] flex items-center justify-end hidden">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="toggleNotifModal()"></div>
            <div class="relative bg-surface w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div class="flex justify-between items-center p-6 border-b border-outline-variant bg-surface-container-lowest">
                    <h2 class="text-xl font-bold text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined">notifications</span> Notifications
                    </h2>
                    <div class="flex items-center gap-2">
                        <button id="markAllReadBtn" onclick="markAllNotificationsRead()" class="text-xs text-primary hover:underline font-semibold hidden">Mark all as read</button>
                        <button onclick="toggleNotifModal()" class="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-high transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                <div id="notifList" class="flex-grow overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
                    <!-- Notifications -->
                </div>
            </div>
        </div>
        `);
    }
}

// UI Toggles
function toggleNotifModal() {
    const modal = document.getElementById('notifModal');
    modal.classList.toggle('hidden');
    document.body.style.overflow = modal.classList.contains('hidden') ? '' : 'hidden';
    // Always refresh notifications when opening
    if (!modal.classList.contains('hidden')) {
        const isStatic = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isStatic) loadLocalNotifications();
    }
}

function markAllNotificationsRead() {
    const isStatic = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isStatic) {
        const notifs = JSON.parse(localStorage.getItem('galaxy_notifications') || '[]');
        notifs.forEach(n => n.isRead = true);
        localStorage.setItem('galaxy_notifications', JSON.stringify(notifs));
        loadLocalNotifications();
        return;
    }
    if (!window.currentUser) return;
    fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('galaxy_token') }
    }).then(() => checkUserStatus());
}

// Load notifications from localStorage (for static hosting)
function loadLocalNotifications() {
    const notifications = JSON.parse(localStorage.getItem('galaxy_notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Update badge
    const badge = document.getElementById('notifBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Update mark-all-read button
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        if (unreadCount > 0) markAllBtn.classList.remove('hidden');
        else markAllBtn.classList.add('hidden');
    }

    // Render notifications list
    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#999;padding-top:80px;">
            <span class="material-symbols-outlined" style="font-size:64px;margin-bottom:16px;opacity:0.5;">notifications_off</span>
            <p style="font-size:16px;font-weight:600;color:#666;">No notifications yet</p>
            <p style="font-size:12px;margin-top:8px;color:#aaa;">Order updates and admin messages will appear here</p>
        </div>`;
    } else {
        list.innerHTML = notifications.map(n => {
            const iconMap = {
                'reply': 'chat_bubble',
                'status_update': 'update',
                'order_confirmed': 'check_circle',
                'order_completed': 'task_alt',
                'order_cancelled': 'cancel',
                'reservation_confirmed': 'event_available',
                'reservation_completed': 'event_available'
            };
            const icon = iconMap[n.notifType] || 'notifications';
            const colorMap = {
                'reply': { bg: '#eff6ff', color: '#2563eb' },
                'order_confirmed': { bg: '#f0fdf4', color: '#16a34a' },
                'order_completed': { bg: '#ecfdf5', color: '#059669' },
                'order_cancelled': { bg: '#fef2f2', color: '#dc2626' },
                'reservation_confirmed': { bg: '#f0fdf4', color: '#16a34a' },
                'reservation_completed': { bg: '#ecfdf5', color: '#059669' },
                'status_update': { bg: '#fff7ed', color: '#ea580c' }
            };
            const colors = colorMap[n.notifType] || { bg: '#fff7ed', color: '#ea580c' };
            const borderColor = n.isRead ? '#e5e7eb' : '#944217';
            const cardOpacity = n.isRead ? '0.65' : '1';

            return `
            <div style="background:#fff;padding:16px;border-radius:12px;border:1.5px solid ${borderColor};position:relative;overflow:hidden;opacity:${cardOpacity};margin-bottom:12px;">
                ${!n.isRead ? '<div style="position:absolute;top:0;left:0;width:4px;height:100%;background:#944217;"></div>' : ''}
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:${colors.bg};color:${colors.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:20px;">${icon}</span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                            <p style="font-size:14px;font-weight:700;color:#1f2937;">${sanitizeHTML(n.title || 'Notification')}</p>
                            ${!n.isRead ? '<span style="width:10px;height:10px;background:#944217;border-radius:50%;flex-shrink:0;"></span>' : ''}
                        </div>
                        <p style="font-size:13px;color:#4b5563;line-height:1.5;">${sanitizeHTML(n.text)}</p>
                        ${n.orderId ? `<span style="display:inline-block;font-size:10px;font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#6b7280;margin-top:8px;">${n.orderId}</span>` : ''}
                        <p style="font-size:10px;color:#9ca3af;margin-top:8px;display:flex;align-items:center;gap:4px;">
                            <span class="material-symbols-outlined" style="font-size:12px;">schedule</span> ${new Date(n.date).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

// Added global function to toggle profile dropdown
window.toggleProfileDropdown = function() {
    const dd = document.getElementById('profileDropdownMenu');
    if (dd) dd.classList.toggle('hidden');
};

window.logoutUser = function() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('galaxy_token');
        window.location.href = 'login.html';
    }
};

function updateAuthUI() {
    const notifBtn = document.getElementById('navNotifBtn');
    
    if (window.currentUser) {
        if (notifBtn) notifBtn.classList.remove('hidden');

        // Add top-left user badge to the LEFT of brand logo
        const brandLogo = document.querySelector('nav > div > a') || document.querySelector('header > div > a');
        if (brandLogo && !document.getElementById('userTopLeftMenu')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center gap-3';
            brandLogo.parentNode.insertBefore(wrapper, brandLogo);
            wrapper.appendChild(brandLogo); // Brand logo becomes the 2nd child
            
            wrapper.insertAdjacentHTML('afterbegin', `
                <div id="userTopLeftMenu" class="relative">
                    <button onclick="toggleProfileDropdown()" class="flex items-center justify-center p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors border border-outline-variant/30 text-primary">
                        <span class="material-symbols-outlined text-2xl">account_circle</span>
                    </button>
                    
                    <div id="profileDropdownMenu" class="absolute top-full left-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-outline-variant hidden flex-col overflow-hidden z-50">
                        <div class="p-4 border-b border-outline-variant/50 bg-surface-container-lowest">
                            <p class="font-bold text-on-surface text-sm truncate">${window.currentUser.name}</p>
                            <p class="text-xs text-on-surface-variant mt-1">${window.currentUser.phone}</p>
                        </div>
                        <button onclick="logoutUser()" class="w-full text-left px-4 py-3 text-error hover:bg-error/10 transition-colors flex items-center gap-2 text-sm font-semibold">
                            <span class="material-symbols-outlined text-[18px]">logout</span> Sign Out
                        </button>
                    </div>
                </div>
            `);
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('userTopLeftMenu');
                const dd = document.getElementById('profileDropdownMenu');
                if (menu && dd && !menu.contains(e.target)) {
                    dd.classList.add('hidden');
                }
            });
        }
        
        // Auto-fill forms if they exist (non-dynamic ones)
        if (document.getElementById('bookName')) {
            document.getElementById('bookName').value = window.currentUser.name;
            document.getElementById('bookPhone').value = window.currentUser.phone;
        }
        if (document.getElementById('contactName')) {
            document.getElementById('contactName').value = window.currentUser.name;
        }
    } else {
        if (notifBtn) notifBtn.classList.add('hidden');
        if (document.getElementById('notifBadge')) {
            document.getElementById('notifBadge').classList.add('hidden');
        }
        const topLeftBadge = document.getElementById('userTopLeftMenu');
        if (topLeftBadge) {
            const wrapper = topLeftBadge.parentNode;
            const logo = wrapper.querySelector('a');
            wrapper.parentNode.insertBefore(logo, wrapper);
            wrapper.remove();
        }
    }
}

// Notification Polling & User Validation
function checkUserStatus() {
    const token = localStorage.getItem('galaxy_token');
    if (!token) return;

    // Skip API calls on static hosting (GitHub Pages)
    const isStatic = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isStatic) {
        // Decode user from localStorage token
        try {
            const userData = JSON.parse(atob(token));
            if (userData && userData.name) {
                window.currentUser = { name: userData.name, phone: userData.phone || '' };
                window.currentUser = window.currentUser;
                updateAuthUI();
                loadLocalNotifications();
            }
        } catch(e) { /* Invalid token, ignore */ }
        return;
    }

    fetch('/api/user/me', {
        headers: { 'Authorization': token }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            window.currentUser = data.user;
            window.currentUser = data.user;
            updateAuthUI();

            
            // Render notifications
            const badge = document.getElementById('notifBadge');
            if (badge) {
                if (data.unreadCount > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
            
            const list = document.getElementById('notifList');
            const markAllBtn = document.getElementById('markAllReadBtn');
            
            if (list) {
                if (markAllBtn) {
                    if (data.unreadCount > 0) markAllBtn.classList.remove('hidden');
                    else markAllBtn.classList.add('hidden');
                }

                if (data.notifications.length === 0) {
                    list.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-gray-400 mt-10">
                        <span class="material-symbols-outlined text-6xl mb-4 opacity-50">notifications_off</span>
                        <p>No notifications yet</p>
                    </div>`;
                } else {
                    list.innerHTML = data.notifications.map(n => `
                        <div class="bg-surface p-4 rounded-xl border ${n.isRead ? 'border-outline-variant/30 opacity-70' : 'border-primary/30 shadow-sm'} relative overflow-hidden transition-all">
                            ${!n.isRead ? '<div class="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>' : ''}
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">${n.id}</span>
                                    <span class="text-[10px] bg-orange-50 text-[#944217] px-2 py-0.5 rounded-full capitalize font-bold border border-[#944217]/10">${n.type}</span>
                                    ${n.status ? `<span class="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase border border-blue-200">${n.status}</span>` : ''}
                                </div>
                                ${!n.isRead ? '<span class="w-2 h-2 bg-primary rounded-full"></span>' : ''}
                            </div>
                            <p class="text-sm font-bold text-on-surface mb-1">${n.notifType === 'reply' ? 'Admin Message' : 'Order Update'}</p>
                            <p class="text-sm text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 leading-relaxed">${sanitizeHTML(n.text)}</p>
                            <p class="text-[10px] text-on-surface-variant/60 mt-2 flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">schedule</span> ${new Date(n.date).toLocaleString('en-IN')}
                            </p>
                        </div>
                    `).join('');
                }
            }
        } else {
            // Invalid token
            localStorage.removeItem('galaxy_token');
            window.currentUser = null;

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

            updateAuthUI();
        }
    })
    .catch(() => { /* Silently ignore on network errors */ });
}

// Global function to get current user ID for API calls
function getUserId() {
    const token = localStorage.getItem('galaxy_token');
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).id || token;
        }
    } catch (e) {
        console.error('Error decoding token:', e);
    }
    return token;
}

// Redirect helper
function requireLogin(redirectTarget) {
    if (!getUserId()) {
        window.location.href = 'login.html?redirect=' + redirectTarget;
        return false;
    }
    return true;
}

// Auto-cleanup old localStorage data (keep only last 30 days)
function cleanupOldData() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    ['galaxy_orders', 'galaxy_reservations', 'galaxy_messages', 'galaxy_notifications'].forEach(key => {
        try {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = items.filter(item => {
                const itemDate = new Date(item.createdAt || item.date || 0).getTime();
                return itemDate > thirtyDaysAgo;
            });
            if (filtered.length !== items.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
            }
        } catch(e) { /* ignore */ }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    checkUserStatus();
    cleanupOldData();
    // Poll every 30 seconds
    setInterval(() => {
    if (!document.hidden) checkUserStatus();
}, 30000);
});

# 🍽️ Galaxy Restaurant - Urmar Tanda

A premium restaurant website for Galaxy Restaurant featuring online ordering, table reservations, and an admin dashboard.

## 🌐 Live Site
**[Visit Live Site](https://dilpreetsinghbains28-eng.github.io/restaurant-tanda/index.html)**

## ✨ Features
- 🛒 **Online Ordering** — Browse menu, add to cart, checkout via WhatsApp
- 📅 **Table Reservations** — Book tables with date/time selection
- 👤 **User Authentication** — Register/login to save your details
- 📱 **Mobile Responsive** — Works on all screen sizes
- 🌙 **Dark Mode** — Toggle between light and dark themes
- ⚙️ **Admin Dashboard** — View orders, reservations & messages

## 🚀 Running Locally (with Backend Server)

For full backend functionality (admin dashboard with database, user notifications, etc.):

```bash
# 1. Clone the repository
git clone https://github.com/dilpreetsinghbains28-eng/restaurant-tanda.git
cd restaurant-tanda

# 2. Install dependencies
npm install

# 3. Start the server
node server.js

# 4. Open in browser
# Visit: http://localhost:8080
```

### Admin Dashboard
- URL: `http://localhost:8080/admin.html`
- Password: `galaxy2024`

> **Note:** On the live GitHub Pages site, the admin dashboard uses browser localStorage to store data. For full server-backed storage, run the Node.js server locally.

## 📁 Project Structure
```
├── index.html          # Home page
├── menu.html           # Menu & ordering
├── about.html          # About us page
├── contact.html        # Contact form
├── login.html          # Login / Register
├── admin.html          # Admin dashboard
├── cart.js             # Shopping cart logic
├── auth.js             # Authentication system
├── server.js           # Node.js backend server
├── images/             # Food & menu images
└── README.md           # This file
```

## 🛠️ Tech Stack
- **Frontend:** HTML, Tailwind CSS, JavaScript
- **Backend:** Node.js (Express)
- **Hosting:** GitHub Pages (static) / Local (full stack)

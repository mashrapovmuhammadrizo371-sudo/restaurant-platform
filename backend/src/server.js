require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { requireEnv } = require('./config/validateEnv');
const connectDB = require('./config/db');
const User = require('./models/User');
const { ROLES } = require('./config/roles');
const { initSocket } = require('./services/socketService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const courierRoutes = require('./routes/courierRoutes');
const waiterRoutes = require('./routes/waiterRoutes');
const paymentCardRoutes = require('./routes/paymentCardRoutes');
const adminAiRoutes = require('./routes/adminAiRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Uploaded images (banners, brand logos, food photos) are served statically
// from the same path multer's upload middleware writes to.
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Restaurant platform API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promocodes', promoCodeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/waiters', waiterRoutes);
app.use('/api/payment-card', paymentCardRoutes);
app.use('/api/admin-ai', adminAiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function ensureBossAccount() {
  const login = (process.env.BOSS_LOGIN || 'boss').trim().toLowerCase();
  const password = process.env.BOSS_PASSWORD;
  const name = (process.env.BOSS_NAME || 'Super Admin').trim();

  if (!password) {
    console.warn('[server] BOSS_PASSWORD is not set; Boss account was not created/synced.');
    return;
  }

  const passwordHash = await User.hashPassword(password);
  const boss = await User.findOne({ login }).select('+passwordHash');

  if (!boss) {
    await User.create({
      name,
      login,
      passwordHash,
      role: ROLES.BOSS,
      brands: [],
      permissions: [],
      isActive: true
    });
    console.log('[server] Boss account created from environment variables.');
    return;
  }

  // Environment credentials are the source of truth for the Boss account.
  // This also fixes an account that was created earlier with an unknown password.
  boss.name = name;
  boss.passwordHash = passwordHash;
  boss.role = ROLES.BOSS;
  boss.brands = [];
  boss.permissions = [];
  boss.isActive = true;
  await boss.save();
  console.log('[server] Boss account credentials synced from environment variables.');
}

async function start() {
  // Fail fast and loud if required config (JWT_SECRET, MONGO_URI) is
  // missing, instead of booting "successfully" and crashing confusingly
  // on the first request that actually needs it. See config/validateEnv.js.
  requireEnv();

  await connectDB();

  // Render Free has no interactive Shell, so create/sync the Boss account
  // automatically from the Boss environment variables at startup.
  // This keeps the production login usable without running a separate seed job.
  await ensureBossAccount();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] Restaurant platform API listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

module.exports = app;

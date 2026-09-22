require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { requireEnv } = require('./config/validateEnv');
const connectDB = require('./config/db');
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

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  // Fail fast and loud if required config (JWT_SECRET, MONGO_URI) is
  // missing, instead of booting "successfully" and crashing confusingly
  // on the first request that actually needs it. See config/validateEnv.js.
  requireEnv();

  await connectDB();

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

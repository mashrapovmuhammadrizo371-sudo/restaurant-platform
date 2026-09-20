require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const { ROLES } = require('../config/roles');

// The 6 shared menu categories every brand starts with, per the product spec.
const DEMO_CATEGORY_NAMES = [
  'Burgerlar',
  'Pitsalar',
  'Tovuqlar',
  'Fast food',
  'Ichimliklar',
  'Desertlar'
];

// Placeholder demo data for the 5 brands so the admin panel and customer
// app have something to show immediately after a fresh install. Everything
// here (name, color, menu items) is meant to be edited from the admin panel.
const DEMO_BRANDS = [
  { name: 'Burger House', slug: 'burger-house', mainColor: '#ff5a1f' },
  { name: 'Pizza Point', slug: 'pizza-point', mainColor: '#e63946' },
  { name: 'Tovuq Xit', slug: 'tovuq-xit', mainColor: '#f4a300' },
  { name: 'Fast Corner', slug: 'fast-corner', mainColor: '#2a9d8f' },
  { name: 'Shirin Cafe', slug: 'shirin-cafe', mainColor: '#9c6ade' }
];

async function seedBoss() {
  const login = (process.env.BOSS_LOGIN || 'boss').toLowerCase();
  const password = process.env.BOSS_PASSWORD;
  const name = process.env.BOSS_NAME || 'Super Admin';

  if (!password) {
    console.warn('[seed] BOSS_PASSWORD is not set in .env — skipping Boss account creation.');
    return;
  }

  const existing = await User.findOne({ login });
  if (existing) {
    console.log(`[seed] Boss account "${login}" already exists — skipping.`);
    return;
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({
    name,
    login,
    passwordHash,
    role: ROLES.BOSS,
    brands: [],
    permissions: [],
    isActive: true
  });

  console.log(`[seed] Boss account created. Login: "${login}" — sign in at /staff/login.`);
}

async function seedDemoBrandsAndCategories() {
  const existingCount = await Brand.countDocuments();
  if (existingCount > 0) {
    console.log('[seed] Brands already exist — skipping demo brand/category seed.');
    return;
  }

  for (const brandData of DEMO_BRANDS) {
    const brand = await Brand.create({ ...brandData, isActive: true });
    for (let i = 0; i < DEMO_CATEGORY_NAMES.length; i++) {
      await Category.create({ brand: brand._id, name: DEMO_CATEGORY_NAMES[i], order: i });
    }
    console.log(`[seed] Created demo brand "${brand.name}" with ${DEMO_CATEGORY_NAMES.length} categories.`);
  }
}

async function run() {
  await connectDB();
  await seedBoss();
  await seedDemoBrandsAndCategories();
  await mongoose.disconnect();
  console.log('[seed] Done.');
  process.exit(0);
}

run().catch(err => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

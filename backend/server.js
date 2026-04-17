require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Pool = require('./models/Pool');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { initializeCronJobs } = require('./cron/triggerCron');
const { initializeClaimProcessingCron } = require('./cron/claimProcessingCron');

// Import routes
const authRoutes = require('./routes/auth');
const policyRoutes = require('./routes/policy');
const claimsRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const weatherRoutes = require('./routes/weather');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  GigShield AI Backend Started         ║`);
  console.log(`║  Port: ${PORT}                              ║`);
  console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}            ║`);
  console.log(`╚════════════════════════════════════════╝\n`);

  // Initialize cron jobs and Pool
  try {
    // Initialize pool if none exists
    Pool.findOne().then(async (pool) => {
      if (!pool) {
        await Pool.create({});
        console.log('[Pool] Central Insurance Pool initialized.');
      }
    });

    // Initialize default admin user if none exists
    User.findOne({ role: 'admin' }).then(async (adminExists) => {
      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await User.create({
          phone: '0000000000',
          password: hashedPassword,
          role: 'admin',
          city: 'Delhi',
          avgWeeklyIncome: 0,
          walletBalance: 0
        });
        console.log('[Admin] Default admin user created (Phone: 0000000000)');
      }
    });

    initializeCronJobs();           // Trigger monitoring every 10 minutes
    initializeClaimProcessingCron(); // Claim processing every 5 minutes
    console.log('\n✓ Cron jobs initialized\n');
  } catch (error) {
    console.error('Error initializing startup tasks:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

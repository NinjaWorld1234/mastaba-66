require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { initDatabase, db } = require('./server/database.cjs');

// Configuration
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.warn('WARNING: SECRET_KEY environment variable is not set! Authentication will fail.');
}

// Initialize Database
initDatabase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));

// Request Logger (Helpful for Hostinger Debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Authentication Middleware (Exposed for central router index if needed)
const { authenticateToken } = require('./server/middleware.cjs');


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        db: db ? 'Initialised' : 'Not Initialised'
    });
});

// Manual DB Fix Route (Detailed password reset)
app.get('/api/fix-db', (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        let fixed = [];

        // Ahmed
        const ahmed = db.data.users.find(u => u.email === 'ahmed@example.com');
        if (ahmed) {
            ahmed.password = bcrypt.hashSync('123456', 10);
            fixed.push('Ahmed');
        } else {
            fixed.push('Ahmed (Created)');
            db.data.users.push({
                id: "1",
                name: "أحمد محمد",
                email: "ahmed@example.com",
                password: bcrypt.hashSync('123456', 10),
                role: "student",
                joinDate: new Date().toISOString(),
                emailVerified: 1
            });
        }

        // Admin
        const admin = db.data.users.find(u => u.email === 'admin@example.com');
        if (admin) {
            admin.password = bcrypt.hashSync('admin123', 10);
            fixed.push('Admin');
        } else {
            fixed.push('Admin (Created)');
            db.data.users.push({
                id: "2",
                name: "مدير النظام",
                email: "admin@example.com",
                password: bcrypt.hashSync('admin123', 10),
                role: "admin",
                joinDate: new Date().toISOString()
            });
        }

        db.save();
        res.json({ success: true, fixed, message: 'Database default users refreshed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Centralized API Routes
const apiRoutes = require('./server/routes/index.cjs');

// Mount API Routes with global prefix
// Note: Individual modules handle their sub-paths
app.use('/api', (req, res, next) => {
    // Inject authenticateToken where needed or handle it globally for some paths
    // For now, we mount the central router
    next();
}, apiRoutes);

// Static assets
app.use(express.static(path.join(__dirname, 'dist')));

// API 404 Handler - MUST BE AFTER apiRoutes but BEFORE SPA fallback
// API 404 Handler - MUST BE AFTER apiRoutes but BEFORE SPA fallback
// API 404 Handler - MUST BE AFTER apiRoutes but BEFORE SPA fallback
app.use('/api', (req, res) => {
    res.status(404).json({
        error: `API endpoint ${req.method} ${req.path} not found`,
        code: 'API_NOT_FOUND'
    });
});

// SPA Fallback - MUST BE LAST
app.get(/.*/, (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Production build not found. Please run "npm run build" first.');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Database: JSON File (Compatibility Mode)`);
    console.log(`- Base URL: http://localhost:${PORT}`);
    console.log(`- API Routes: Multi-modular Index`);
});

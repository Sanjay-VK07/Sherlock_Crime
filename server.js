
process.on("uncaughtException", (err) => { console.error("UNCAUGHT EXCEPTION:", err); });
process.on("unhandledRejection", (reason) => { console.error("UNHANDLED REJECTION:", reason); });
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './backend/routes/auth.js';
import recordRoutes from './backend/routes/records.js';
import copilotRoutes from './backend/routes/copilot.js';
import workspaceRoutes from './backend/routes/workspace.js';
import evidenceRoutes from './backend/routes/evidence.js';
import mapRoutes from './backend/routes/map.js';
import chatRoutes from './backend/routes/chat.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000;

// CORS setup
app.use(cors({
  origin: '*', // Allow all for demo purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Logger Middleware (Simple Audit Trail logging)
app.use((req, res, next) => {
  console.log(`[AUDIT LOG] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Wildcard route to send index.html for frontend SPA routing
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`   KSP SHERLOCK BACKEND ACTIVE ON PORT ${PORT} `);
  console.log(`========================================`);
});

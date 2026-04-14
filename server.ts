import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Setup Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini (Removed as per skill guidelines - moving to frontend)

// Mock Database (In-memory for prototype)
let pendingRequests: any[] = [];
const mockRPS = {
  C001: { name: 'Priya Sharma', address: '123 Main St', dob: '1990-01-01', email: 'priya@example.com' }
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 1. File Upload only
app.post('/api/upload', upload.single('document'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// 2. Intake (Staging already processed data)
app.post('/api/intake', (req, res) => {
  const { customerId, changeType, newValue, aiResult, documentUrl } = req.body;

  const rpsRecord = mockRPS[customerId as keyof typeof mockRPS];
  const oldValue = rpsRecord ? rpsRecord.name : 'Unknown';

  const newRequest = {
    id: Math.random().toString(36).substr(2, 9),
    customerId,
    changeType,
    oldValue,
    newValue,
    status: 'AI_VERIFIED_PENDING_HUMAN',
    confidenceScore: aiResult.scores.nameMatch,
    aiSummary: aiResult.summary,
    extractedData: aiResult.extractedData,
    scores: aiResult.scores,
    recommendation: aiResult.recommendation,
    documentUrl,
    createdAt: new Date().toISOString()
  };

  pendingRequests.push(newRequest);
  res.json(newRequest);
});

// 2. Checker Review
app.get('/api/pending', (req, res) => {
  res.json(pendingRequests.filter(r => r.status === 'AI_VERIFIED_PENDING_HUMAN'));
});

// 3. Human Approval (HITL Boundary)
app.post('/api/approve/:id', (req, res) => {
  const request = pendingRequests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Mock RPS Write-Call
  console.log(`[RPS WRITE] Updating Customer ${request.customerId}: ${request.oldValue} -> ${request.newValue}`);
  
  request.status = 'APPROVED';
  request.checkerDecision = 'APPROVED';
  request.approvedAt = new Date().toISOString();

  res.json({ success: true, message: 'RPS updated successfully' });
});

app.post('/api/reject/:id', (req, res) => {
  const request = pendingRequests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  request.status = 'REJECTED';
  request.checkerDecision = 'REJECTED';
  request.rejectedAt = new Date().toISOString();

  res.json({ success: true, message: 'Request rejected' });
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

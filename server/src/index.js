import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { query } from './db.js';
import admin from './routes/admin.js';
import publicRouter from './routes/public.js';
import { Readable } from 'node:stream';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; 
const ALLOWED_ORIGINS = [
  CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');

  const origin = req.headers.origin;
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      const allowed =
        ALLOWED_ORIGINS.includes(origin) ||
        host.endsWith('.netlify.app');

      if (allowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      }
    } catch {
    }
  }
  next();
});

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); 
    try {
      const host = new URL(origin).hostname;
      if (ALLOWED_ORIGINS.includes(origin) || host.endsWith('.netlify.app')) {
        return cb(null, true);
      }
    } catch {}
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  try {
    const r = await query('SELECT NOW()');
    res.json({ ok: true, dbTime: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/admin', admin);
app.use('/api/public', publicRouter);

app.get('/api/proxy', async (req, res) => {
  try {
    const u = req.query.u;
    if (!u) return res.status(400).send('missing u');

    const url = new URL(u);
    if (url.hostname !== 'res.cloudinary.com') {
      return res.status(400).send('host not allowed');
    }

    const upstream = await fetch(url.toString());
    if (!upstream.ok) {
      return res.status(upstream.status).send('upstream error');
    }

    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const cd = upstream.headers.get('content-disposition');
    if (cd) res.setHeader('Content-Disposition', cd);
    const cl = upstream.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.pipe(res);
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    }
  } catch (e) {
    console.error('proxy error', e);
    res.status(500).send('proxy error');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on :${PORT}`));

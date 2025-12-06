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

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);

    const isClient = CLIENT_ORIGIN && origin === CLIENT_ORIGIN;

    if (isLocalhost || isClient) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}));

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

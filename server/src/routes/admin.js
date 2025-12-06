// routes/admin.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import adminGuard from '../middleware/adminGuard.js';

const r = Router();

const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_TOKEN_SECRET = 'change_me_please',
  NODE_ENV,
} = process.env;

/* ========== Public (no guard) ========== */
r.get('/ping-open', (_req, res) => res.json({ ok: true }));

r.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const ok =
    email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase() &&
    password === ADMIN_PASSWORD;
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin', email }, ADMIN_TOKEN_SECRET, { expiresIn: '12h' });
 const isProd = process.env.NODE_ENV === 'production';

res.cookie('admin_token', token, {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',   
  secure: isProd,                   
  maxAge: 12 * 60 * 60 * 1000,      
  path: '/',
});
  res.json({ ok: true });
});

r.get('/me', (req, res) => {
  try {
    const token = req.cookies?.admin_token;
    if (!token) return res.status(200).json({ ok: false });
    const payload = jwt.verify(token, ADMIN_TOKEN_SECRET);
    return res.json({ ok: true, email: payload.email });
  } catch {
    return res.status(200).json({ ok: false });
  }
});

r.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ ok: true });
});

/* ========== Guarded ========== */
r.use(adminGuard);

/* ---------- Levels ---------- */
r.get('/levels', async (_req, res) => {
  const { rows } = await query('SELECT * FROM levels ORDER BY order_index, id');
  res.json(rows);
});
r.post('/levels', async (req, res) => {
  const { name, slug, order_index = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    'INSERT INTO levels (name, slug, order_index) VALUES ($1,$2,$3) RETURNING *',
    [name, slug || null, order_index]
  );
  res.status(201).json(rows[0]);
});
r.put('/levels/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug, order_index } = req.body || {};
  const { rows } = await query(
    'UPDATE levels SET name=COALESCE($1,name), slug=COALESCE($2,slug), order_index=COALESCE($3,order_index) WHERE id=$4 RETURNING *',
    [name ?? null, slug ?? null, order_index ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});
r.delete('/levels/:id', async (req, res) => {
  await query('DELETE FROM levels WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Stages ---------- */
r.get('/stages', async (req, res) => {
  const { level_id } = req.query;
  const params = [];
  let sql = 'SELECT * FROM stages';
  if (level_id) { sql += ' WHERE level_id=$1'; params.push(level_id); }
  sql += ' ORDER BY order_index, id';
  const { rows } = await query(sql, params);
  res.json(rows);
});
r.post('/stages', async (req, res) => {
  const { level_id, name, slug, order_index = 0 } = req.body || {};
  if (!level_id || !name) return res.status(400).json({ error: 'level_id, name required' });
  const { rows } = await query(
    'INSERT INTO stages (level_id, name, slug, order_index) VALUES ($1,$2,$3,$4) RETURNING *',
    [level_id, name, slug || null, order_index]
  );
  res.status(201).json(rows[0]);
});
r.put('/stages/:id', async (req, res) => {
  const { id } = req.params;
  const { level_id, name, slug, order_index } = req.body || {};
  const { rows } = await query(
    'UPDATE stages SET level_id=COALESCE($1,level_id), name=COALESCE($2,name), slug=COALESCE($3,slug), order_index=COALESCE($4,order_index) WHERE id=$5 RETURNING *',
    [level_id ?? null, name ?? null, slug ?? null, order_index ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});
r.delete('/stages/:id', async (req, res) => {
  await query('DELETE FROM stages WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Sciences ---------- */
r.get('/sciences', async (_req, res) => {
  const { rows } = await query('SELECT * FROM sciences ORDER BY name');
  res.json(rows);
});
r.post('/sciences', async (req, res) => {
  const { name, slug } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    'INSERT INTO sciences (name, slug) VALUES ($1,$2) RETURNING *',
    [name, slug || null]
  );
  res.status(201).json(rows[0]);
});
r.put('/sciences/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body || {};
  const { rows } = await query(
    'UPDATE sciences SET name=COALESCE($1,name), slug=COALESCE($2,slug) WHERE id=$3 RETURNING *',
    [name ?? null, slug ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});
r.delete('/sciences/:id', async (req, res) => {
  await query('DELETE FROM sciences WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Subjects + bridge science_subject ---------- */
r.get('/subjects', async (req, res) => {
  const { science_id } = req.query;
  let sql = `SELECT s.* FROM subjects s`;
  const params = [];
  if (science_id) {
    sql += ` WHERE EXISTS (SELECT 1 FROM science_subject ss WHERE ss.subject_id=s.id AND ss.science_id=$1)`;
    params.push(science_id);
  }
  sql += ' ORDER BY name';
  const { rows } = await query(sql, params);
  res.json(rows);
});
r.post('/subjects', async (req, res) => {
  const { name, slug, description, science_ids = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    'INSERT INTO subjects (name, slug, description) VALUES ($1,$2,$3) RETURNING *',
    [name, slug || null, description || null]
  );
  const subject = rows[0];
  if (Array.isArray(science_ids) && science_ids.length) {
    for (const sid of science_ids) {
      await query('INSERT INTO science_subject (science_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [sid, subject.id]);
    }
  }
  res.status(201).json(subject);
});
r.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, science_ids } = req.body || {};
  const { rows } = await query(
    'UPDATE subjects SET name=COALESCE($1,name), slug=COALESCE($2,slug), description=COALESCE($3,description) WHERE id=$4 RETURNING *',
    [name ?? null, slug ?? null, description ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const subject = rows[0];
  if (Array.isArray(science_ids)) {
    await query('DELETE FROM science_subject WHERE subject_id=$1', [id]);
    for (const sid of science_ids) {
      await query('INSERT INTO science_subject (science_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [sid, id]);
    }
  }
  res.json(subject);
});
r.delete('/subjects/:id', async (req, res) => {
  await query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Materials (with material_science & material_stage) ---------- */
function isBadExternal(u = '') {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') return true;
  } catch { return true; }
  if (u.startsWith('blob:') || u.startsWith('file:') || u.includes('localhost')) return true;
  return false;
}

r.get('/materials', async (req, res) => {
  const { subject_id, science_id, stage_id, q } = req.query;
  const where = [];
  const params = [];
  let i = 1;

  if (q) { where.push(`(m.title ILIKE $${i} OR m.description ILIKE $${i})`); params.push(`%${q}%`); i++; }
  if (subject_id) { where.push(`m.subject_id = $${i}`); params.push(subject_id); i++; }
  if (science_id) { where.push(`EXISTS (SELECT 1 FROM material_science ms WHERE ms.material_id=m.id AND ms.science_id=$${i})`); params.push(science_id); i++; }
  if (stage_id) { where.push(`EXISTS (SELECT 1 FROM material_stage mt WHERE mt.material_id=m.id AND mt.stage_id=$${i})`); params.push(stage_id); i++; }

  const sql = `SELECT m.* FROM materials m ${where.length?`WHERE ${where.join(' AND ')}`:''} ORDER BY m.created_at DESC LIMIT 500`;
  const { rows } = await query(sql, params);
  res.json(rows);
});
r.post('/materials', async (req, res) => {
  const { subject_id, title, kind='COURSE', description, cover_url, provider, playlist_url, science_ids=[], stage_ids=[] } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  if (cover_url && isBadExternal(cover_url)) return res.status(400).json({ error: 'invalid cover_url' });
  if (playlist_url && isBadExternal(playlist_url)) return res.status(400).json({ error: 'invalid playlist_url' });

  const { rows } = await query(
    'INSERT INTO materials (subject_id,title,kind,description,cover_url,provider,playlist_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [subject_id || null, title, kind, description || null, cover_url || null, provider || null, playlist_url || null]
  );
  const m = rows[0];
  for (const sid of science_ids) await query('INSERT INTO material_science (material_id, science_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [m.id, sid]);
  for (const st of stage_ids) await query('INSERT INTO material_stage (material_id, stage_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [m.id, st]);
  res.status(201).json(m);
});
r.put('/materials/:id', async (req, res) => {
  const { id } = req.params;
  const { subject_id, title, kind, description, cover_url, provider, playlist_url, science_ids, stage_ids } = req.body || {};
  if (cover_url && isBadExternal(cover_url)) return res.status(400).json({ error: 'invalid cover_url' });
  if (playlist_url && isBadExternal(playlist_url)) return res.status(400).json({ error: 'invalid playlist_url' });

  const { rows } = await query(
    'UPDATE materials SET subject_id=COALESCE($1,subject_id), title=COALESCE($2,title), kind=COALESCE($3,kind), description=COALESCE($4,description), cover_url=COALESCE($5,cover_url), provider=COALESCE($6,provider), playlist_url=COALESCE($7,playlist_url) WHERE id=$8 RETURNING *',
    [subject_id ?? null, title ?? null, kind ?? null, description ?? null, cover_url ?? null, provider ?? null, playlist_url ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const m = rows[0];

  if (Array.isArray(science_ids)) {
    await query('DELETE FROM material_science WHERE material_id=$1', [id]);
    for (const sid of science_ids) await query('INSERT INTO material_science (material_id, science_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, sid]);
  }
  if (Array.isArray(stage_ids)) {
    await query('DELETE FROM material_stage WHERE material_id=$1', [id]);
    for (const st of stage_ids) await query('INSERT INTO material_stage (material_id, stage_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, st]);
  }
  res.json(m);
});
r.delete('/materials/:id', async (req, res) => {
  await query('DELETE FROM materials WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Units ---------- */
r.get('/units', async (req, res) => {
  const { material_id } = req.query;
  if (!material_id) return res.status(400).json({ error: 'material_id required' });
  const { rows } = await query('SELECT * FROM units WHERE material_id=$1 ORDER BY order_index, id', [material_id]);
  res.json(rows);
});
r.post('/units', async (req, res) => {
  const { material_id, title, order_index=0, external_id, duration_seconds } = req.body || {};
  if (!material_id || !title) return res.status(400).json({ error: 'material_id, title required' });
  const { rows } = await query(
    'INSERT INTO units (material_id,title,order_index,external_id,duration_seconds) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [material_id, title, order_index, external_id || null, duration_seconds || null]
  );
  res.status(201).json(rows[0]);
});
r.put('/units/:id', async (req, res) => {
  const { id } = req.params;
  const { title, order_index, external_id, duration_seconds } = req.body || {};
  const { rows } = await query(
    'UPDATE units SET title=COALESCE($1,title), order_index=COALESCE($2,order_index), external_id=COALESCE($3,external_id), duration_seconds=COALESCE($4,duration_seconds) WHERE id=$5 RETURNING *',
    [title ?? null, order_index ?? null, external_id ?? null, duration_seconds ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});
r.delete('/units/:id', async (req, res) => {
  await query('DELETE FROM units WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// إعادة ترتيب order_index للوحدات دفعة واحدة
r.post('/units/reorder', async (req, res) => {
  const { material_id, ordered_ids } = req.body || {};
  if (!material_id || !Array.isArray(ordered_ids)) {
    return res.status(400).json({ error: 'material_id, ordered_ids[] required' });
  }
  await query('BEGIN');
  try {
    for (let idx = 0; idx < ordered_ids.length; idx++) {
      await query('UPDATE units SET order_index=$1 WHERE id=$2 AND material_id=$3', [idx + 1, ordered_ids[idx], material_id]);
    }
    await query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await query('ROLLBACK');
    res.status(500).json({ error: 'reorder failed' });
  }
});


/* ---------- Tags ---------- */
r.get('/tags', async (_req, res) => {
  const { rows } = await query('SELECT * FROM tags ORDER BY name');
  res.json(rows);
});
r.post('/tags', async (req, res) => {
  const { name, slug } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    'INSERT INTO tags (name, slug) VALUES ($1,$2) ON CONFLICT (name) DO NOTHING RETURNING *',
    [name, slug || null]
  );
  res.status(201).json(rows[0] || { name, note: 'existed' });
});
r.delete('/tags/:id', async (req, res) => {
  await query('DELETE FROM tags WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Resources (scoped to material OR unit) ---------- */
const RESOURCE_TYPES = ['ORIGINAL','SUMMARY','TRANSCRIPT','NOTES','EXERCISES','SOLUTION','SLIDES','IMAGE','OTHER'];

// داخل routes/admin.js (استبدل get /resources الحالي)
r.get('/resources', async (req, res) => {
  const { q, material_id, unit_id, type, tag } = req.query;
  const page  = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let i = 1;

  if (q) { where.push(`(r.title ILIKE $${i} OR r.description ILIKE $${i})`); params.push(`%${q}%`); i++; }
  if (material_id) { where.push(`r.material_id=$${i}`); params.push(material_id); i++; }
  if (unit_id) { where.push(`r.unit_id=$${i}`); params.push(unit_id); i++; }
  if (type) { where.push(`r.type=$${i}`); params.push(type); i++; }
  if (tag) {
    where.push(`EXISTS (SELECT 1 FROM resource_tag rt JOIN tags t ON t.id=rt.tag_id WHERE rt.resource_id=r.id AND t.name=$${i})`);
    params.push(tag); i++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rowsQ = await query(
    `SELECT r.* FROM resources r ${whereSql} ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const cntQ = await query(`SELECT COUNT(*)::int AS total FROM resources r ${whereSql}`, params);

  res.json({ rows: rowsQ.rows, page, limit, total: cntQ.rows[0].total });
});

r.post('/resources', async (req, res) => {
  const {
    title, description, type='OTHER', mime, mime_group,
    file_url, external_url, size_bytes, pages_count, language, notes,
    material_id, unit_id, tags=[]
  } = req.body || {};

  if (!title) return res.status(400).json({ error: 'title required' });
  if (!material_id && !unit_id) return res.status(400).json({ error: 'material_id or unit_id required' });
  if (external_url && isBadExternal(external_url)) return res.status(400).json({ error: 'invalid external_url' });
  if (!RESOURCE_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });

  const { rows } = await query(
    `INSERT INTO resources (material_id, unit_id, type, title, description, mime, mime_group, file_url, external_url, size_bytes, pages_count, language, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [material_id || null, unit_id || null, type, title, description || null, mime || null, mime_group || null,
      file_url || null, external_url || null, size_bytes || null, pages_count || null, language || null, notes || null]
  );
  const rsc = rows[0];

  if (Array.isArray(tags) && tags.length) {
    for (const t of tags) {
      const trow = await query('INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [t]);
      await query('INSERT INTO resource_tag (resource_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rsc.id, trow.rows[0].id]);
    }
  }
  res.status(201).json(rsc);
});
r.put('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title, description, type, mime, mime_group,
    file_url, external_url, size_bytes, pages_count, language, notes,
    material_id, unit_id, tags
  } = req.body || {};
  if (external_url && isBadExternal(external_url)) return res.status(400).json({ error: 'invalid external_url' });
  if (type && !RESOURCE_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });

  const { rows } = await query(
    `UPDATE resources SET
      material_id=COALESCE($1,material_id), unit_id=COALESCE($2,unit_id), type=COALESCE($3,type),
      title=COALESCE($4,title), description=COALESCE($5,description), mime=COALESCE($6,mime),
      mime_group=COALESCE($7,mime_group), file_url=COALESCE($8,file_url),
      external_url=COALESCE($9,external_url), size_bytes=COALESCE($10,size_bytes),
      pages_count=COALESCE($11,pages_count), language=COALESCE($12,language), notes=COALESCE($13,notes)
     WHERE id=$14 RETURNING *`,
    [material_id ?? null, unit_id ?? null, type ?? null, title ?? null, description ?? null, mime ?? null, mime_group ?? null,
      file_url ?? null, external_url ?? null, size_bytes ?? null, pages_count ?? null, language ?? null, notes ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const rsc = rows[0];

  if (Array.isArray(tags)) {
    await query('DELETE FROM resource_tag WHERE resource_id=$1', [id]);
    for (const t of tags) {
      const trow = await query('INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [t]);
      await query('INSERT INTO resource_tag (resource_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, trow.rows[0].id]);
    }
  }
  res.json(rsc);
});
r.delete('/resources/:id', async (req, res) => {
  await query('DELETE FROM resources WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Filters for pickers ---------- */
r.get('/_filters', async (_req, res) => {
  const [levels, stages, sciences, subjects, tags] = await Promise.all([
    query('SELECT id, name FROM levels ORDER BY order_index, id'),
    query('SELECT id, name, level_id FROM stages ORDER BY order_index, id'),
    query('SELECT id, name FROM sciences ORDER BY name'),
    query('SELECT id, name FROM subjects ORDER BY name'),
    query('SELECT id, name FROM tags ORDER BY name'),
  ]);
  res.json({
    levels: levels.rows,
    stages: stages.rows,
    sciences: sciences.rows,
    subjects: subjects.rows,
    tags: tags.rows.map(x => x.name),
  });
});

export default r;



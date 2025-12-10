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


r.get('/ping-open', (_req, res) => res.json({ ok: true }));

r.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const ok =
    email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase() &&
    password === ADMIN_PASSWORD;
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin', email }, ADMIN_TOKEN_SECRET, { expiresIn: '12h' });
  const isProd = NODE_ENV === 'production';

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


r.use(adminGuard);


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


r.get('/stages', async (req, res) => {
  const { level_id } = req.query;
  const params = [];
  let sql = 'SELECT * FROM stages';
  if (level_id) {
    sql += ' WHERE level_id=$1';
    params.push(level_id);
  }
  sql += ' ORDER BY order_index, id';
  const { rows } = await query(sql, params);
  res.json(rows);
});

r.post('/stages', async (req, res) => {
  const { level_id, name, slug, order_index = 0 } = req.body || {};
  if (!level_id || !name) {
    return res.status(400).json({ error: 'level_id, name required' });
  }
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


r.get('/subjects', async (req, res) => {
  const { science_id, level_id, stage_id } = req.query;
  const params = [];
  const where = [];
  let i = 1;

  if (level_id) {
    where.push(`s.level_id=$${i++}`);
    params.push(level_id);
  }
  if (stage_id) {
    where.push(`s.stage_id=$${i++}`);
    params.push(stage_id);
  }
  if (science_id) {
    where.push(`EXISTS (SELECT 1 FROM science_subject ss WHERE ss.subject_id=s.id AND ss.science_id=$${i})`);
    params.push(science_id);
    i++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT s.* FROM subjects s ${whereSql} ORDER BY s.name`;
  const { rows } = await query(sql, params);
  res.json(rows);
});

r.post('/subjects', async (req, res) => {
  const {
    name,
    slug,
    description,
    level_id,
    stage_id,
    science_ids = [],
  } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const { rows } = await query(
    'INSERT INTO subjects (name, slug, description, level_id, stage_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, slug || null, description || null, level_id || null, stage_id || null]
  );
  const subject = rows[0];

  if (Array.isArray(science_ids) && science_ids.length) {
    for (const sid of science_ids) {
      await query(
        'INSERT INTO science_subject (science_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [sid, subject.id]
      );
    }
  }
  res.status(201).json(subject);
});

r.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    level_id,
    stage_id,
    science_ids,
  } = req.body || {};

  const { rows } = await query(
    `UPDATE subjects SET
      name=COALESCE($1,name),
      slug=COALESCE($2,slug),
      description=COALESCE($3,description),
      level_id=COALESCE($4,level_id),
      stage_id=COALESCE($5,stage_id)
     WHERE id=$6 RETURNING *`,
    [name ?? null, slug ?? null, description ?? null, level_id ?? null, stage_id ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const subject = rows[0];

  if (Array.isArray(science_ids)) {
    await query('DELETE FROM science_subject WHERE subject_id=$1', [id]);
    for (const sid of science_ids) {
      await query(
        'INSERT INTO science_subject (science_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [sid, id]
      );
    }
  }
  res.json(subject);
});

r.delete('/subjects/:id', async (req, res) => {
  await query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});


r.get('/units', async (req, res) => {
  const { subject_id } = req.query;
  if (!subject_id) return res.status(400).json({ error: 'subject_id required' });
  const { rows } = await query(
    'SELECT * FROM units WHERE subject_id=$1 ORDER BY order_index, id',
    [subject_id]
  );
  res.json(rows);
});

r.post('/units', async (req, res) => {
  const { subject_id, title, order_index = 0 } = req.body || {};
  if (!subject_id || !title) {
    return res.status(400).json({ error: 'subject_id, title required' });
  }
  const { rows } = await query(
    `INSERT INTO units (subject_id,title,order_index)
     VALUES ($1,$2,$3) RETURNING *`,
    [subject_id, title, order_index]
  );
  res.status(201).json(rows[0]);
});

r.put('/units/:id', async (req, res) => {
  const { id } = req.params;
  const { title, order_index } = req.body || {};
  const { rows } = await query(
    `UPDATE units SET
       title=COALESCE($1,title),
       order_index=COALESCE($2,order_index)
     WHERE id=$3 RETURNING *`,
    [title ?? null, order_index ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

r.delete('/units/:id', async (req, res) => {
  await query('DELETE FROM units WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

r.post('/units/reorder', async (req, res) => {
  const { subject_id, ordered_ids } = req.body || {};
  if (!subject_id || !Array.isArray(ordered_ids)) {
    return res.status(400).json({ error: 'subject_id, ordered_ids[] required' });
  }
  await query('BEGIN');
  try {
    for (let idx = 0; idx < ordered_ids.length; idx++) {
      await query(
        'UPDATE units SET order_index=$1 WHERE id=$2 AND subject_id=$3',
        [idx + 1, ordered_ids[idx], subject_id]
      );
    }
    await query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await query('ROLLBACK');
    res.status(500).json({ error: 'reorder failed' });
  }
});


r.get('/tags', async (_req, res) => {
  const { rows } = await query('SELECT id, name FROM tags ORDER BY name');
  res.json(rows);
});

r.post('/tags', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await query(
    'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
    [name]
  );
  res.status(201).json(rows[0] || { name, note: 'existed' });
});

r.delete('/tags/:id', async (req, res) => {
  await query('DELETE FROM tags WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});


const RESOURCE_TYPES = [
  'ORIGINAL',
  'SUMMARY',
  'TRANSCRIPT',
  'TABLE',
  'TREE',
  'COURSE_LINK',
  'AUDIO',
  'SLIDES',
  'IMAGE',
  'EXERCISES',
  'SOLUTION',
  'NOTES',
  'OTHER',
];

function isBadExternal(u = '') {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') return true;
  } catch {
    return true;
  }
  if (u.startsWith('blob:') || u.startsWith('file:') || u.includes('localhost')) return true;
  return false;
}

r.get('/resources', async (req, res) => {
  const { q, subject_id, unit_id, type, tag } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let i = 1;

  if (q) {
    where.push(`(r.title ILIKE $${i} OR r.description ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }
  if (subject_id) {
    where.push(`r.subject_id=$${i}`);
    params.push(subject_id);
    i++;
  }
  if (unit_id) {
    where.push(`r.unit_id=$${i}`);
    params.push(unit_id);
    i++;
  }
  if (type) {
    where.push(`r.type=$${i}`);
    params.push(type);
    i++;
  }
  if (tag) {
    where.push(
      `EXISTS (
        SELECT 1
        FROM resource_tags rt
        JOIN tags t ON t.id = rt.tag_id
        WHERE rt.resource_id = r.id AND t.name = $${i}
      )`
    );
    params.push(tag);
    i++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rowsQ = await query(
    `SELECT r.*
     FROM resources r
     ${whereSql}
     ORDER BY r.created_at DESC NULLS LAST, r.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const cntQ = await query(
    `SELECT COUNT(*)::int AS total FROM resources r ${whereSql}`,
    params
  );

  res.json({ rows: rowsQ.rows, page, limit, total: cntQ.rows[0].total });
});

r.post('/resources', async (req, res) => {
  const {
    title,
    description,
    type = 'OTHER',
    mime,
    mime_group,
    file_url,
    external_url,
    size_bytes,
    pages_count,
    language,
    notes,
    subject_id,
    unit_id,
    tags = [],
  } = req.body || {};

  if (!title) return res.status(400).json({ error: 'title required' });
  if (!subject_id && !unit_id) {
    return res.status(400).json({ error: 'subject_id or unit_id required' });
  }
  if (external_url && isBadExternal(external_url)) {
    return res.status(400).json({ error: 'invalid external_url' });
  }
  if (!RESOURCE_TYPES.includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }

  const { rows } = await query(
    `INSERT INTO resources (
       subject_id, unit_id, type, title, description, mime, mime_group,
       file_url, external_url, size_bytes, pages_count, language, notes
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      subject_id || null,
      unit_id || null,
      type,
      title,
      description || null,
      mime || null,
      mime_group || null,
      file_url || null,
      external_url || null,
      size_bytes || null,
      pages_count || null,
      language || null,
      notes || null,
    ]
  );
  const rsc = rows[0];

  if (Array.isArray(tags) && tags.length) {
    for (const t of tags) {
      const trow = await query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
        [t]
      );
      await query(
        'INSERT INTO resource_tags (resource_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [rsc.id, trow.rows[0].id]
      );
    }
  }
  res.status(201).json(rsc);
});

r.put('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    mime,
    mime_group,
    file_url,
    external_url,
    size_bytes,
    pages_count,
    language,
    notes,
    subject_id,
    unit_id,
    tags,
  } = req.body || {};

  if (external_url && isBadExternal(external_url)) {
    return res.status(400).json({ error: 'invalid external_url' });
  }
  if (type && !RESOURCE_TYPES.includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }

  const { rows } = await query(
    `UPDATE resources SET
       subject_id=COALESCE($1,subject_id),
       unit_id=COALESCE($2,unit_id),
       type=COALESCE($3,type),
       title=COALESCE($4,title),
       description=COALESCE($5,description),
       mime=COALESCE($6,mime),
       mime_group=COALESCE($7,mime_group),
       file_url=COALESCE($8,file_url),
       external_url=COALESCE($9,external_url),
       size_bytes=COALESCE($10,size_bytes),
       pages_count=COALESCE($11,pages_count),
       language=COALESCE($12,language),
       notes=COALESCE($13,notes)
     WHERE id=$14
     RETURNING *`,
    [
      subject_id ?? null,
      unit_id ?? null,
      type ?? null,
      title ?? null,
      description ?? null,
      mime ?? null,
      mime_group ?? null,
      file_url ?? null,
      external_url ?? null,
      size_bytes ?? null,
      pages_count ?? null,
      language ?? null,
      notes ?? null,
      id,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const rsc = rows[0];

  if (Array.isArray(tags)) {
    await query('DELETE FROM resource_tags WHERE resource_id=$1', [id]);
    for (const t of tags) {
      const trow = await query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
        [t]
      );
      await query(
        'INSERT INTO resource_tags (resource_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, trow.rows[0].id]
      );
    }
  }
  res.json(rsc);
});

r.delete('/resources/:id', async (req, res) => {
  await query('DELETE FROM resources WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});


r.get('/_filters', async (_req, res) => {
  const [levels, stages, sciences, subjects, tags] = await Promise.all([
    query('SELECT id, name, order_index FROM levels ORDER BY order_index, id'),
    query('SELECT id, name, level_id, order_index FROM stages ORDER BY order_index, id'),
    query('SELECT id, name FROM sciences ORDER BY name'),
    query(`
      SELECT
        s.id,
        s.name,
        s.level_id,
        s.stage_id,
        COALESCE((
          SELECT array_agg(ss.science_id ORDER BY ss.science_id)
          FROM science_subject ss
          WHERE ss.subject_id = s.id
        ), '{}'::int[]) AS science_ids
      FROM subjects s
      ORDER BY s.name
    `),
    query('SELECT id, name FROM tags ORDER BY name'),
  ]);

  res.json({
    levels: levels.rows,
    stages: stages.rows,
    sciences: sciences.rows,
    subjects: subjects.rows,
    tags: tags.rows.map((x) => x.name),
  });
});

export default r;



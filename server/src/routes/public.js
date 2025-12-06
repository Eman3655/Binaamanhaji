// server/src/routes/public.js
// واجهات عامة للتصفّح (لا تحتاج adminGuard)

import { Router } from 'express';
import { query } from '../db.js';

const r = Router();

/* ------------------------------------------------------------------
   0) أنواع الموارد (لو احتجتها في الواجهة)
   ------------------------------------------------------------------ */
r.get('/kinds', (_req, res) => {
  res.json([
    'ORIGINAL',
    'SUMMARY',
    'TRANSCRIPT',
    'NOTES',
    'EXERCISES',
    'SOLUTION',
    'SLIDES',
    'IMAGE',
    'OTHER',
  ]);
});

/* ------------------------------------------------------------------
   1) الفلاتر العامة: مستويات / مراحل / علوم / مقررات
   GET /api/public/filters
   ------------------------------------------------------------------ */

r.get('/filters', async (_req, res) => {
  try {
    const [levels, stages, sciences, subjects] = await Promise.all([
      // levels
      query(
        'SELECT id, name, order_index FROM levels ORDER BY order_index, id'
      ),
      // stages
      query(
        'SELECT id, name, level_id, order_index FROM stages ORDER BY order_index, id'
      ),
      // sciences
      query('SELECT id, name FROM sciences ORDER BY name'),
      // subjects + العلوم المرتبطة بكل مقرر (science_ids[])
      query(`
        SELECT
          s.id,
          s.name,
          COALESCE(
            ARRAY_AGG(ss.science_id) FILTER (WHERE ss.science_id IS NOT NULL),
            '{}'
          ) AS science_ids
        FROM subjects s
        LEFT JOIN science_subject ss ON ss.subject_id = s.id
        GROUP BY s.id, s.name
        ORDER BY s.name
      `),
    ]);

    res.json({
      levels: levels.rows,
      stages: stages.rows,
      sciences: sciences.rows,
      subjects: subjects.rows,
    });
  } catch (e) {
    console.error('public /filters error', e);
    res.status(500).json({ error: 'failed to load filters' });
  }
});

/* ------------------------------------------------------------------
   2) قائمة المواد (Courses / Materials) بحسب أي مجموعة فلاتر
   GET /api/public/materials
   يدعم:
     level_id
     stage_id
     science_id
     subject_id
   ------------------------------------------------------------------ */

r.get('/materials', async (req, res) => {
  const { level_id, stage_id, science_id, subject_id } = req.query;

  const where = [];
  const params = [];
  let i = 1;

  /*
    materials m
      LEFT JOIN material_science ms  ON ms.material_id = m.id
      LEFT JOIN material_stage  mts  ON mts.material_id = m.id
      LEFT JOIN stages st           ON st.id = mts.stage_id
      LEFT JOIN science_subject ssub ON ssub.subject_id = m.subject_id
  */

  if (subject_id) {
    where.push(`m.subject_id = $${i}`);
    params.push(subject_id);
    i++;
  }

  if (science_id) {
    // إمّا من material_science أو من science_subject
    where.push(`(ms.science_id = $${i} OR ssub.science_id = $${i})`);
    params.push(science_id);
    i++;
  }

  if (stage_id) {
    where.push(`mts.stage_id = $${i}`);
    params.push(stage_id);
    i++;
  }

  if (level_id) {
    where.push(`st.level_id = $${i}`);
    params.push(level_id);
    i++;
  }

  const sql = `
SELECT DISTINCT
  m.id,
  m.title,
  m.subject_id,
  m.created_at
FROM materials m
LEFT JOIN material_science ms  ON ms.material_id = m.id
LEFT JOIN material_stage  mts ON mts.material_id = m.id
LEFT JOIN stages st           ON st.id = mts.stage_id
LEFT JOIN science_subject ssub ON ssub.subject_id = m.subject_id
${where.length ? 'WHERE ' + where.join(' AND ') : ''}
ORDER BY m.created_at DESC
LIMIT 500

  `;

  try {
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('public /materials error', e);
    res.status(500).json({ error: 'failed to load materials' });
  }
});

/* ------------------------------------------------------------------
   3) فهرس الموارد (الملفات) مع الفلترة الكاملة
   GET /api/public/resources
   يدعم:
     q
     level_id
     stage_id
     science_id
     subject_id
     material_id
     tags = "tag1,tag2"
   يعيد: { items: Resource[], total: number }
   ------------------------------------------------------------------ */

r.get('/resources', async (req, res) => {
  const {
    q,
    level_id,
    stage_id,
    science_id,
    subject_id,
    material_id,
    tags,
  } = req.query;

  const where = [];
  const params = [];
  let i = 1;

  // بحث نصي
  if (q) {
    where.push(`(r.title ILIKE $${i} OR r.description ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }

  /*
    الربط:

    resources r
      LEFT JOIN materials m0       ON m0.id = r.material_id
      LEFT JOIN units u            ON u.id = r.unit_id
      LEFT JOIN materials m        ON m.id = COALESCE(m0.id, u.material_id)
      LEFT JOIN material_science ms  ON ms.material_id = m.id
      LEFT JOIN material_stage  mts  ON mts.material_id = m.id
      LEFT JOIN stages st          ON st.id = mts.stage_id
      LEFT JOIN science_subject ssub ON ssub.subject_id = m.subject_id
  */

  if (subject_id) {
    where.push(`m.subject_id = $${i}`);
    params.push(subject_id);
    i++;
  }

  if (science_id) {
    where.push(`(ms.science_id = $${i} OR ssub.science_id = $${i})`);
    params.push(science_id);
    i++;
  }

  if (stage_id) {
    where.push(`mts.stage_id = $${i}`);
    params.push(stage_id);
    i++;
  }

  if (level_id) {
    where.push(`st.level_id = $${i}`);
    params.push(level_id);
    i++;
  }

  if (material_id) {
    where.push(`COALESCE(m0.id, u.material_id) = $${i}`);
    params.push(material_id);
    i++;
  }

  if (tags) {
    const tagList = String(tags)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const t of tagList) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM resource_tag rt
          JOIN tags tg ON tg.id = rt.tag_id
          WHERE rt.resource_id = r.id AND tg.name = $${i}
        )
      `);
      params.push(t);
      i++;
    }
  }

  const sql = `
    SELECT DISTINCT r.*
    FROM resources r
    LEFT JOIN materials m0       ON m0.id = r.material_id
    LEFT JOIN units u            ON u.id = r.unit_id
    LEFT JOIN materials m        ON m.id = COALESCE(m0.id, u.material_id)
    LEFT JOIN material_science ms  ON ms.material_id = m.id
    LEFT JOIN material_stage  mts  ON mts.material_id = m.id
    LEFT JOIN stages st          ON st.id = mts.stage_id
    LEFT JOIN science_subject ssub ON ssub.subject_id = m.subject_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY r.created_at DESC NULLS LAST, r.id DESC
    LIMIT 400
  `;

  try {
    const { rows } = await query(sql, params);
    res.json({ items: rows, total: rows.length });
  } catch (e) {
    console.error('public /resources error', e);
    res.status(500).json({ error: 'failed to load resources' });
  }
});

export default r;

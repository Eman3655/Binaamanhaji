import { Router } from 'express';
import { query } from '../db.js';

const r = Router();

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

r.get('/filters', async (_req, res) => {
  try {
    const [levels, stages, sciences, subjects] = await Promise.all([
      query('SELECT id, name, order_index FROM levels ORDER BY order_index, id'),
      query('SELECT id, name, level_id, order_index FROM stages ORDER BY order_index, id'),
      query('SELECT id, name FROM sciences ORDER BY name'),
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

r.get('/subjects-by-filters', async (req, res) => {
  const { level_id, stage_id, science_id } = req.query;

  const where = [];
  const params = [];
  let i = 1;

  if (stage_id) { where.push(`sb.stage_id = $${i++}`); params.push(stage_id); }
  if (level_id) { where.push(`sb.level_id = $${i++}`); params.push(level_id); }
  if (science_id) { where.push(`ss.science_id = $${i++}`); params.push(science_id); }

  const sql = `
    SELECT DISTINCT sb.id, sb.name
    FROM subjects sb
    LEFT JOIN science_subject ss ON ss.subject_id = sb.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY sb.name
    LIMIT 500
  `;

  try {
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('public /subjects-by-filters error', e);
    res.status(500).json({ error: 'failed to load subjects' });
  }
});

r.get('/resources', async (req, res) => {
  const { q, level_id, stage_id, science_id, subject_id, unit_id, tags } = req.query;

  const where = [];
  const params = [];
  let i = 1;

  if (q) { where.push(`(r.title ILIKE $${i} OR r.description ILIKE $${i})`); params.push(`%${q}%`); i++; }
  if (subject_id) { where.push(`sb.id = $${i++}`); params.push(subject_id); }
  if (unit_id)    { where.push(`u.id = $${i++}`);  params.push(unit_id); }
  if (stage_id)   { where.push(`sb.stage_id = $${i++}`); params.push(stage_id); }
  if (level_id)   { where.push(`sb.level_id = $${i++}`); params.push(level_id); }
  if (science_id) { where.push(`ss.science_id = $${i++}`); params.push(science_id); }

  if (tags) {
    const tagList = String(tags).split(',').map(s=>s.trim()).filter(Boolean);
    for (const t of tagList) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM resource_tags rt
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
    LEFT JOIN units u      ON u.id = r.unit_id
    LEFT JOIN subjects sb  ON sb.id = COALESCE(r.subject_id, u.subject_id)
    LEFT JOIN science_subject ss ON ss.subject_id = sb.id
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

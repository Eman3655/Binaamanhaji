import { Router } from 'express';
import { query } from '../db.js';
import adminGuard from '../middleware/adminGuard.js';

const router = Router();

router.post('/resources', adminGuard, async (req, res) => {
  try {
    const { title, type, url, description, mime_type, size_bytes,
            subject_ids = [], semester_ids = [], tags = [] } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ error: 'title, type, url are required' });
    }

    const ins = await query(
      `INSERT INTO resources (title, type, url, description, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [title, type, url, description || null, mime_type || null, size_bytes || null]
    );
    const rid = ins.rows[0].id;

    for (const sid of subject_ids) {
      await query(
        `INSERT INTO resource_subjects (resource_id, subject_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [rid, sid]
      );
    }
    for (const semId of semester_ids) {
      await query(
        `INSERT INTO resource_semesters (resource_id, semester_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [rid, semId]
      );
    }
    for (const tg of tags) {
      const t = await query(
        `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
         RETURNING id`,
        [tg]
      );
      await query(
        `INSERT INTO resource_tags (resource_id, tag_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [rid, t.rows[0].id]
      );
    }

    res.status(201).json({ id: rid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to create resource' });
  }
});

export default router;

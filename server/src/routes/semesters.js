import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/semesters', async (req, res) => {
  const { rows } = await query('SELECT * FROM semesters ORDER BY order_index, id');
  res.json(rows);
});

router.get('/semesters/:id/resources', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT r.* FROM resources r
     JOIN resource_semesters rs ON rs.resource_id = r.id
     WHERE rs.semester_id = $1
     ORDER BY r.created_at DESC LIMIT 200`,
    [id]
  );
  res.json(rows);
});

export default router;


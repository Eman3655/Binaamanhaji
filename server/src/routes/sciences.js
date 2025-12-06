import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/sciences', async (req,res)=>{
  const { rows } = await query('SELECT * FROM sciences ORDER BY name_ar');
  res.json(rows);
});

router.get('/subjects', async (req,res)=>{
  const { science_id } = req.query;
  let sql = 'SELECT * FROM subjects';
  const params = [];
  if (science_id) { sql += ' WHERE science_id=$1'; params.push(science_id); }
  sql += ' ORDER BY name_ar';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/sciences/:id/resources', async (req,res)=>{
  const { id } = req.params;
  const { rows } = await query(
   `SELECT DISTINCT r.* FROM resources r
    JOIN resource_subjects rs ON rs.resource_id=r.id
    JOIN subjects s ON s.id=rs.subject_id
    WHERE s.science_id=$1
    ORDER BY r.created_at DESC LIMIT 200`, [id]
  );
  res.json(rows);
});

export default router;

// routes/ships.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authRequired } = require('../middleware/auth');


router.get('/ships', authRequired, async (req, res) => {
  try {
    const account_id = req.account_id; 
    const { rows } = await pool.query(
      `SELECT
         ship_id, account_id, name, imo, flag, status,statusfuturo,
         from_port, to_port, eta_date, departure_at,
         capacity, active, created_at
       FROM ships
       WHERE account_id = $1
       ORDER BY ship_id DESC
       LIMIT 100`,
      [account_id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[GET /ships] error:', e);
    res.status(500).json({ error: 'Erro ao listar ships' });
  }
});

// CRIAR
router.post('/ships', authRequired, async (req, res) => {
  try {
    const account_id = req.account_id; 
    const {
      imo, name, flag, status,statusfuturo, from_port,
      to_port, eta_date, departure_at, active
    } = req.body || {};

    if (!name) return res.status(400).json({ error: 'nome é obrigatório' });

    const { rows } = await pool.query(
      `INSERT INTO ships (
         account_id, imo, name, flag, status,statusfuturo, from_port, to_port,
         eta_date, departure_at, active
       )
       VALUES ($1, NULLIF($2,''), $3, NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''),
               NULLIF($8,''),$9::date, $10::timestamptz, $11)
       RETURNING
         ship_id, account_id, name, imo, flag, status,statusfuturo,
         from_port, to_port, eta_date, departure_at,
         capacity, active, created_at`,
      [
        account_id,
        (imo || '').trim(),
        String(name).trim(),
        flag ?? null,
        status ?? null,
        statusfuturo ?? null,
        from_port ?? null,
        to_port ?? null,
        eta_date || null,
        departure_at || null,
        active === false ? false : true
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'IMO já cadastrado para esta conta' });
    }
    console.error('[POST /ships] error:', e);
    res.status(500).json({ error: 'Erro ao criar ship' });
  }
});


router.get('/ships/:id', authRequired, async (req, res) => {
  try {
    const account_id = req.account_id;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'id inválido (inteiro esperado)' });
    }

    const { rows } = await pool.query(
      `SELECT
  ship_id, account_id, name, imo, flag, status,statusfuturo,
  from_port, to_port, eta_date, departure_at,
  capacity, active, created_at, updated_at
FROM ships
       WHERE ship_id = $1 AND account_id = $2
       LIMIT 1`,
      [id, account_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Navio não encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error('[GET /ships/:id] error:', e);
    res.status(500).json({ error: 'Erro ao buscar ship' });
  }
});


// ATUALIZAR (PUT) /api/v1/ships/:id
router.put('/ships/:id', authRequired, async (req, res) => {
  try {
    const account_id = req.account_id;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido (inteiro esperado)' });

    const {
      name, imo, flag, status,statusfuturo, from_port, to_port,
      eta_date,       
      departure_at,   
      capacity,
      active
    } = req.body || {};

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'nome é obrigatório' });
    }

    const params = [
      name.trim(),                 
      imo ?? null,                
      flag ?? null,               
      status ?? null, 
      statusfuturo ?? null,            
      from_port ?? null,          
      to_port ?? null,             
      eta_date ?? null,           
      departure_at ?? null,
      (typeof capacity === 'number' ? capacity : null), 
      (active === false ? false : active === true ? true : null),
      account_id,                  
      id                           
    ];

    const { rows } = await pool.query(
      `UPDATE ships
          SET name         = $1,
              imo          = NULLIF($2,''),
              flag         = NULLIF($3,''),
              status       = NULLIF($4,''),
              statusfuturo = NULLIF($5,''),
              from_port    = NULLIF($6,''),
              to_port      = NULLIF($7,''),
              eta_date     = NULLIF($8,'')::date,
              departure_at = NULLIF($9,'')::timestamptz,
              capacity     = $10,
              active       = COALESCE($11, active)
        WHERE account_id = $12 AND ship_id = $13
       RETURNING
  ship_id, account_id, name, imo, flag, status,statusfuturo,
  from_port, to_port, eta_date, departure_at,
  capacity, active, created_at, updated_at
`,
      params
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Navio não encontrado' });
    return res.json(rows[0]);
  } catch (e) {
    if (e && e.code === '23505') {
      return res.status(409).json({ error: 'IMO já cadastrado para esta conta' });
    }
    console.error('[PUT /ships/:id] error:', e);
    return res.status(500).json({ error: 'Erro ao atualizar ship' });
  }
});



module.exports = router;

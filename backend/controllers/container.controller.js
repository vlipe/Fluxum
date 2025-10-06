const { pool } = require('../database/db');

const {
  normalizeContainerId,
  deriveOwnerFromContainerId,
} = require('../utils/shippingLines');


function isContainerId(v) {
  const s = normalizeContainerId(v);
  // 4 letras + 7 dígitos (o último é dígito verificador)
  return /^[A-Z]{4}\d{7}$/.test(s);
}



exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    const account_id = req.account_id;
    const body = req.body || {};

   
    const rawId = String(body.id || body.container_id || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Campo "id" (container_id) é obrigatório.' });
    }

    
    const id = normalizeContainerId(rawId);

    
    if (!isContainerId(id)) {
      return res.status(400).json({
        error: 'container_id inválido. Use o formato ISO 6346: 4 letras + 7 dígitos (ex.: MSCU1234567).'
      });
    }

    
    const imo  = body.imo ? String(body.imo).trim() : '';
    let owner  = body.owner ? String(body.owner).trim() : null;
    const container_type = body.container_type ? String(body.container_type).trim() : null;
    const description    = body.description ? String(body.description).trim() : null;
    const active         = typeof body.active === 'boolean' ? body.active : true;

    if (!imo) {
      return res.status(400).json({ error: 'Campo "imo" é obrigatório.' });
    }

    if (!owner) owner = deriveOwnerFromContainerId(id);

    // 5) FK: ship precisa existir para (account_id, imo)
    const ship = await client.query(
      `SELECT ship_id FROM public.ships WHERE account_id=$1 AND imo=$2 LIMIT 1`,
      [account_id, imo]
    );
    if (ship.rowCount === 0) {
      return res.status(400).json({ error: 'Não existe navio com esse IMO nesta conta.' });
    }

    // 6) upsert por PK (id)
   const q = await client.query(
     `INSERT INTO public.containers (id, account_id, imo, container_type, owner, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         account_id     = EXCLUDED.account_id,
         imo            = EXCLUDED.imo,
         container_type = COALESCE(EXCLUDED.container_type, containers.container_type),
         owner          = COALESCE(EXCLUDED.owner, containers.owner),
        description    = COALESCE(EXCLUDED.description, containers.description),
        active         = EXCLUDED.active
       RETURNING id, account_id, imo, container_type, owner, description, active, created_at`,
      [id, account_id, imo, container_type, owner, description, active]
     );

    return res.status(201).json(q.rows[0]);
  } catch (e) {
    console.error('[containers.create] error:', e);
    if (e.code === '23503') {
      return res.status(400).json({ error: 'IMO não vinculado a um navio desta conta.' });
    }
    return res.status(500).json({ error: 'Erro ao criar container' });
  } finally {
    client.release();
  }
};


exports.list = async (req, res) => {
  try {
    const account_id = req.account_id;
    const q = await pool.query(
      `SELECT
   id,
   account_id,
   imo,
   container_type,
   owner,
   description,
   COALESCE(active, TRUE) AS active,   -- <==
   min_temp,
   max_temp,
   created_at
 FROM public.containers
 WHERE account_id = $1
 ORDER BY created_at DESC
 LIMIT 500`,
      [account_id]
    );
    return res.json(q.rows);
  } catch (e) {
    console.error('[containers.list] error:', e);
    return res.status(500).json({ error: 'Erro ao listar containers' });
  }
};


exports.getById = async (req, res) => {
  try {
    const account_id = req.account_id;
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const q = await pool.query(
      `SELECT
   id,
   account_id,
   imo,
   container_type,
   owner,
   description,
   COALESCE(active, TRUE) AS active,   -- <==
   created_at
 FROM public.containers
 WHERE account_id = $1 AND id = $2
 LIMIT 1`,
      [account_id, id]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'Container não encontrado' });
    return res.json(q.rows[0]);
  } catch (e) {
    console.error('[containers.getById] error:', e);
    return res.status(500).json({ error: 'Erro ao buscar container' });
  }
};

exports.update = async (req, res) => {
  try {
    const account_id = req.account_id;
    const rawId = String(req.params.id || '').trim();
    const id = normalizeContainerId(rawId);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const body = req.body || {};
    const imo  = body.imo ? String(body.imo).trim() : null;
    let owner  = body.owner ? String(body.owner).trim() : null;
    const container_type = body.container_type ? String(body.container_type).trim() : null;
    const description    = body.description ? String(body.description).trim() : null;
    const active         = (typeof body.active === 'boolean') ? body.active : null;

   
    if (imo) {
      const ship = await pool.query(
        `SELECT 1 FROM public.ships WHERE account_id=$1 AND imo=$2 LIMIT 1`,
        [account_id, imo]
      );
      if (ship.rowCount === 0) {
        return res.status(400).json({ error: 'Não existe navio com esse IMO nesta conta.' });
      }
    }

   
    if (!owner) owner = deriveOwnerFromContainerId(id);

   const q = await pool.query(
      `UPDATE public.containers
          SET imo            = COALESCE(NULLIF($3,''), imo),
              container_type = COALESCE($4, container_type),
              owner          = COALESCE($5, owner),
              description    = COALESCE($6, description),
              active         = COALESCE($7, active)
        WHERE account_id = $1 AND id = $2
        RETURNING id, account_id, imo, container_type, owner, description, active, created_at`,
      [account_id, id, imo, container_type, owner, description, active]
    );

    if (q.rowCount === 0) return res.status(404).json({ error: 'Container não encontrado' });
    return res.json(q.rows[0]);
  } catch (e) {
    console.error('[containers.update] error:', e);
    if (e.code === '23503') {
      return res.status(400).json({ error: 'IMO não vinculado a um navio desta conta.' });
    }
    return res.status(500).json({ error: 'Erro ao atualizar container' });
  }
};



exports.remove = async (req, res) => {
  const client = await pool.connect();
  try {
    const account_id = req.account_id;
    const id = normalizeContainerId(String(req.params.id || '').trim());
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const del = await client.query(
      `DELETE FROM public.containers WHERE account_id=$1 AND id=$2`,
      [account_id, id]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: 'Container não encontrado' });
    return res.status(204).send();
  } catch (e) {
    console.error('[containers.remove] error:', e);
    return res.status(500).json({ error: 'Erro ao excluir container' });
  } finally {
    client.release();
  }
};



exports.listByShip = async (req, res) => {
  try {
    const account_id = req.account_id;
    const shipId = Number(req.params.id);

    if (!Number.isFinite(shipId)) {
      return res.status(400).json({ error: 'ship_id inválido' });
    }

    const q = await pool.query(
      `
      SELECT 
         c.id,
         c.account_id,
         c.imo,
         c.container_type,
         c.owner,
         c.description,
         COALESCE(c.active, TRUE) AS active,
         c.created_at,

         -- prioriza o estado agregado; se não houver, cai pro último movimento
         COALESCE(cs.last_temp_c, mv.last_temp_c) AS last_temp_c,
         COALESCE(cs.last_ts_iso, mv.last_ts_iso) AS last_ts_iso

      FROM public.containers c
      JOIN public.ships s
        ON s.account_id = c.account_id
       AND s.imo        = c.imo

      -- estado agregado (se você mantiver essa tabela atualizada)
      LEFT JOIN public.container_state cs
        ON cs.container_id = c.id

      -- fallback: último movimento com temp registrada
      LEFT JOIN LATERAL (
        SELECT
          cm.temp_c AS last_temp_c,
          COALESCE(cm.ts_iso, cm.created_at) AS last_ts_iso
        FROM public.container_movements cm
        WHERE cm.container_id = c.id
          AND cm.temp_c IS NOT NULL
        ORDER BY COALESCE(cm.ts_iso, cm.created_at) DESC
        LIMIT 1
      ) mv ON TRUE

      WHERE s.account_id = $1
        AND s.ship_id    = $2
      ORDER BY c.created_at DESC
      LIMIT 500
      `,
      [account_id, shipId]
    );

    return res.json(q.rows);
  } catch (e) {
    console.error('[containers.listByShip] error:', e);
    return res.status(500).json({ error: 'Erro ao listar containers do navio' });
  }
};






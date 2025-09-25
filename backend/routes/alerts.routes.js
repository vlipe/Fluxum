const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");

router.get("/alerts", async (req, res) => {
  const limit = Number(req.query.limit || 200);
  const { rows } = await pool.query(
    `SELECT id, alert_type, container_id, message, created_at, acknowledged_at
     FROM alerts
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json(rows);
});

router.patch("/alerts/:id/ack", async (req, res) => {
  const id = String(req.params.id);
  const { rowCount } = await pool.query(
    `UPDATE alerts
       SET acknowledged_at = NOW()
     WHERE id = $1 AND acknowledged_at IS NULL`,
    [id]
  );
  if (rowCount === 0) return res.status(404).json({ error: "Not Found" });
  res.json({ ok: true });
});

module.exports = router;

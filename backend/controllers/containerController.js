const db = require('../database/db');

exports.registerMovement = (req, res) => {
  const { containerId, location, status } = req.body;

  if (!containerId || !location || !status) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const query = `
    INSERT INTO containers (containerId, location, status)
    VALUES (?, ?, ?)
  `;

  db.run(query, [containerId, location, status], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: 'Movimentação registrada com sucesso',
      id: this.lastID,
    });
  });
};

exports.getAllMovements = (req, res) => {
  const query = `SELECT * FROM containers ORDER BY timestamp DESC`;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

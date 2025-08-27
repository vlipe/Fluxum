const express = require('express');
const dotenv = require('dotenv');
const containerRoutes = require('./routes/containerRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/containers', containerRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

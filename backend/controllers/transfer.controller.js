// backend/controllers/transferController.js
const transferService = require('../services/transferService');


const handleStartTransfer = (req, res) => {
  try {
    const { fromShipId, toShipId } = req.body;
    if (!fromShipId || !toShipId) {
      return res.status(400).json({ message: "Navio de origem e destino são obrigatórios." });
    }
    const state = transferService.startTransfer({ fromShipId, toShipId, userId: req.user?.id });
    res.status(200).json({ message: "Modo de transferência iniciado.", state });
  } catch (error) {
    res.status(409).json({ message: error.message }); // 409 Conflict se já houver uma ativa
  }
};

const handleEndTransfer = (req, res) => {
  try {
    const state = transferService.endTransfer();
    res.status(200).json({ message: "Modo de transferência finalizado.", state });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTransferStatus = (req, res) => {
    res.status(200).json(transferService.getActiveTransfer());
};

module.exports = {
  handleStartTransfer,
  handleEndTransfer,
  getTransferStatus,
};  
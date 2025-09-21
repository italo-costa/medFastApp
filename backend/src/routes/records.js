const express = require('express');
const router = express.Router();

// Rotas temporárias para prontuários
router.get('/', (req, res) => {
  res.json({ message: 'Records routes - Em desenvolvimento' });
});

module.exports = router;
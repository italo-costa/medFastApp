const express = require('express');
const router = express.Router();

// Rotas temporárias para alergias
router.get('/', (req, res) => {
  res.json({ message: 'Allergies routes - Em desenvolvimento' });
});

module.exports = router;
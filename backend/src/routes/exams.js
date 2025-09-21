const express = require('express');
const router = express.Router();

// Rotas temporárias para exames
router.get('/', (req, res) => {
  res.json({ message: 'Exams routes - Em desenvolvimento' });
});

module.exports = router;
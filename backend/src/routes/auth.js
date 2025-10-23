const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Verificar disponibilidade de nome de usuário
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário é obrigatório'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    res.json({
      success: true,
      available: !existingUser
    });
  } catch (error) {
    logger.error('Erro ao verificar username:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Registrar novo médico
router.post('/register-doctor', async (req, res) => {
  try {
    const {
      nomeCompleto,
      cpf,
      rg,
      dataNascimento,
      telefone,
      email,
      crm,
      especialidade,
      rqe,
      instituicaoFormacao,
      anoFormacao,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      usuario,
      senha
    } = req.body;

    // Validações básicas
    if (!nomeCompleto || !cpf || !crm || !especialidade || !usuario || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { username: usuario }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário já está em uso'
      });
    }

    // Verificar se CPF já existe
    const existingCPF = await prisma.user.findFirst({
      where: { cpf }
    });

    if (existingCPF) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Verificar se CRM já existe
    const existingCRM = await prisma.user.findFirst({
      where: { crm }
    });

    if (existingCRM) {
      return res.status(400).json({
        success: false,
        message: 'CRM já cadastrado no sistema'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Normalizar especialidade (primeira letra maiúscula, resto minúsculo)
    const normalizedSpecialty = especialidade ? 
      especialidade.charAt(0).toUpperCase() + especialidade.slice(1).toLowerCase() : null;

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: nomeCompleto,
        username: usuario,
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        cpf,
        rg: rg || null,
        birthDate: new Date(dataNascimento),
        phone: telefone,
        crm,
        specialty: normalizedSpecialty,
        rqe: rqe || null,
        formationInstitution: instituicaoFormacao || 'Não informado',
        formationYear: parseInt(anoFormacao) || new Date().getFullYear(),
        address: (cep || logradouro) ? {
          cep: cep || null,
          logradouro: logradouro || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null
        } : null
      }
    });

    logger.info(`Novo médico cadastrado: ${user.name} (${user.crm})`);

    res.status(201).json({
      success: true,
      message: 'Médico cadastrado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        crm: user.crm,
        specialty: user.specialty
      }
    });
  } catch (error) {
    logger.error('Erro ao cadastrar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuário e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'mediapp-secret-key',
      { expiresIn: '24h' }
    );

    logger.info(`Login realizado: ${user.username}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        crm: user.crm,
        specialty: user.specialty
      }
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Com JWT, o logout é feito no frontend removendo o token
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Verificar token (middleware para rotas protegidas)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mediapp-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        crm: true,
        specialty: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Listar todos os médicos
router.get('/doctors', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = {
      role: 'DOCTOR'
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { crm: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          crm: true,
          specialty: true,
          phone: true,
          formationInstitution: true,
          formationYear: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    logger.info(`Listagem de médicos solicitada - ${doctors.length} encontrados`);

    res.json({
      success: true,
      doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erro ao listar médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar médico por ID
router.get('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: 'DOCTOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        cpf: true,
        rg: true,
        birthDate: true,
        phone: true,
        crm: true,
        specialty: true,
        rqe: true,
        formationInstitution: true,
        formationYear: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    logger.error('Erro ao buscar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Estatísticas dos médicos
router.get('/doctors/stats/overview', async (req, res) => {
  try {
    const totalDoctors = await prisma.user.count({
      where: { role: 'DOCTOR' }
    });

    const activeDoctors = await prisma.user.count({
      where: {
        role: 'DOCTOR',
        isActive: true
      }
    });

    const specialties = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { specialty: true },
      distinct: ['specialty']
    });

    res.json({
      success: true,
      stats: {
        totalDoctors,
        activeDoctors,
        totalSpecialties: specialties.length,
        inactiveDoctors: totalDoctors - activeDoctors
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const config = require('./config');

class PrismaServer {
  constructor() {
    this.app = express();
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Make Prisma available in requests
    this.app.use((req, res, next) => {
      req.prisma = this.prisma;
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Test database connection
        await this.prisma.$queryRaw`SELECT 1`;
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'connected',
          version: process.env.npm_package_version || '1.0.0'
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          database: 'disconnected'
        });
      }
    });

    // API health check
    this.app.get('/api/health', async (req, res) => {
      try {
        const dbStart = Date.now();
        await this.prisma.$queryRaw`SELECT 1`;
        const dbTime = Date.now() - dbStart;

        // Get basic stats
        const stats = await this.getBasicStats();

        res.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: {
            status: 'connected',
            responseTime: `${dbTime}ms`
          },
          stats,
          server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            pid: process.pid,
            version: process.version
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          database: {
            status: 'disconnected'
          }
        });
      }
    });

    // Database stats endpoint
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getDetailedStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch database statistics',
          error: error.message
        });
      }
    });

    // Test endpoint for development
    if (process.env.NODE_ENV === 'development') {
      this.app.get('/api/test', async (req, res) => {
        try {
          const result = await this.prisma.$queryRaw`SELECT NOW() as current_time`;
          res.json({
            success: true,
            message: 'Prisma connection test successful',
            data: result,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Prisma connection test failed',
            error: error.message
          });
        }
      });
    }

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'MediApp Prisma Server API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          apiHealth: '/api/health',
          stats: '/api/stats',
          ...(process.env.NODE_ENV === 'development' && { test: '/api/test' })
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Global error handler:', error);

      // Prisma specific errors
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry',
          error: 'A record with this information already exists'
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
          error: 'The requested record does not exist'
        });
      }

      // Generic error response
      const statusCode = error.statusCode || error.status || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(statusCode).json({
        success: false,
        message: message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error 
        })
      });
    });
  }

  async getBasicStats() {
    try {
      const [usuarios, medicos, pacientes] = await Promise.all([
        this.prisma.usuario.count(),
        this.prisma.medico.count(),
        this.prisma.paciente.count()
      ]);

      return {
        usuarios,
        medicos,
        pacientes
      };
    } catch (error) {
      throw new Error(`Failed to get basic stats: ${error.message}`);
    }
  }

  async getDetailedStats() {
    try {
      const [
        usuarios,
        medicos,
        pacientes,
        consultas,
        prontuarios,
        exames,
        agendamentos
      ] = await Promise.all([
        this.prisma.usuario.count(),
        this.prisma.medico.count(),
        this.prisma.paciente.count(),
        this.prisma.consulta.count(),
        this.prisma.prontuario.count(),
        this.prisma.exame.count(),
        this.prisma.agendamento.count()
      ]);

      // Get recent activity
      const recentConsultas = await this.prisma.consulta.count({
        where: {
          criado_em: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const recentAgendamentos = await this.prisma.agendamento.count({
        where: {
          criado_em: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return {
        totals: {
          usuarios,
          medicos,
          pacientes,
          consultas,
          prontuarios,
          exames,
          agendamentos
        },
        recent: {
          consultas_24h: recentConsultas,
          agendamentos_24h: recentAgendamentos
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get detailed stats: ${error.message}`);
    }
  }

  async start(port = 3002) {
    try {
      // Connect to database
      await this.prisma.$connect();
      console.log('✅ Connected to database');

      // Start server
      this.server = this.app.listen(port, () => {
        console.log(`🚀 Prisma server running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`📈 API Health: http://localhost:${port}/api/health`);
        console.log(`📋 Stats: http://localhost:${port}/api/stats`);
      });

      return this.server;
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('🛑 Server stopped');
      }

      await this.prisma.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  getApp() {
    return this.app;
  }

  getPrisma() {
    return this.prisma;
  }
}

// Export for testing and manual usage
module.exports = PrismaServer;

// Auto-start if this file is run directly
if (require.main === module) {
  const server = new PrismaServer();
  const port = process.env.PORT || 3002;
  
  server.start(port).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
}
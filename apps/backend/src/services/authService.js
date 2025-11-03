/**
 * Serviço de Autenticação Centralizado
 * Consolida toda lógica de autenticação, hash de senhas e tokens
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const databaseService = require('./database');

class AuthService {

  /**
   * Hash de senha
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} - Hash da senha
   */
  static async hashPassword(password) {
    if (!password) {
      throw new Error('Senha é obrigatória');
    }
    
    return await bcrypt.hash(password, 12);
  }

  /**
   * Comparar senha com hash
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>} - Se a senha está correta
   */
  static async comparePassword(password, hash) {
    if (!password || !hash) {
      return false;
    }
    
    return await bcrypt.compare(password, hash);
  }

  /**
   * Gerar token JWT
   * @param {Object} payload - Dados para incluir no token
   * @param {Object} options - Opções do token (expiresIn, etc)
   * @returns {string} - Token JWT
   */
  static generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'medfast-api'
    };
    
    const tokenOptions = { ...defaultOptions, ...options };
    const secret = process.env.JWT_SECRET || 'medfast-secret-key-2025';
    
    return jwt.sign(payload, secret, tokenOptions);
  }

  /**
   * Verificar e decodificar token JWT
   * @param {string} token - Token a ser verificado
   * @returns {Object} - Payload decodificado
   */
  static verifyToken(token) {
    if (!token) {
      throw new Error('Token é obrigatório');
    }
    
    const secret = process.env.JWT_SECRET || 'medfast-secret-key-2025';
    
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else {
        throw new Error('Erro na verificação do token');
      }
    }
  }

  /**
   * Refresh token
   * @param {string} refreshToken - Token de refresh
   * @returns {Object} - Novo access token e dados do usuário
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      // Buscar usuário atual
      const user = await databaseService.client.usuario.findUnique({
        where: { id: decoded.userId },
        include: {
          medico: {
            select: {
              id: true,
              crm: true,
              especialidade: true
            }
          }
        }
      });

      if (!user || !user.ativo) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Gerar novo token
      const newToken = this.generateToken({
        userId: user.id,
        email: user.email,
        tipo: user.tipo
      });

      return {
        token: newToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
          medico: user.medico
        }
      };

    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  }

  /**
   * Login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Object} - Token e dados do usuário
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Buscar usuário
    const user = await databaseService.client.usuario.findFirst({
      where: { 
        email: email.toLowerCase().trim(),
        ativo: true
      },
      include: {
        medico: {
          select: {
            id: true,
            crm: true,
            especialidade: true,
            telefone: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const senhaValida = await this.comparePassword(password, user.senha);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas');
    }

    // Atualizar último login
    await databaseService.client.usuario.update({
      where: { id: user.id },
      data: { ultimo_login: new Date() }
    });

    // Gerar tokens
    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email,
      tipo: user.tipo
    });

    const refreshToken = this.generateToken({
      userId: user.id,
      email: user.email,
      tipo: 'refresh'
    }, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        medico: user.medico
      }
    };
  }

  /**
   * Validar se usuário existe e está ativo
   * @param {string} userId - ID do usuário
   * @returns {Object} - Dados do usuário
   */
  static async validateUser(userId) {
    const user = await databaseService.client.usuario.findUnique({
      where: { id: userId },
      include: {
        medico: {
          select: {
            id: true,
            crm: true,
            especialidade: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.ativo) {
      throw new Error('Usuário inativo');
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      medico: user.medico
    };
  }

  /**
   * Verificar se email está disponível
   * @param {string} email - Email a verificar
   * @param {string} excludeUserId - ID do usuário a excluir da verificação
   * @returns {boolean} - Se o email está disponível
   */
  static async isEmailAvailable(email, excludeUserId = null) {
    const where = { email: email.toLowerCase().trim() };
    
    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    const existingUser = await databaseService.client.usuario.findFirst({ where });
    return !existingUser;
  }

  /**
   * Logout (invalidar sessão)
   * @param {string} userId - ID do usuário
   * @returns {boolean} - Sucesso
   */
  static async logout(userId) {
    // Por enquanto apenas log, futuramente pode implementar blacklist de tokens
    console.log(`👋 [AUTH] Usuário ${userId} fez logout`);
    return true;
  }

  /**
   * Gerar senha temporária
   * @param {number} length - Tamanho da senha
   * @returns {string} - Senha temporária
   */
  static generateTemporaryPassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }

  /**
   * Middleware de autenticação para Express
   */
  static authMiddleware() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token de acesso requerido'
          });
        }

        const token = authHeader.substring(7);
        const decoded = AuthService.verifyToken(token);
        const user = await AuthService.validateUser(decoded.userId);

        req.user = user;
        next();

      } catch (error) {
        return res.status(401).json({
          success: false,
          message: error.message || 'Token inválido'
        });
      }
    };
  }
}

module.exports = AuthService;
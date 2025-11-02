const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('🔍 Debug Autenticação', () => {
    let app;
    let testUser;

    beforeAll(async () => {
        // Import do app
        app = require('../../src/server-prisma');
        
        // Limpar dados existentes
        await prisma.usuario.deleteMany({});
        
        // Criar usuário de teste
        const senhaHash = await bcrypt.hash('senha123', 10);
        
        testUser = await prisma.usuario.create({
            data: {
                email: 'teste@debug.com',
                senha: senhaHash,
                nome: 'Usuario Debug',
                tipo: 'MEDICO',
                ativo: true
            }
        });
        
        console.log('✅ Usuário criado:', testUser.email);
        console.log('🔑 Senha hash:', senhaHash);
    });

    afterAll(async () => {
        await prisma.usuario.deleteMany({});
        await prisma.$disconnect();
    });

    test('🔐 deve fazer login com sucesso', async () => {
        console.log('🧪 Tentando login com:', {
            email: 'teste@debug.com',
            senha: 'senha123'
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'teste@debug.com',
                senha: 'senha123'
            });

        console.log('📤 Response status:', response.status);
        console.log('📤 Response body:', response.body);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
    });

    test('🔍 deve verificar bcrypt diretamente', async () => {
        const senha = 'senha123';
        const hash = await bcrypt.hash(senha, 10);
        const isValid = await bcrypt.compare(senha, hash);
        
        console.log('🔐 Teste bcrypt:', { senha, hash, isValid });
        expect(isValid).toBe(true);
    });

    test('🔍 deve verificar usuario no banco', async () => {
        const usuario = await prisma.usuario.findUnique({
            where: { email: 'teste@debug.com' }
        });
        
        console.log('👤 Usuario no banco:', usuario);
        expect(usuario).toBeDefined();
        expect(usuario.ativo).toBe(true);
    });
});
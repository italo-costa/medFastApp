const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../src/server-prisma');

const prisma = new PrismaClient();

describe('🧪 Teste Rápido de Integração', () => {
    let server;

    beforeAll(async () => {
        server = app.listen(3004);
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        if (server) server.close();
        await prisma.$disconnect();
    });

    test('deve verificar se sistema está funcionando', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        console.log('Health check:', response.body);
        expect(response.body.status).toBe('OK');
        expect(response.body.message).toContain('MediApp');
    });

    test('deve listar médicos sem autenticação', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .expect(200);

        console.log('Médicos encontrados:', response.body.data?.length || 0);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('deve testar login com dados corretos', async () => {
        // Primeiro listar usuários para ver qual email usar
        const usuarios = await prisma.usuario.findMany({
            where: { tipo: 'MEDICO' },
            include: { medico: true }
        });

        console.log('Usuários médicos encontrados:', usuarios.map(u => ({ 
            email: u.email, 
            nome: u.nome,
            ativo: u.ativo 
        })));

        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: usuario.email,
                    senha: 'medico123'
                });

            console.log('Login response status:', response.status);
            console.log('Login response body:', response.body);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.token).toBeDefined();
            }
        }
    });

    test('deve listar pacientes com dados corretos', async () => {
        const response = await request(app)
            .get('/api/pacientes')
            .expect(200);

        console.log('Pacientes encontrados:', response.body.data?.length || 0);
        if (response.body.data && response.body.data.length > 0) {
            console.log('Primeiro paciente:', response.body.data[0]);
        }
    });

    test('deve funcionar com dados de teste', async () => {
        // Verificar contagens
        const [countMedicos, countPacientes, countUsuarios] = await Promise.all([
            prisma.medico.count(),
            prisma.paciente.count(),
            prisma.usuario.count()
        ]);

        console.log('Dados no banco:', {
            medicos: countMedicos,
            pacientes: countPacientes,
            usuarios: countUsuarios
        });

        expect(countMedicos).toBeGreaterThan(0);
        expect(countPacientes).toBeGreaterThan(0);
        expect(countUsuarios).toBeGreaterThan(0);
    });
});
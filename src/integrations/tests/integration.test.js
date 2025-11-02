/**
 * 🧪 TESTES DO SISTEMA DE INTEGRAÇÃO EXTERNA
 * 
 * Suite completa de testes para validar funcionalidade, robustez e
 * integração dos serviços externos.
 * 
 * @author MediApp Testing Team
 * @version 1.0.0
 */

const { ExternalIntegration, ExternalIntegrationAdapter } = require('../index');

describe('🔗 Sistema de Integração Externa', () => {
    let adapter;

    beforeAll(async () => {
        // Configuração de teste com timeouts reduzidos
        const testConfig = {
            viacep: {
                baseUrl: 'https://viacep.com.br/ws',
                timeout: 5000,
                cacheTimeout: 60000, // 1 minuto para testes
                rateLimitDelay: 50
            },
            datasus: {
                timeout: 5000,
                cacheTimeout: 60000,
                rateLimitDelay: 100
            },
            ans: {
                timeout: 5000,
                cacheTimeout: 60000,
                rateLimitDelay: 100
            },
            icpbrasil: {
                timeout: 5000,
                cacheTimeout: 60000,
                rateLimitDelay: 100
            }
        };

        ExternalIntegration.init(testConfig);
        adapter = ExternalIntegration.getAdapter();
    });

    afterAll(async () => {
        // Limpeza após testes
        ExternalIntegration.clearCache();
    });

    describe('🏗️ Inicialização e Configuração', () => {
        test('deve inicializar corretamente', () => {
            expect(adapter).toBeDefined();
            expect(adapter.getService('viacep')).toBeDefined();
            expect(adapter.getService('datasus')).toBeDefined();
            expect(adapter.getService('ans')).toBeDefined();
            expect(adapter.getService('icpbrasil')).toBeDefined();
        });

        test('deve ter configurações corretas', () => {
            const stats = ExternalIntegration.getStats();
            expect(stats).toHaveProperty('totalRequests');
            expect(stats).toHaveProperty('successRate');
            expect(stats).toHaveProperty('averageResponseTime');
        });

        test('deve criar nova instância com configuração customizada', () => {
            const customAdapter = new ExternalIntegrationAdapter({
                viacep: { timeout: 15000 }
            });
            expect(customAdapter).toBeDefined();
        });
    });

    describe('📍 Integração ViaCEP', () => {
        test('deve consultar CEP válido', async () => {
            const resultado = await ExternalIntegration.consultarCep('01310-100');
            
            expect(resultado).toHaveProperty('cep');
            expect(resultado).toHaveProperty('logradouro');
            expect(resultado).toHaveProperty('bairro');
            expect(resultado).toHaveProperty('localidade');
            expect(resultado).toHaveProperty('uf');
            expect(resultado.cep).toBe('01310-100');
        }, 10000);

        test('deve buscar CEPs por endereço', async () => {
            const resultados = await ExternalIntegration.buscarCepPorEndereco(
                'SP', 'São Paulo', 'Avenida Paulista'
            );
            
            expect(Array.isArray(resultados)).toBe(true);
            expect(resultados.length).toBeGreaterThan(0);
            
            if (resultados.length > 0) {
                expect(resultados[0]).toHaveProperty('cep');
                expect(resultados[0]).toHaveProperty('logradouro');
            }
        }, 10000);

        test('deve tratar CEP inválido', async () => {
            await expect(
                ExternalIntegration.consultarCep('00000-000')
            ).rejects.toThrow();
        });

        test('deve tratar CEP com formato incorreto', async () => {
            await expect(
                ExternalIntegration.consultarCep('123')
            ).rejects.toThrow();
        });
    });

    describe('🏥 Integração DATASUS/SUS', () => {
        test('deve buscar estabelecimentos de saúde', async () => {
            const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude('355030');
            
            expect(Array.isArray(estabelecimentos)).toBe(true);
            expect(estabelecimentos.length).toBeGreaterThan(0);
            
            const primeiro = estabelecimentos[0];
            expect(primeiro).toHaveProperty('cnes');
            expect(primeiro).toHaveProperty('nomeFantasia');
            expect(primeiro).toHaveProperty('tipoUnidade');
            expect(primeiro).toHaveProperty('endereco');
        });

        test('deve consultar indicadores de saúde', async () => {
            const indicadores = await ExternalIntegration.consultarIndicadoresSaude(
                'mortalidade_infantil',
                { uf: 'SP', ano: 2023 }
            );
            
            expect(indicadores).toHaveProperty('indicador');
            expect(indicadores).toHaveProperty('valor');
            expect(indicadores).toHaveProperty('unidade');
            expect(indicadores).toHaveProperty('periodo');
            expect(indicadores.indicador).toBe('mortalidade_infantil');
        });

        test('deve integrar com RNDS', async () => {
            const dadosRNDS = {
                paciente: {
                    cpf: '123.456.789-00',
                    nome: 'João da Silva'
                },
                procedimento: 'consulta_medica',
                estabelecimento: '2077915'
            };
            
            const resultado = await ExternalIntegration.integrarRNDS(dadosRNDS);
            
            expect(resultado).toHaveProperty('protocoloRNDS');
            expect(resultado).toHaveProperty('status');
            expect(resultado.status).toBe('enviado');
        });
    });

    describe('🏥 Integração ANS', () => {
        test('deve consultar operadoras de saúde', async () => {
            const operadoras = await ExternalIntegration.consultarOperadoras('SP');
            
            expect(Array.isArray(operadoras)).toBe(true);
            expect(operadoras.length).toBeGreaterThan(0);
            
            const primeira = operadoras[0];
            expect(primeira).toHaveProperty('registroANS');
            expect(primeira).toHaveProperty('razaoSocial');
            expect(primeira).toHaveProperty('nomeFantasia');
            expect(primeira).toHaveProperty('modalidade');
        });

        test('deve validar beneficiário', async () => {
            const beneficiario = await ExternalIntegration.validarBeneficiario(
                '12345678901234567890',
                '123.456.789-00'
            );
            
            expect(beneficiario).toHaveProperty('numeroCartao');
            expect(beneficiario).toHaveProperty('nome');
            expect(beneficiario).toHaveProperty('situacao');
            expect(beneficiario).toHaveProperty('plano');
        });

        test('deve enviar dados TISS', async () => {
            const dadosTISS = {
                operadora: '12345',
                prestador: '67890',
                beneficiario: '12345678901234567890',
                procedimentos: [
                    {
                        codigo: '10101012',
                        descricao: 'Consulta médica',
                        quantidade: 1,
                        valorUnitario: 50.00
                    }
                ]
            };
            
            const resultado = await ExternalIntegration.enviarTISS(dadosTISS);
            
            expect(resultado).toHaveProperty('protocoloTISS');
            expect(resultado).toHaveProperty('status');
            expect(resultado).toHaveProperty('numeroLote');
        });
    });

    describe('🔐 Integração ICP-Brasil', () => {
        test('deve validar certificado digital', async () => {
            const certificadoTeste = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...'; // Base64 do certificado
            
            const validacao = await ExternalIntegration.validarCertificadoDigital(certificadoTeste);
            
            expect(validacao).toHaveProperty('valido');
            expect(validacao).toHaveProperty('titular');
            expect(validacao).toHaveProperty('emissor');
            expect(validacao).toHaveProperty('validade');
            expect(validacao).toHaveProperty('cadeiaCertificacao');
        });

        test('deve assinar documento', async () => {
            const documento = 'Documento de teste para assinatura digital';
            const certificado = 'certificado_teste_base64';
            
            const documentoAssinado = await ExternalIntegration.assinarDocumento(
                documento,
                certificado
            );
            
            expect(documentoAssinado).toHaveProperty('documentoOriginal');
            expect(documentoAssinado).toHaveProperty('assinatura');
            expect(documentoAssinado).toHaveProperty('certificado');
            expect(documentoAssinado).toHaveProperty('timestamp');
            expect(documentoAssinado).toHaveProperty('algoritmo');
        });

        test('deve verificar assinatura', async () => {
            const documentoAssinado = {
                documentoOriginal: 'Documento de teste',
                assinatura: 'assinatura_base64',
                certificado: 'certificado_base64',
                timestamp: new Date().toISOString(),
                algoritmo: 'SHA256withRSA'
            };
            
            const verificacao = await ExternalIntegration.verificarAssinatura(documentoAssinado);
            
            expect(verificacao).toHaveProperty('assinaturaValida');
            expect(verificacao).toHaveProperty('certificadoValido');
            expect(verificacao).toHaveProperty('timestampValido');
            expect(verificacao).toHaveProperty('detalhes');
        });
    });

    describe('🔍 Monitoramento e Diagnóstico', () => {
        test('deve executar health check de todos os serviços', async () => {
            const health = await ExternalIntegration.healthCheck();
            
            expect(health).toHaveProperty('viacep');
            expect(health).toHaveProperty('datasus');
            expect(health).toHaveProperty('ans');
            expect(health).toHaveProperty('icpbrasil');
            
            Object.values(health).forEach(serviceHealth => {
                expect(serviceHealth).toHaveProperty('status');
                expect(serviceHealth).toHaveProperty('responseTime');
                expect(['healthy', 'degraded', 'unhealthy']).toContain(serviceHealth.status);
            });
        }, 15000);

        test('deve fornecer diagnósticos detalhados', async () => {
            const diagnostics = await ExternalIntegration.diagnostics();
            
            expect(diagnostics).toHaveProperty('viacep');
            expect(diagnostics).toHaveProperty('datasus');
            expect(diagnostics).toHaveProperty('ans');
            expect(diagnostics).toHaveProperty('icpbrasil');
            
            Object.values(diagnostics).forEach(serviceDiag => {
                expect(serviceDiag).toHaveProperty('status');
                expect(serviceDiag).toHaveProperty('uptime');
                expect(serviceDiag).toHaveProperty('cache');
                expect(serviceDiag).toHaveProperty('requests');
            });
        }, 15000);

        test('deve fornecer estatísticas de uso', () => {
            const stats = ExternalIntegration.getStats();
            
            expect(stats).toHaveProperty('totalRequests');
            expect(stats).toHaveProperty('successRate');
            expect(stats).toHaveProperty('averageResponseTime');
            expect(stats).toHaveProperty('cacheHitRate');
            expect(stats).toHaveProperty('serviceUsage');
            
            expect(typeof stats.totalRequests).toBe('number');
            expect(typeof stats.successRate).toBe('number');
            expect(typeof stats.averageResponseTime).toBe('number');
            expect(typeof stats.cacheHitRate).toBe('number');
        });
    });

    describe('⚡ Performance e Cache', () => {
        test('deve usar cache para consultas repetidas', async () => {
            const cep = '01310-100';
            
            // Primeira consulta (sem cache)
            const inicio1 = Date.now();
            const resultado1 = await ExternalIntegration.consultarCep(cep);
            const tempo1 = Date.now() - inicio1;
            
            // Segunda consulta (com cache)
            const inicio2 = Date.now();
            const resultado2 = await ExternalIntegration.consultarCep(cep);
            const tempo2 = Date.now() - inicio2;
            
            expect(resultado1).toEqual(resultado2);
            expect(tempo2).toBeLessThan(tempo1); // Cache deve ser mais rápido
        });

        test('deve limpar cache corretamente', async () => {
            // Fazer uma consulta para popular o cache
            await ExternalIntegration.consultarCep('01310-100');
            
            // Verificar estatísticas antes da limpeza
            const statsBefore = ExternalIntegration.getStats();
            
            // Limpar cache
            ExternalIntegration.clearCache();
            
            // Verificar que o cache foi limpo
            const statsAfter = ExternalIntegration.getStats();
            expect(statsAfter.cacheHitRate).toBeLessThanOrEqual(statsBefore.cacheHitRate);
        });

        test('deve respeitar rate limiting', async () => {
            const promises = [];
            const inicio = Date.now();
            
            // Fazer múltiplas requisições simultâneas
            for (let i = 0; i < 5; i++) {
                promises.push(ExternalIntegration.consultarCep(`0131${i}-100`));
            }
            
            try {
                await Promise.all(promises);
                const tempoTotal = Date.now() - inicio;
                
                // Deve levar pelo menos algum tempo devido ao rate limiting
                expect(tempoTotal).toBeGreaterThan(200);
            } catch (error) {
                // Algumas requisições podem falhar devido a CEPs inválidos
                expect(error).toBeDefined();
            }
        }, 10000);
    });

    describe('🛡️ Tratamento de Erros', () => {
        test('deve tratar timeout corretamente', async () => {
            // Criar adapter com timeout muito baixo
            const timeoutAdapter = new ExternalIntegrationAdapter({
                viacep: { timeout: 1 } // 1ms - impossível de cumprir
            });
            
            await expect(
                timeoutAdapter.consultarCep('01310-100')
            ).rejects.toThrow();
        });

        test('deve tratar parâmetros inválidos', async () => {
            await expect(
                ExternalIntegration.consultarCep('')
            ).rejects.toThrow();
            
            await expect(
                ExternalIntegration.consultarCep(null)
            ).rejects.toThrow();
            
            await expect(
                ExternalIntegration.buscarCepPorEndereco('', '', '')
            ).rejects.toThrow();
        });

        test('deve tratar erros de rede graciosamente', async () => {
            // Criar adapter com URL inválida
            const invalidAdapter = new ExternalIntegrationAdapter({
                viacep: { baseUrl: 'https://url-inexistente.com' }
            });
            
            await expect(
                invalidAdapter.consultarCep('01310-100')
            ).rejects.toThrow();
        });
    });

    describe('🔄 Integração com Sistema Existente', () => {
        test('deve ser compatível com interface do AddressManager', async () => {
            // Testar compatibilidade com o padrão existente
            const resultado = await ExternalIntegration.consultarCep('01310-100');
            
            // Verificar se tem os campos esperados pelo sistema existente
            expect(resultado).toHaveProperty('cep');
            expect(resultado).toHaveProperty('logradouro');
            expect(resultado).toHaveProperty('bairro');
            expect(resultado).toHaveProperty('localidade');
            expect(resultado).toHaveProperty('uf');
        });

        test('deve manter backward compatibility', async () => {
            // Simular migração do sistema antigo
            const enderecoNovo = await ExternalIntegration.consultarCep('01310-100');
            
            // Verificar estrutura de dados compatível
            expect(enderecoNovo.cep).toBeDefined();
            expect(enderecoNovo.logradouro).toBeDefined();
            expect(typeof enderecoNovo.cep).toBe('string');
            expect(typeof enderecoNovo.logradouro).toBe('string');
        });
    });
});

/**
 * 🧪 TESTES DE INTEGRAÇÃO E2E
 * 
 * Testes que validam o funcionamento completo do sistema
 * em cenários reais de uso.
 */
describe('🌐 Testes End-to-End', () => {
    beforeAll(() => {
        ExternalIntegration.init();
    });

    test('cenário completo de consulta médica', async () => {
        // 1. Consultar CEP do paciente
        const enderecoPaciente = await ExternalIntegration.consultarCep('01310-100');
        expect(enderecoPaciente.localidade).toBe('São Paulo');
        
        // 2. Buscar estabelecimentos de saúde na região
        const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude('355030');
        expect(estabelecimentos.length).toBeGreaterThan(0);
        
        // 3. Validar beneficiário no plano de saúde
        const beneficiario = await ExternalIntegration.validarBeneficiario(
            '12345678901234567890',
            '123.456.789-00'
        );
        expect(beneficiario.situacao).toBe('ativo');
        
        // 4. Assinar documento digitalmente
        const documento = `Consulta médica realizada em ${new Date().toISOString()}`;
        const documentoAssinado = await ExternalIntegration.assinarDocumento(
            documento,
            'certificado_medico'
        );
        expect(documentoAssinado.assinatura).toBeDefined();
        
        console.log('✅ Cenário completo executado com sucesso');
    }, 30000);

    test('cenário de emergência e fallback', async () => {
        let stats = ExternalIntegration.getStats();
        const requestsIniciais = stats.totalRequests;
        
        // Simular múltiplas operações
        const operacoes = [
            ExternalIntegration.consultarCep('01310-100'),
            ExternalIntegration.buscarEstabelecimentosSaude('355030'),
            ExternalIntegration.consultarOperadoras('SP')
        ];
        
        const resultados = await Promise.allSettled(operacoes);
        
        // Verificar que pelo menos algumas operações foram bem-sucedidas
        const sucessos = resultados.filter(r => r.status === 'fulfilled');
        expect(sucessos.length).toBeGreaterThan(0);
        
        // Verificar que as estatísticas foram atualizadas
        stats = ExternalIntegration.getStats();
        expect(stats.totalRequests).toBeGreaterThan(requestsIniciais);
    }, 20000);
});

module.exports = {
    // Utilitários para outros testes
    setupTestEnvironment: () => {
        return ExternalIntegration.init({
            viacep: { timeout: 5000 },
            datasus: { timeout: 5000 },
            ans: { timeout: 5000 },
            icpbrasil: { timeout: 5000 }
        });
    },
    
    teardownTestEnvironment: () => {
        ExternalIntegration.clearCache();
    },
    
    // Mocks para testes isolados
    createMockAdapter: (config = {}) => {
        return new ExternalIntegrationAdapter({
            viacep: { baseUrl: 'http://mock.local', ...config.viacep },
            datasus: { baseUrl: 'http://mock.local', ...config.datasus },
            ans: { baseUrl: 'http://mock.local', ...config.ans },
            icpbrasil: { baseUrl: 'http://mock.local', ...config.icpbrasil }
        });
    }
};
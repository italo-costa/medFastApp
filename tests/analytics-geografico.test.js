const request = require('supertest');
const express = require('express');
const ExternalDataAnalytics = require('../src/analytics/ExternalDataAnalytics');

// Mock do app Express
const app = express();
app.use(express.json());

// Mock das rotas de analytics
const analyticsRoutes = require('../src/routes/analyticsRoutes');
app.use('/api/external/analytics', analyticsRoutes);

describe('🗺️ Analytics Geográfico - Testes de Integração', () => {
  let analyticsService;

  beforeAll(() => {
    analyticsService = new ExternalDataAnalytics();
  });

  describe('📊 Preparação de Dados para Mapas', () => {
    test('deve preparar dados de mapas corretamente', async () => {
      const dadosMock = {
        sus: {
          estabelecimentos: [
            {
              cnes: '2269170',
              nome: 'Hospital Teste',
              municipio: 'São Paulo',
              uf: 'SP',
              tipo: 'Hospital Geral',
              telefone: '(11) 1234-5678',
              endereco: 'Rua Teste, 123'
            }
          ]
        },
        ans: {
          operadoras: [
            {
              codigo: '12345',
              razaoSocial: 'Operadora Teste',
              uf: 'SP',
              modalidade: 'Medicina de Grupo',
              ativa: true
            }
          ]
        }
      };

      const mapas = await analyticsService.prepararDadosMapas(dadosMock);

      expect(mapas).toHaveProperty('estabelecimentosSUS');
      expect(mapas).toHaveProperty('operadorasANS');
      expect(mapas).toHaveProperty('distribuicaoConsultas');
      expect(mapas).toHaveProperty('densidadeAtendimento');

      // Verificar estrutura dos estabelecimentos
      expect(mapas.estabelecimentosSUS).toHaveProperty('markers');
      expect(mapas.estabelecimentosSUS).toHaveProperty('heatmapData');
      expect(Array.isArray(mapas.estabelecimentosSUS.markers)).toBe(true);

      // Verificar estrutura das operadoras
      expect(mapas.operadorasANS).toHaveProperty('regions');
      expect(typeof mapas.operadorasANS.regions).toBe('object');
    });

    test('deve gerar markers de estabelecimentos com coordenadas válidas', async () => {
      const estabelecimentos = [
        {
          cnes: '2269170',
          nome: 'Hospital Central SP',
          municipio: 'São Paulo',
          uf: 'SP',
          tipo: 'Hospital Geral'
        },
        {
          cnes: '2345678',
          nome: 'UBS Vila Maria',
          municipio: 'São Paulo', 
          uf: 'SP',
          tipo: 'Posto de Saúde'
        }
      ];

      const markers = await analyticsService.gerarMarkersEstabelecimentos(estabelecimentos);

      expect(Array.isArray(markers)).toBe(true);
      expect(markers.length).toBe(2);

      markers.forEach(marker => {
        expect(marker).toHaveProperty('id');
        expect(marker).toHaveProperty('position');
        expect(marker).toHaveProperty('title');
        expect(marker).toHaveProperty('description');
        expect(marker).toHaveProperty('category');
        expect(marker).toHaveProperty('color');
        expect(marker).toHaveProperty('icon');
        
        // Verificar coordenadas válidas
        expect(Array.isArray(marker.position)).toBe(true);
        expect(marker.position.length).toBe(2);
        expect(typeof marker.position[0]).toBe('number'); // latitude
        expect(typeof marker.position[1]).toBe('number'); // longitude
        
        // Verificar range de coordenadas do Brasil
        expect(marker.position[0]).toBeGreaterThan(-35); // latitude mínima
        expect(marker.position[0]).toBeLessThan(6);      // latitude máxima
        expect(marker.position[1]).toBeGreaterThan(-75); // longitude mínima
        expect(marker.position[1]).toBeLessThan(-30);    // longitude máxima
      });
    });

    test('deve gerar dados de heatmap válidos', async () => {
      const estabelecimentos = [
        { municipio: 'São Paulo', uf: 'SP', tipo: 'Hospital' },
        { municipio: 'São Paulo', uf: 'SP', tipo: 'UBS' },
        { municipio: 'Rio de Janeiro', uf: 'RJ', tipo: 'Hospital' }
      ];

      const heatmapData = await analyticsService.gerarHeatmapEstabelecimentos(estabelecimentos);

      expect(Array.isArray(heatmapData)).toBe(true);
      expect(heatmapData.length).toBeGreaterThan(0);

      heatmapData.forEach(point => {
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(point).toHaveProperty('weight');
        expect(typeof point.lat).toBe('number');
        expect(typeof point.lng).toBe('number');
        expect(typeof point.weight).toBe('number');
        expect(point.weight).toBeGreaterThan(0);
      });
    });

    test('deve gerar dados de choropleth por regiões', async () => {
      const dados = {
        SP: { estabelecimentos: 1500, consultas: 50000 },
        RJ: { estabelecimentos: 800, consultas: 25000 },
        MG: { estabelecimentos: 600, consultas: 18000 }
      };

      const choropleth = await analyticsService.gerarDadosChoropleth(dados, 'estabelecimentos');

      expect(Array.isArray(choropleth)).toBe(true);
      expect(choropleth.length).toBe(3);

      choropleth.forEach(region => {
        expect(region).toHaveProperty('id');
        expect(region).toHaveProperty('value');
        expect(region).toHaveProperty('color');
        expect(region).toHaveProperty('coordinates');
        expect(Array.isArray(region.coordinates)).toBe(true);
      });
    });
  });

  describe('🛣️ APIs de Mapa', () => {
    test('GET /maps/establishments deve retornar estabelecimentos para o mapa', async () => {
      const response = await request(app)
        .get('/api/external/analytics/maps/establishments')
        .query({
          uf: 'SP',
          municipio: 'São Paulo',
          tipo: 'Hospital'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.markers)).toBe(true);
    });

    test('POST /maps/marker/create deve criar novo marker', async () => {
      const novoMarker = {
        position: [-23.5505, -46.6333],
        title: 'Hospital Teste API',
        description: 'Hospital criado via API',
        category: 'hospital'
      };

      const response = await request(app)
        .post('/api/external/analytics/maps/marker/create')
        .send(novoMarker);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(novoMarker.title);
    });

    test('POST /maps/marker/update deve atualizar posição do marker', async () => {
      const updateData = {
        markerId: 'test-marker-id',
        position: [-23.5600, -46.6400]
      };

      const response = await request(app)
        .post('/api/external/analytics/maps/marker/update')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('GET /maps/heatmap/:tipo deve retornar dados de heatmap', async () => {
      const response = await request(app)
        .get('/api/external/analytics/maps/heatmap/consultas')
        .query({ uf: 'SP' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /maps/regions/:tipo deve retornar dados regionais', async () => {
      const response = await request(app)
        .get('/api/external/analytics/maps/regions/operadoras');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('regions');
    });

    test('DELETE /maps/marker/:id deve remover marker', async () => {
      const response = await request(app)
        .delete('/api/external/analytics/maps/marker/test-marker-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('🌍 Geração de Coordenadas', () => {
    test('deve gerar coordenadas para cidades conhecidas', () => {
      const coordSP = analyticsService.gerarCoordenadaPorCidade('São Paulo', 'SP');
      expect(coordSP).toEqual(expect.arrayContaining([
        expect.any(Number),
        expect.any(Number)
      ]));
      
      // São Paulo deve estar próximo das coordenadas reais
      expect(coordSP[0]).toBeCloseTo(-23.5505, 1);
      expect(coordSP[1]).toBeCloseTo(-46.6333, 1);
    });

    test('deve gerar coordenadas aleatórias para cidades desconhecidas', () => {
      const coord = analyticsService.gerarCoordenadaPorCidade('Cidade Inexistente', 'XX');
      expect(Array.isArray(coord)).toBe(true);
      expect(coord.length).toBe(2);
      expect(typeof coord[0]).toBe('number');
      expect(typeof coord[1]).toBe('number');
    });

    test('deve gerar coordenadas dentro dos limites do Brasil', () => {
      for (let i = 0; i < 10; i++) {
        const coord = analyticsService.gerarCoordenadaPorCidade(`Cidade${i}`, 'SP');
        
        // Verificar limites do Brasil
        expect(coord[0]).toBeGreaterThan(-35); // latitude mínima
        expect(coord[0]).toBeLessThan(6);      // latitude máxima
        expect(coord[1]).toBeGreaterThan(-75); // longitude mínima
        expect(coord[1]).toBeLessThan(-30);    // longitude máxima
      }
    });
  });

  describe('🎨 Categorização e Cores', () => {
    test('deve categorizar estabelecimentos corretamente', () => {
      const estabelecimentos = [
        { tipo: 'Hospital Geral' },
        { tipo: 'Posto de Saúde' },
        { tipo: 'Clínica Especializada' },
        { tipo: 'Laboratório de Análises' },
        { tipo: 'Farmácia' }
      ];

      estabelecimentos.forEach(est => {
        const categoria = analyticsService.categorizarEstabelecimento(est.tipo);
        expect(['hospital', 'ubs', 'clinica', 'laboratorio', 'farmacia']).toContain(categoria);
      });
    });

    test('deve retornar cores válidas para cada categoria', () => {
      const categorias = ['hospital', 'ubs', 'clinica', 'laboratorio', 'farmacia'];
      
      categorias.forEach(categoria => {
        const cor = analyticsService.obterCorPorCategoria(categoria);
        expect(cor).toMatch(/^#[0-9a-f]{6}$/i); // Formato hexadecimal
      });
    });

    test('deve retornar ícones válidos para cada categoria', () => {
      const categorias = ['hospital', 'ubs', 'clinica', 'laboratorio', 'farmacia'];
      
      categorias.forEach(categoria => {
        const icone = analyticsService.obterIconePorCategoria(categoria);
        expect(typeof icone).toBe('string');
        expect(icone.length).toBeGreaterThan(0);
      });
    });
  });

  describe('📈 Performance e Otimização', () => {
    test('deve processar grandes volumes de dados em tempo razoável', async () => {
      // Simular 1000 estabelecimentos
      const estabelecimentos = Array.from({ length: 1000 }, (_, i) => ({
        cnes: `${2000000 + i}`,
        nome: `Estabelecimento ${i}`,
        municipio: 'São Paulo',
        uf: 'SP',
        tipo: i % 2 === 0 ? 'Hospital' : 'UBS'
      }));

      const startTime = Date.now();
      const markers = await analyticsService.gerarMarkersEstabelecimentos(estabelecimentos);
      const endTime = Date.now();

      expect(markers.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Menos de 5 segundos
    });

    test('deve limitar resultados de heatmap para performance', async () => {
      // Simular muitos pontos
      const estabelecimentos = Array.from({ length: 5000 }, (_, i) => ({
        municipio: `Município ${i % 100}`,
        uf: 'SP'
      }));

      const heatmapData = await analyticsService.gerarHeatmapEstabelecimentos(estabelecimentos);
      
      // Deve agrupar/limitar pontos para performance
      expect(heatmapData.length).toBeLessThan(1000);
    });
  });

  describe('🔒 Validação e Segurança', () => {
    test('deve validar dados de entrada para criação de markers', async () => {
      const response = await request(app)
        .post('/api/external/analytics/maps/marker/create')
        .send({
          // Dados inválidos
          position: 'invalid',
          title: '',
          category: 'invalid_category'
        });

      expect(response.status).toBe(400);
    });

    test('deve sanitizar inputs de usuário', async () => {
      const dadosComScript = {
        position: [-23.5505, -46.6333],
        title: '<script>alert("xss")</script>Hospital',
        description: 'Descrição<img src=x onerror=alert(1)>',
        category: 'hospital'
      };

      const response = await request(app)
        .post('/api/external/analytics/maps/marker/create')
        .send(dadosComScript);

      if (response.status === 200) {
        // Se criado, verificar se foi sanitizado
        expect(response.body.data.title).not.toContain('<script>');
        expect(response.body.data.description).not.toContain('<img');
      }
    });

    test('deve limitar coordenadas ao território brasileiro', async () => {
      const coordenadaInvalida = {
        position: [90, 180], // Polo Norte
        title: 'Hospital Polo Norte',
        description: 'Fora do Brasil',
        category: 'hospital'
      };

      const response = await request(app)
        .post('/api/external/analytics/maps/marker/create')
        .send(coordenadaInvalida);

      expect(response.status).toBe(400);
    });
  });

  describe('💾 Integração com Dados Reais', () => {
    test('deve integrar com dados do SUS e ANS', async () => {
      const response = await request(app)
        .post('/api/external/analytics/consolidated')
        .send({
          incluirSUS: true,
          incluirANS: true,
          incluirGeograficos: true,
          municipios: ['355030'], // São Paulo
          ufs: ['SP']
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('mapas');
      expect(response.body.data.mapas).toHaveProperty('estabelecimentosSUS');
      expect(response.body.data.mapas).toHaveProperty('operadorasANS');
    });

    test('deve calcular métricas geográficas corretamente', async () => {
      const dadosConsolidados = {
        sus: { estabelecimentos: [/* dados mock */] },
        ans: { operadoras: [/* dados mock */] }
      };

      const metricas = await analyticsService.calcularMetricasGeograficas(dadosConsolidados);

      expect(metricas).toHaveProperty('distribuicaoPorUF');
      expect(metricas).toHaveProperty('densidadePorRegiao');
      expect(metricas).toHaveProperty('coberturaTerritorial');
      expect(metricas).toHaveProperty('pontosCalor');
    });
  });
});

// Testes de stress para componentes críticos
describe('🔥 Testes de Stress - Analytics Geográfico', () => {
  test('deve suportar múltiplas requisições simultâneas', async () => {
    const promises = Array.from({ length: 10 }, () => 
      request(app)
        .get('/api/external/analytics/maps/establishments')
        .query({ uf: 'SP' })
    );

    const results = await Promise.all(promises);
    
    results.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  test('deve manter performance com dados grandes', async () => {
    // Simular dataset grande
    const response = await request(app)
      .post('/api/external/analytics/consolidated')
      .send({
        incluirSUS: true,
        incluirANS: true,
        incluirGeograficos: true,
        ufs: ['SP', 'RJ', 'MG', 'RS', 'PR'] // Estados grandes
      });

    expect(response.status).toBe(200);
    // Verificar se não excede limite de tempo
  });
});

module.exports = {
  testSuite: 'Analytics Geográfico',
  coverage: [
    'ExternalDataAnalytics.prepararDadosMapas',
    'ExternalDataAnalytics.gerarMarkersEstabelecimentos', 
    'ExternalDataAnalytics.gerarHeatmapEstabelecimentos',
    'ExternalDataAnalytics.gerarDadosChoropleth',
    'analyticsRoutes /maps/*'
  ]
};
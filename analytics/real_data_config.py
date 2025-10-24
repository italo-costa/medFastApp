# 🔧 Configuração de Fontes de Dados Reais
# MedFast Analytics - Integração com APIs Governamentais

import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class APIConfig:
    """Configuração para APIs governamentais"""
    name: str
    base_url: str
    timeout: int = 30
    retry_attempts: int = 3
    rate_limit_per_minute: int = 60
    requires_auth: bool = False
    auth_token: Optional[str] = None
    cache_ttl_hours: int = 24
    
class RealDataSourcesConfig:
    """
    Configuração centralizada para todas as fontes de dados reais
    """
    
    def __init__(self):
        # APIs Governamentais Brasileiras
        self.apis = {
            'datasus': APIConfig(
                name='DATASUS - Ministério da Saúde',
                base_url='http://tabnet.datasus.gov.br',
                timeout=45,
                cache_ttl_hours=24,
                rate_limit_per_minute=30
            ),
            'ans': APIConfig(
                name='ANS - Agência Nacional de Saúde Suplementar',
                base_url='https://www.ans.gov.br/anstabnet',
                timeout=30,
                cache_ttl_hours=168,  # 7 dias
                rate_limit_per_minute=20
            ),
            'ibge': APIConfig(
                name='IBGE - Instituto Brasileiro de Geografia e Estatística',
                base_url='https://servicodados.ibge.gov.br/api',
                timeout=20,
                cache_ttl_hours=720,  # 30 dias
                rate_limit_per_minute=60
            ),
            'anatel': APIConfig(
                name='Anatel - Agência Nacional de Telecomunicações',
                base_url='https://sistemas.anatel.gov.br',
                timeout=30,
                cache_ttl_hours=168,  # 7 dias
                rate_limit_per_minute=15
            ),
            'cetic': APIConfig(
                name='CETIC.br - Centro Regional de Estudos TIC',
                base_url='https://cetic.br',
                timeout=25,
                cache_ttl_hours=8760,  # 1 ano
                rate_limit_per_minute=10
            )
        }
        
        # Configurações de conformidade LGPD
        self.compliance_config = {
            'data_retention_days': 730,  # 2 anos
            'anonymization_required': False,  # Dados públicos agregados
            'audit_logging': True,
            'encryption_in_transit': True,
            'allowed_purposes': [
                'ANALYTICAL_DASHBOARD',
                'PUBLIC_HEALTH_RESEARCH',
                'HEALTHCARE_PLANNING',
                'EPIDEMIOLOGICAL_SURVEILLANCE'
            ],
            'legal_basis': 'LEGITIMATE_INTEREST_PUBLIC_DATA'
        }
        
        # Mapeamento de municípios com códigos IBGE
        self.municipios_nordeste = {
            # Capitais
            'fortaleza': {'codigo_ibge': '2304400', 'uf': 'CE', 'tipo': 'capital'},
            'recife': {'codigo_ibge': '2611606', 'uf': 'PE', 'tipo': 'capital'},
            'salvador': {'codigo_ibge': '2927408', 'uf': 'BA', 'tipo': 'capital'},
            'sao_luis': {'codigo_ibge': '2111300', 'uf': 'MA', 'tipo': 'capital'},
            'teresina': {'codigo_ibge': '2211001', 'uf': 'PI', 'tipo': 'capital'},
            'natal': {'codigo_ibge': '2408102', 'uf': 'RN', 'tipo': 'capital'},
            'joao_pessoa': {'codigo_ibge': '2507507', 'uf': 'PB', 'tipo': 'capital'},
            'maceio': {'codigo_ibge': '2704302', 'uf': 'AL', 'tipo': 'capital'},
            'aracaju': {'codigo_ibge': '2800308', 'uf': 'SE', 'tipo': 'capital'},
            
            # Interior estratégico
            'caucaia': {'codigo_ibge': '2301000', 'uf': 'CE', 'tipo': 'interior'},
            'olinda': {'codigo_ibge': '2609600', 'uf': 'PE', 'tipo': 'interior'},
            'feira_de_santana': {'codigo_ibge': '2918001', 'uf': 'BA', 'tipo': 'interior'},
            'imperatriz': {'codigo_ibge': '2105302', 'uf': 'MA', 'tipo': 'interior'},
            'parnaiba': {'codigo_ibge': '2207702', 'uf': 'PI', 'tipo': 'interior'},
            'mossoro': {'codigo_ibge': '2403251', 'uf': 'RN', 'tipo': 'interior'},
            'campina_grande': {'codigo_ibge': '2504009', 'uf': 'PB', 'tipo': 'interior'},
            'arapiraca': {'codigo_ibge': '2700102', 'uf': 'AL', 'tipo': 'interior'},
            'nossa_senhora_do_socorro': {'codigo_ibge': '2801009', 'uf': 'SE', 'tipo': 'interior'}
        }
        
        # Endpoints específicos por indicador
        self.indicator_endpoints = {
            'ocupacao_hospitalar': {
                'source': 'datasus',
                'endpoint': '/cgi/tabcgi.exe?sih/cnv/niuf.def',
                'method': 'POST',
                'description': 'Taxa de ocupação hospitalar por município'
            },
            'penetracao_planos': {
                'source': 'ans',
                'endpoint': '/cgi-bin/dh?dados/tabnet_br.def',
                'method': 'GET',
                'description': 'Beneficiários de planos de saúde por município'
            },
            'dados_demograficos': {
                'source': 'ibge',
                'endpoint': '/v3/agregados/6579/periodos/2022/variaveis/9324',
                'method': 'GET',
                'description': 'População por município'
            },
            'conectividade': {
                'source': 'anatel',
                'endpoint': '/stel/consultas/ListaEstacoesEnlaces/tela.asp',
                'method': 'GET',
                'description': 'Dados de conectividade por município'
            }
        }
        
        # Configurações de cache e performance
        self.cache_config = {
            'enabled': True,
            'backend': 'memory',  # 'memory', 'redis', 'file'
            'max_size_mb': 100,
            'cleanup_interval_minutes': 60
        }
        
        # Configurações de fallback
        self.fallback_config = {
            'use_simulated_data': True,
            'simulation_quality': 'high',  # 'basic', 'medium', 'high'
            'apply_noise': True,
            'seasonal_variation': True,
            'correlation_preservation': True
        }
        
    def get_api_config(self, source: str) -> Optional[APIConfig]:
        """Retorna configuração de uma API específica"""
        return self.apis.get(source.lower())
    
    def get_municipality_code(self, municipality_name: str) -> Optional[str]:
        """Retorna código IBGE de um município"""
        key = municipality_name.lower().replace(' ', '_').replace('ã', 'a').replace('ç', 'c')
        return self.municipios_nordeste.get(key, {}).get('codigo_ibge')
    
    def get_all_municipality_codes(self) -> List[str]:
        """Retorna todos os códigos IBGE dos municípios"""
        return [info['codigo_ibge'] for info in self.municipios_nordeste.values()]
    
    def get_municipalities_by_type(self, tipo: str) -> Dict[str, Dict]:
        """Retorna municípios filtrados por tipo"""
        return {k: v for k, v in self.municipios_nordeste.items() if v['tipo'] == tipo}
    
    def is_cache_valid(self, source: str, last_update: datetime) -> bool:
        """Verifica se o cache ainda é válido para uma fonte"""
        api_config = self.get_api_config(source)
        if not api_config:
            return False
        
        cache_expiry = last_update + timedelta(hours=api_config.cache_ttl_hours)
        return datetime.now() < cache_expiry
    
    def get_compliance_headers(self) -> Dict[str, str]:
        """Retorna headers para conformidade LGPD"""
        return {
            'X-Data-Purpose': 'PUBLIC_HEALTH_ANALYTICS',
            'X-Legal-Basis': self.compliance_config['legal_basis'],
            'X-Retention-Days': str(self.compliance_config['data_retention_days']),
            'X-Analytics-Version': '1.0'
        }
    
    def validate_data_access(self, purpose: str) -> bool:
        """Valida se o propósito de acesso aos dados é permitido"""
        return purpose in self.compliance_config['allowed_purposes']
    
    def get_rate_limit(self, source: str) -> int:
        """Retorna limite de rate para uma fonte"""
        api_config = self.get_api_config(source)
        return api_config.rate_limit_per_minute if api_config else 10

# Instância global da configuração
real_data_config = RealDataSourcesConfig()

# Validações de ambiente
def validate_environment():
    """
    Valida ambiente para integração com dados reais
    """
    validation_results = {
        'internet_connection': False,
        'api_access': {},
        'compliance_ready': False,
        'cache_available': False
    }
    
    # Testar conectividade básica
    try:
        import requests
        response = requests.get('https://httpbin.org/status/200', timeout=5)
        validation_results['internet_connection'] = response.status_code == 200
    except Exception:
        validation_results['internet_connection'] = False
    
    # Testar acesso às APIs principais
    for source, config in real_data_config.apis.items():
        try:
            if validation_results['internet_connection']:
                # Teste básico de conectividade com a API
                import requests
                response = requests.head(config.base_url, timeout=5)
                validation_results['api_access'][source] = response.status_code < 400
            else:
                validation_results['api_access'][source] = False
        except Exception:
            validation_results['api_access'][source] = False
    
    # Verificar conformidade LGPD
    validation_results['compliance_ready'] = all([
        real_data_config.compliance_config['audit_logging'],
        real_data_config.compliance_config['encryption_in_transit'],
        len(real_data_config.compliance_config['allowed_purposes']) > 0
    ])
    
    # Verificar cache
    validation_results['cache_available'] = real_data_config.cache_config['enabled']
    
    return validation_results

def print_validation_report():
    """
    Imprime relatório de validação do ambiente
    """
    results = validate_environment()
    
    print("🔍 VALIDAÇÃO DO AMBIENTE DE DADOS REAIS")
    print("=" * 50)
    
    # Conectividade
    status = "✅" if results['internet_connection'] else "❌"
    print(f"{status} Conectividade com internet")
    
    # APIs
    print(f"\n📡 Status das APIs:")
    for source, available in results['api_access'].items():
        status = "✅" if available else "❌"
        api_name = real_data_config.apis[source].name
        print(f"  {status} {source.upper()}: {api_name}")
    
    # Conformidade
    status = "✅" if results['compliance_ready'] else "❌"
    print(f"\n🛡️ {status} Conformidade LGPD")
    
    # Cache
    status = "✅" if results['cache_available'] else "❌"
    print(f"💾 {status} Sistema de cache")
    
    # Resumo
    total_apis = len(results['api_access'])
    working_apis = sum(results['api_access'].values())
    
    print(f"\n📊 RESUMO:")
    print(f"  APIs funcionais: {working_apis}/{total_apis}")
    print(f"  Municípios configurados: {len(real_data_config.municipios_nordeste)}")
    print(f"  Indicadores disponíveis: {len(real_data_config.indicator_endpoints)}")
    
    if working_apis == 0:
        print(f"\n⚠️ ATENÇÃO: Nenhuma API disponível")
        print(f"💡 Sistema funcionará com dados simulados realísticos")
    elif working_apis < total_apis:
        print(f"\n⚠️ ATENÇÃO: Algumas APIs indisponíveis")
        print(f"💡 Dados faltantes serão complementados com simulação")
    else:
        print(f"\n✅ SISTEMA PRONTO: Todas as APIs disponíveis")

if __name__ == "__main__":
    print_validation_report()
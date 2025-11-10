# 🚀 MediApp - Infraestrutura e Deploy

Esta pasta contém todos os arquivos necessários para deploy e gerenciamento da infraestrutura do MediApp.

## 📁 Estrutura da Infraestrutura

```
infra-deploy/
├── docker/              # Containers Docker
│   ├── Dockerfile        # Backend container
│   ├── docker-compose.yml
│   └── nginx/           # Proxy reverso
├── kubernetes/          # Orchestração K8s
│   ├── deployments/     # Deployments
│   ├── services/        # Services
│   └── ingress/         # Ingress rules
├── terraform/           # Infrastructure as Code
│   ├── aws/            # Recursos AWS
│   ├── gcp/            # Recursos Google Cloud
│   └── azure/          # Recursos Azure
└── scripts/            # Scripts de automação
    ├── deploy.sh       # Deploy principal
    ├── backup.sh       # Backup automatizado
    └── monitoring.sh   # Monitoramento
```

## 🐳 Deploy com Docker

```bash
# Build e execução local
cd docker/
docker-compose up -d

# Deploy em produção
./scripts/deploy.sh production
```

## ☸️ Deploy com Kubernetes

```bash
# Apply configurações
kubectl apply -f kubernetes/

# Verificar status
kubectl get pods -n mediapp
```

## 🏗️ Infraestrutura com Terraform

```bash
# AWS
cd terraform/aws/
terraform init
terraform plan
terraform apply

# Google Cloud
cd terraform/gcp/
terraform init
terraform apply
```

## 🔧 Ambientes Suportados

- **Development**: Docker local + PostgreSQL
- **Staging**: Kubernetes + RDS
- **Production**: AWS/GCP + Load Balancer + Auto Scaling

## 📊 Monitoramento

- **Logs**: Centralizados via ELK Stack
- **Métricas**: Prometheus + Grafana  
- **Health Checks**: Automated via K8s
- **Backups**: Automatizados diários

## 🔒 Segurança

- SSL/TLS terminado no Load Balancer
- Secrets gerenciados via Kubernetes Secrets
- Network policies implementadas
- WAF configurado

---
**MediApp v3.0.0** | Infrastructure as Code  
🏗️ Deploy automatizado e escalável
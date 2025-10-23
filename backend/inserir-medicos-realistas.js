#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Dados realistas para médicos brasileiros
const medicosRealistas = [
  {
    nome: "Dr. Carlos Eduardo Silva",
    email: "carlos.silva@medifast.com",
    crm: "12345",
    crm_uf: "SP",
    especialidade: "Cardiologia",
    telefone: "(11) 3456-7890",
    celular: "(11) 98765-4321",
    endereco: "Rua das Palmeiras, 123 - Vila Madalena, São Paulo - SP",
    formacao: "Medicina pela USP, Residência em Cardiologia - InCor",
    experiencia: "15 anos de experiência em cardiologia clínica e intervencionista",
    horario_atendimento: "Segunda a Sexta: 8h às 18h"
  },
  {
    nome: "Dra. Ana Beatriz Santos",
    email: "ana.santos@medifast.com",
    crm: "23456",
    crm_uf: "RJ",
    especialidade: "Pediatria",
    telefone: "(21) 2345-6789",
    celular: "(21) 99876-5432",
    endereco: "Av. Atlântica, 456 - Copacabana, Rio de Janeiro - RJ",
    formacao: "Medicina pela UFRJ, Especialização em Pediatria - UERJ",
    experiencia: "12 anos dedicados ao cuidado infantil e adolescente",
    horario_atendimento: "Segunda a Sábado: 7h às 17h"
  },
  {
    nome: "Dr. João Pedro Oliveira",
    email: "joao.oliveira@medifast.com",
    crm: "34567",
    crm_uf: "MG",
    especialidade: "Ortopedia",
    telefone: "(31) 3234-5678",
    celular: "(31) 99765-4321",
    endereco: "Rua da Bahia, 789 - Centro, Belo Horizonte - MG",
    formacao: "Medicina pela UFMG, Residência em Ortopedia - Hospital das Clínicas",
    experiencia: "20 anos em cirurgias ortopédicas e traumatologia",
    horario_atendimento: "Segunda a Quinta: 8h às 16h"
  },
  {
    nome: "Dra. Mariana Costa Lima",
    email: "mariana.lima@medifast.com",
    crm: "45678",
    crm_uf: "RS",
    especialidade: "Ginecologia e Obstetrícia",
    telefone: "(51) 3345-6789",
    celular: "(51) 98654-3210",
    endereco: "Rua Independência, 321 - Centro, Porto Alegre - RS",
    formacao: "Medicina pela UFRGS, Especialização em Ginecologia - Hospital de Clínicas",
    experiencia: "18 anos em saúde da mulher e acompanhamento pré-natal",
    horario_atendimento: "Segunda a Sexta: 9h às 19h"
  },
  {
    nome: "Dr. Ricardo Mendes Alves",
    email: "ricardo.alves@medifast.com",
    crm: "56789",
    crm_uf: "BA",
    especialidade: "Neurologia",
    telefone: "(71) 3456-7890",
    celular: "(71) 99543-2109",
    endereco: "Av. Tancredo Neves, 654 - Caminho das Árvores, Salvador - BA",
    formacao: "Medicina pela UFBA, Fellowship em Neurologia - Hospital Sarah",
    experiencia: "14 anos em neurologia clínica e diagnóstico por imagem",
    horario_atendimento: "Terça a Sábado: 8h às 17h"
  },
  {
    nome: "Dra. Fernanda Rodrigues",
    email: "fernanda.rodrigues@medifast.com",
    crm: "67890",
    crm_uf: "PR",
    especialidade: "Dermatologia",
    telefone: "(41) 3567-8901",
    celular: "(41) 98432-1098",
    endereco: "Rua XV de Novembro, 987 - Centro, Curitiba - PR",
    formacao: "Medicina pela UFPR, Residência em Dermatologia - Hospital Evangélico",
    experiencia: "10 anos em dermatologia clínica e cirúrgica",
    horario_atendimento: "Segunda a Sexta: 8h às 18h, Sábados: 8h às 12h"
  },
  {
    nome: "Dr. Paulo Henrique Santos",
    email: "paulo.santos@medifast.com",
    crm: "78901",
    crm_uf: "DF",
    especialidade: "Psiquiatria",
    telefone: "(61) 3678-9012",
    celular: "(61) 99321-0987",
    endereco: "SQN 408, Bloco A - Asa Norte, Brasília - DF",
    formacao: "Medicina pela UnB, Residência em Psiquiatria - HBDF",
    experiencia: "16 anos em saúde mental e psicoterapia",
    horario_atendimento: "Segunda a Sexta: 10h às 20h"
  },
  {
    nome: "Dra. Luciana Ferreira",
    email: "luciana.ferreira@medifast.com",
    crm: "89012",
    crm_uf: "SC",
    especialidade: "Endocrinologia",
    telefone: "(48) 3789-0123",
    celular: "(48) 98210-9876",
    endereco: "Rua Felipe Schmidt, 234 - Centro, Florianópolis - SC",
    formacao: "Medicina pela UFSC, Especialização em Endocrinologia - HU-UFSC",
    experiencia: "13 anos em diabetes, obesidade e distúrbios hormonais",
    horario_atendimento: "Segunda a Quinta: 8h às 17h, Sextas: 8h às 14h"
  },
  {
    nome: "Dr. André Luiz Pereira",
    email: "andre.pereira@medifast.com",
    crm: "90123",
    crm_uf: "GO",
    especialidade: "Urologia",
    telefone: "(62) 3890-1234",
    celular: "(62) 99109-8765",
    endereco: "Av. T-4, 567 - Setor Bueno, Goiânia - GO",
    formacao: "Medicina pela UFG, Residência em Urologia - HC-UFG",
    experiencia: "11 anos em urologia geral e oncológica",
    horario_atendimento: "Segunda a Sexta: 7h às 16h"
  },
  {
    nome: "Dra. Gabriela Mota Silva",
    email: "gabriela.silva@medifast.com",
    crm: "01234",
    crm_uf: "CE",
    especialidade: "Oftalmologia",
    telefone: "(85) 3901-2345",
    celular: "(85) 98098-7654",
    endereco: "Rua Monsenhor Tabosa, 876 - Iracema, Fortaleza - CE",
    formacao: "Medicina pela UFC, Fellowship em Retina - Hospital de Olhos de Pernambuco",
    experiencia: "9 anos em oftalmologia clínica e cirúrgica",
    horario_atendimento: "Segunda a Sexta: 8h às 18h, Sábados: 8h às 12h"
  }
];

async function inserirMedicos() {
  console.log('🏥 INSERINDO 10 MÉDICOS REALISTAS NO BANCO DE DADOS\n');

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < medicosRealistas.length; i++) {
    const medico = medicosRealistas[i];
    
    try {
      console.log(`📋 Inserindo: ${medico.nome} (CRM: ${medico.crm}/${medico.crm_uf})`);
      
      // Verificar se já existe
      const emailExiste = await prisma.usuario.findUnique({
        where: { email: medico.email }
      });
      
      const crmExiste = await prisma.medico.findUnique({
        where: { crm: medico.crm }
      });
      
      if (emailExiste) {
        console.log(`   ⚠️  Email já existe, pulando...`);
        continue;
      }
      
      if (crmExiste) {
        console.log(`   ⚠️  CRM já existe, pulando...`);
        continue;
      }

      // Criptografar senha padrão
      const senhaHash = await bcrypt.hash('medico123', 12);

      // Inserir em transação
      const resultado = await prisma.$transaction(async (prismaTransaction) => {
        // Criar usuário
        const usuario = await prismaTransaction.usuario.create({
          data: {
            nome: medico.nome,
            email: medico.email,
            senha: senhaHash,
            tipo: 'MEDICO'
          }
        });

        // Criar médico
        const novoMedico = await prismaTransaction.medico.create({
          data: {
            usuario_id: usuario.id,
            crm: medico.crm,
            crm_uf: medico.crm_uf,
            especialidade: medico.especialidade,
            telefone: medico.telefone,
            celular: medico.celular,
            endereco: medico.endereco,
            formacao: medico.formacao,
            experiencia: medico.experiencia,
            horario_atendimento: medico.horario_atendimento
          }
        });

        return { usuario, medico: novoMedico };
      });

      console.log(`   ✅ Inserido com sucesso! ID: ${resultado.medico.id}`);
      sucessos++;

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      erros++;
    }
    
    console.log(''); // Linha em branco
  }

  console.log('📊 RESULTADO FINAL:');
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📋 Total processado: ${sucessos + erros}`);

  // Mostrar estatísticas finais
  if (sucessos > 0) {
    const totalMedicos = await prisma.medico.count();
    const especialidades = await prisma.medico.groupBy({
      by: ['especialidade'],
      _count: { especialidade: true }
    });

    console.log('\n📈 ESTATÍSTICAS DO BANCO:');
    console.log(`   👨‍⚕️ Total de médicos: ${totalMedicos}`);
    console.log('   🏥 Especialidades cadastradas:');
    
    especialidades.forEach(esp => {
      console.log(`      - ${esp.especialidade}: ${esp._count.especialidade} médico(s)`);
    });
  }
}

async function main() {
  try {
    await inserirMedicos();
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com banco encerrada.');
  }
}

// Executar
main();
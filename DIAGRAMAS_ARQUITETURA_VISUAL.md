```mermaid
graph TB
    subgraph "🏥 MediApp - Arquitetura Atual"
        subgraph "🌐 PRESENTATION LAYER"
            A[📱 Web Interface<br/>HTML5/CSS3/JavaScript] 
            A --> A1[gestao-medicos.html]
            A --> A2[gestao-pacientes.html] 
            A --> A3[prontuarios.html]
            A --> A4[analytics-mapas.html]
            
            B[📱 Mobile App<br/>React Native]
            B --> B1[src/screens/]
            B --> B2[src/components/]
            B --> B3[src/services/api.ts]
        end
        
        subgraph "🔗 API LAYER"
            C[🛡️ Express.js Server<br/>PORT: 3001/3002]
            C --> C1[robust-server.js<br/>Produção Estável]
            C --> C2[src/server.js<br/>Desenvolvimento]
            C --> C3[real-data-server.js<br/>Dados Reais]
            
            D[📋 API Routes]
            D --> D1[/api/medicos/*<br/>CRUD Médicos]
            D --> D2[/api/pacientes/*<br/>CRUD Pacientes]
            D --> D3[/api/records/*<br/>Prontuários]
            D --> D4[/api/exams/*<br/>Exames]
            D --> D5[/api/auth/*<br/>Autenticação]
            D --> D6[/api/analytics/*<br/>Dashboard]
        end
        
        subgraph "🧠 BUSINESS LAYER"
            E[🔧 Prisma ORM + Business Logic]
            E --> E1[src/services/<br/>Lógica de Negócio]
            E --> E2[src/middleware/<br/>Validações]
            E --> E3[src/utils/<br/>Utilitários]
            E --> E4[prisma/schema.prisma<br/>Modelo de Dados]
        end
        
        subgraph "💾 DATA LAYER"
            F[🗄️ PostgreSQL Database<br/>PORT: 5432]
            F --> F1[Tables: usuarios, medicos,<br/>pacientes, prontuarios, exames]
            F --> F2[Constraints & Indexes]
            F --> F3[Stored Procedures & Views]
        end
    end
    
    %% Connections
    A -.->|fetch('/api/medicos')| C
    B -.->|axios.get('/api/patients')| C
    C -->|Express Routes| D
    D -->|Business Logic| E
    E -->|Prisma ORM| F
    
    %% External Services
    G[🌐 ViaCEP API<br/>Endereços]
    H[📊 IBGE API<br/>Dados Geográficos]
    
    D6 -.->|HTTP Requests| G
    D6 -.->|HTTP Requests| H
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class A,A1,A2,A3,A4,B,B1,B2,B3 frontend
    class C,C1,C2,C3,D,D1,D2,D3,D4,D5,D6,E,E1,E2,E3,E4 backend
    class F,F1,F2,F3 database
    class G,H external
```

## 🔄 **FLUXO DE COMUNICAÇÃO ATUAL**

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant F as 🌐 Frontend
    participant A as 🔗 API Layer
    participant B as 🧠 Business Layer
    participant D as 💾 Database
    
    U->>F: 1. Clica "Listar Médicos"
    F->>A: 2. fetch('/api/medicos')
    A->>A: 3. Middleware (CORS, Auth, Validation)
    A->>B: 4. Call medicoService.getAll()
    B->>D: 5. Prisma Query
    D-->>B: 6. Result Set
    B-->>A: 7. Formatted Data
    A-->>F: 8. JSON Response
    F->>F: 9. Update DOM
    F-->>U: 10. Render Table
```

## 📊 **COMPARAÇÃO DE ARQUITETURAS**

```mermaid
graph LR
    subgraph "🏢 MONOLÍTICA (ATUAL)"
        M1[Frontend] --> M2[Backend] --> M3[Database]
        M4[✅ Simples<br/>✅ Rápido<br/>⚠️ Scaling limitado]
    end
    
    subgraph "📡 MICROSERVIÇOS"
        MS1[Frontend] --> MS2[Gateway]
        MS2 --> MS3[Service 1]
        MS2 --> MS4[Service 2] 
        MS2 --> MS5[Service 3]
        MS3 --> MS6[DB1]
        MS4 --> MS7[DB2]
        MS5 --> MS8[DB3]
        MS9[⚡ Escalável<br/>⚠️ Complexo<br/>⚠️ Latência]
    end
    
    subgraph "☁️ SERVERLESS"
        S1[Frontend] --> S2[CDN]
        S2 --> S3[API Gateway]
        S3 --> S4[Lambda 1]
        S3 --> S5[Lambda 2]
        S4 --> S6[Database]
        S5 --> S6
        S7[💰 Pay-per-use<br/>⚡ Auto-scale<br/>⚠️ Cold start]
    end
```
export interface Example {
    name: string;
    description: string;
    format: string;
    category: string;
    code: string;
}

export const EXAMPLES: Example[] = [
    {
        name: 'Simple Flowchart',
        description: 'Basic flowchart with decision node',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`,
    },
    {
        name: 'User Authentication',
        description: 'Login flow with validation',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart TD
    A[User] --> B[Login Page]
    B --> C{Valid Credentials?}
    C -->|Yes| D[Dashboard]
    C -->|No| E[Error Message]
    E --> B
    D --> F[Logout]
    F --> B`,
    },
    {
        name: 'CI/CD Pipeline',
        description: 'Continuous integration workflow',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart LR
    A[Code Push] --> B[Build]
    B --> C[Test]
    C --> D{Tests Pass?}
    D -->|Yes| E[Deploy Staging]
    D -->|No| F[Notify Developer]
    E --> G{QA Approved?}
    G -->|Yes| H[Deploy Production]
    G -->|No| F`,
    },
    {
        name: 'Database Schema',
        description: 'Simple database relationships',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart TB
    subgraph Database
        A[(Users)]
        B[(Orders)]
        C[(Products)]
    end
    A --> B
    B --> C
    C --> A`,
    },
    {
        name: 'Microservices',
        description: 'Service architecture diagram',
        format: 'mermaid',
        category: 'Architecture',
        code: `flowchart TB
    subgraph Frontend
        A[Web App]
        B[Mobile App]
    end
    
    subgraph API Gateway
        C[Gateway]
    end
    
    subgraph Services
        D[Auth Service]
        E[User Service]
        F[Order Service]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F`,
    },
    {
        name: 'State Machine',
        description: 'Order status transitions',
        format: 'mermaid',
        category: 'State',
        code: `flowchart LR
    A((New)) --> B((Processing))
    B --> C((Shipped))
    C --> D((Delivered))
    B --> E((Cancelled))
    A --> E`,
    },
    {
        name: 'Decision Tree',
        description: 'Complex decision flow',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart TD
    A{Is it raining?}
    A -->|Yes| B{Have umbrella?}
    A -->|No| C[Go outside]
    B -->|Yes| D[Use umbrella]
    B -->|No| E{Is it heavy rain?}
    E -->|Yes| F[Stay inside]
    E -->|No| G[Run quickly]
    D --> C`,
    },
    {
        name: 'API Request Flow',
        description: 'HTTP request lifecycle',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart LR
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D{Cache Hit?}
    D -->|Yes| E[Return Cached]
    D -->|No| F[(Database)]
    F --> G[Process Data]
    G --> H[Update Cache]
    H --> I[Return Response]
    E --> I
    I --> A`,
    },
    {
        name: 'Git Workflow',
        description: 'Feature branch workflow',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart LR
    A[main] --> B[feature branch]
    B --> C[Develop]
    C --> D[Commit]
    D --> E[Push]
    E --> F[Pull Request]
    F --> G{Review OK?}
    G -->|Yes| H[Merge]
    G -->|No| C
    H --> A`,
    },
    {
        name: 'Error Handling',
        description: 'Try-catch flow',
        format: 'mermaid',
        category: 'Flowchart',
        code: `flowchart TD
    A[Start] --> B[Try Block]
    B --> C{Error?}
    C -->|Yes| D[Catch Block]
    C -->|No| E[Continue]
    D --> F{Recoverable?}
    F -->|Yes| G[Retry]
    F -->|No| H[Log Error]
    G --> B
    H --> I[End]
    E --> I`,
    },
];

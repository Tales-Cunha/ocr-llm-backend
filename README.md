# OCR-LLM Backend

## Descrição

Este é o backend do projeto OCR-LLM, responsável pelo upload, processamento de OCR e interação com documentos utilizando modelos de linguagem. Desenvolvido com NestJS e Prisma, integra serviços como Tesseract.js para reconhecimento óptico de caracteres e GeminiService para geração de respostas baseadas em LLM.

## Objetivo

O objetivo deste backend é permitir que usuários façam upload de documentos (PDF, JPEG, PNG), extraiam texto desses documentos através de OCR, e interajam com o conteúdo extraído utilizando perguntas baseadas em linguagem natural. Além disso, gerencia o armazenamento de documentos e suas interações com o usuário.

## Tecnologias Utilizadas

- **Node.js**
- **NestJS**
- **Prisma**
- **Tesseract.js**
- **pdf-parse**
- **GeminiService**

## Configuração e Execução Local

### Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **npm** ou **yarn**
- **Banco de Dados** (PostgreSQL recomendado)
- **Git**

### Passos para Configuração

1. **Clone o Repositório**

    ```bash
    git clone https://github.com/seu-usuario/ocr-llm-backend.git
    cd ocr-llm-backend
    ```

2. **Instale as Dependências**

    Utilizando npm:

    ```bash
    npm install
    ```

    Ou utilizando yarn:

    ```bash
    yarn install
    ```

3. **Configure as Variáveis de Ambiente**

    Crie um arquivo `.env` na raiz do projeto baseado no arquivo de exemplo `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Edite o arquivo `.env` e configure as variáveis necessárias:

    ```env
    DATABASE_URL=postgresql://usuario:senha@localhost:5432/seu_banco
    GEMINI_SERVICE_API_KEY=sua_api_key
    PORT=3000
    ```

4. **Configure o Banco de Dados**

    Execute as migrações do Prisma para configurar o esquema do banco de dados:

    ```bash
    npx prisma migrate dev --name inicial
    ```

5. **Inicie o Servidor em Ambiente de Desenvolvimento**

    Utilizando npm:

    ```bash
    npm run start:dev
    ```

    Ou utilizando yarn:

    ```bash
    yarn start:dev
    ```

6. **Acesse a API**

    O servidor estará rodando em `http://localhost:3000`. Consulte [Documentação da API](./API.md) para detalhes sobre os endpoints disponíveis.

## Scripts Úteis

- **Iniciar o Servidor em Desenvolvimento**

    ```bash
    npm run start:dev
    ```

- **Construir o Projeto**

    ```bash
    npm run build
    ```

- **Executar Migrações do Prisma**

    ```bash
    npx prisma migrate dev
    ```

- **Gerar Client do Prisma**

    ```bash
    npx prisma generate
    ```

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou envie um pull request para melhorias e correções.

## Licença

Este projeto está licenciado sob a licença MIT.
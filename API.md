# Documentação da API

## Visão Geral

A API permite o upload, processamento e interação com documentos utilizando OCR e modelos de linguagem natural. Os principais recursos incluem fazer upload de documentos, consultar documentos com perguntas, verificar o status do processamento, baixar documentos e gerenciar documentos.

## URL Base
http://localhost:3000

## Endpoints

### 1. Upload de Documento

**Endpoint:** `POST /documents/upload`

**Descrição:** Faz o upload de um documento para um usuário.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Form Data:**
  - `userId` (string): ID do usuário.
  - `file` (file): Arquivo a ser enviado (PDF, JPEG, PNG).

- **Respostas:**
  - **201 Created** – Documento carregado com sucesso.
  - **400 Bad Request** – Arquivo inválido ou formato não suportado.
  - **404 Not Found** – Usuário não encontrado.

### 2. Obter Documentos do Usuário

**Endpoint:** `GET /documents/user/{userId}`

**Descrição:** Recupera todos os documentos de um usuário.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Parâmetros de Caminho:**
  - `userId` (string): ID do usuário.

- **Respostas:**
  - **200 OK** – Retorna uma lista de documentos.
  - **404 Not Found** – Usuário não encontrado.

### 3. Obter Documento por ID

**Endpoint:** `GET /documents/{documentId}`

**Descrição:** Recupera um documento específico por ID para um usuário.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Parâmetros de Caminho:**
  - `documentId` (string): ID do documento.

- **Respostas:**
  - **200 OK** – Retorna o documento.
  - **403 Forbidden** – Acesso negado.
  - **404 Not Found** – Documento não encontrado.

### 4. Consultar Documento

**Endpoint:** `POST /documents/query`

**Descrição:** Consulta um documento com uma pergunta específica.

- **Headers:**
  - `Authorization`: `Bearer {token}`
  - `Content-Type`: `application/json`

- **Corpo da Requisição:**

  ```json
  {
    "userId": "string",
    "documentId": "string",
    "question": "string"
  }

**Respostas:**

- **200 OK** – Retorna a resposta gerada.
- **400 Bad Request** – Texto OCR não extraído.
- **403 Forbidden** – Acesso negado.
- **404 Not Found** – Documento não encontrado.

### 5. Obter Status do Documento

**Endpoint:** `GET /documents/{documentId}/status`

**Descrição:** Obtém o status de processamento de um documento.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Parâmetros de Caminho:**
  - `documentId` (string): ID do documento.

- **Respostas:**
  - **200 OK** – Retorna o status do documento.
  - **403 Forbidden** – Acesso negado.
  - **404 Not Found** – Documento não encontrado.

### 6. Deletar Documento

**Endpoint:** `DELETE /documents/{documentId}`

**Descrição:** Deleta um documento.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Parâmetros de Caminho:**
  - `documentId` (string): ID do documento.

- **Respostas:**
  - **200 OK** – Documento deletado.
  - **403 Forbidden** – Acesso negado.
  - **404 Not Found** – Documento não encontrado.

### 7. Baixar Documento

**Endpoint:** `GET /documents/{documentId}/download`

**Descrição:** Permite baixar o arquivo de um documento específico.

- **Headers:**
  - `Authorization`: `Bearer {token}`

- **Parâmetros de Caminho:**
  - `documentId` (string): ID do documento.

- **Respostas:**
  - **200 OK** – Retorna o arquivo do documento para download.
  - **403 Forbidden** – Acesso negado.
  - **404 Not Found** – Documento não encontrado.
  - **500 Internal Server Error** – Erro ao processar o download do documento.

---

## Modelos de Dados

### Documento

  ```json
  {
    "id": "string",
    "userId": "string",
    "filename": "string",
    "fileData": "Buffer",
    "status": "string", // PENDING, PROCESSING, COMPLETED, FAILED
    "ocrText": "string",
    "llmInteractions": [ /* array of LLMInteraction */ ]
    }
  ```
### LLMInteraction


  ```json
  {
    "id": "string",
    "documentId": "string",
    "question": "string",
    "answer": "string",
    "createdAt": "DateTime"
    }
  ```
## Autenticação

A API utiliza autenticação via token JWT (JSON Web Token). Todos os endpoints protegidos exigem que o token de autenticação seja incluído no header `Authorization` de cada requisição.

### Obtenção do Token

Para interagir com a API, o usuário deve autenticar-se através dos endpoints de autenticação (não detalhados aqui) para obter um token JWT válido.

### Inclusão do Token nas Requisições

Inclua o token JWT no header `Authorization` em todas as requisições protegidas, seguindo o formato abaixo:

* Authorization: Bearer {seu_token_jwt}

### Renovação do Token

Tokens JWT possuem um tempo de expiração. Certifique-se de renovar o token conforme necessário para manter o acesso contínuo aos endpoints protegidos.

---

## Códigos de Status HTTP

- **200 OK**: A solicitação foi bem-sucedida.
- **201 Created**: O recurso foi criado com sucesso.
- **400 Bad Request**: A solicitação é inválida ou contém parâmetros incorretos.
- **403 Forbidden**: O cliente não tem permissão para acessar o recurso.
- **404 Not Found**: O recurso solicitado não foi encontrado.
- **500 Internal Server Error**: Erro interno do servidor.

---

## Exemplos de Requisições

### Upload de Documento
```bash 
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer {seu_token}" \
  -F "userId={userId}" \
  -F "file=@/caminho/para/seu/arquivo.pdf"
  ```
### Consultar Documento
```bash 
curl -X POST http://localhost:3000/documents/query \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "{userId}",
        "documentId": "{documentId}",
        "question": "Qual é o título do documento?"
      }'
  ```
### Baixar Documento
```bash 
curl -X GET http://localhost:3000/documents/{documentId}/download \
  -H "Authorization: Bearer {seu_token}" \
  -o /caminho/para/salvar/arquivo.txt
  ```
---

## Notas Adicionais

- **Formatos de Arquivo Suportados:** PDF, JPEG, PNG.
- **Processamento de OCR:** Utiliza Tesseract.js para imagens e pdf-parse para PDFs.
- **Interação com LLM:** Utiliza o `GeminiService` para gerar respostas baseadas em modelos de linguagem natural.
- **Status do Documento:**
  - `PENDING`: Aguardando processamento.
  - `PROCESSING`: Em processamento.
  - `COMPLETED`: Processamento concluído.
  - `FAILED`: Falha no processamento.

---

## Contato

Para dúvidas ou suporte, entre em contato pelo email [tvac@cin.ufpebr](mailto:seu_email@dominio.com).
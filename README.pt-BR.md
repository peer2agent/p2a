# Wallet Tracker SOL

[English](README.md) | **Português**

Este projeto é uma aplicação para rastrear carteiras na blockchain Solana, com componentes on-chain e off-chain.

## Visão Geral

O projeto consiste em:
- Programas Solana (on-chain) desenvolvidos com Anchor framework.
- Um serviço off-chain construído com Node.js/TypeScript e Express.
- Integração com serviços AWS (SNS, SQS).
- Interação com o agregador Jupiter.
- Suporte para Dockerização.

## Estrutura do Repositório

- `programs/`: Contém os programas Solana (contratos).
- `off-chain/`: Contém o código do serviço off-chain, incluindo a API web.
- `tests/`: Testes para os programas e serviços.
- `migrations/`: Scripts de migração (se houver).
- `Anchor.toml`: Configuração do Anchor.
- `Cargo.toml`: Dependências Rust para os programas Solana.
- `package.json`: Dependências Node.js para o serviço off-chain e scripts.
- `Dockerfile`: Define a imagem Docker para a aplicação.
- `docker-compose.yml`: Define os serviços Docker.
- `setup-ec2.sh`: Script para configuração em instâncias EC2.

## Pré-requisitos

- Rust
- Node.js (versão X.Y.Z)
- Yarn ou npm
- Solana CLI
- Anchor CLI
- Docker (opcional, para rodar em container)

## Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd wallet-tracker-sol
    ```

2.  **Instale as dependências Rust (para os programas on-chain):**
    ```bash
    # Navegue para o diretório do programa se necessário
    # cargo build
    ```

3.  **Instale as dependências Node.js (para o serviço off-chain):**
    ```bash
    yarn install
    # ou
    # npm install
    ```

4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto ou no diretório `off-chain/` e adicione as variáveis necessárias (ex: chaves de API, endpoints, etc.).
    Exemplo:
    ```env
    SOLANA_CLUSTER_URL=https://api.devnet.solana.com
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_REGION=your_region
    # Outras variáveis...
    ```

## Build

-   **Programas On-chain (Anchor):**
    ```bash
    anchor build
    ```

-   **Serviço Off-chain (TypeScript):**
    (Geralmente não há um passo de build explícito se estiver usando `ts-node`, mas se você transpilar para JS, adicione o comando aqui)
    ```bash
    # Exemplo: yarn build
    ```

## Testes

-   **Testes dos Programas On-chain (Anchor):**
    ```bash
    anchor test
    ```
    ou
    ```bash
    yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
    ```


## Uso

### Rodando o Serviço Off-chain

```bash
yarn start
```
Isso iniciará o servidor web (geralmente em `http://localhost:PORTA`, verifique o código em `off-chain/src/web/tracking-wallet/routes-v1.ts` pela porta).

### Deploy dos Programas On-chain

1.  **Configure o provedor e a carteira no `Anchor.toml`:**
    ```toml
    [provider]
    cluster = "devnet" # ou "mainnet-beta", "testnet"
    wallet = "/caminho/para/sua/carteira.json"
    ```

2.  **Deploy:**
    ```bash
    anchor deploy
    ```

### Docker

Para construir e rodar a aplicação usando Docker:

```bash
docker-compose up --build
```
(Verifique o `docker-compose.yml` para os nomes dos serviços e configurações)


## Contribuição

Por favor, leia `CONTRIBUTING.md` para detalhes sobre nosso código de conduta e o processo para submeter pull requests. (Você precisará criar este arquivo)

## Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo `LICENSE` para detalhes. (Verifique `package.json` pela licença, que é ISC. Você pode querer criar um arquivo `LICENSE` com o texto da licença ISC).

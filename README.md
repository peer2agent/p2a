# P2A - Peer-to-Agent

**English** | [Português](README.pt-BR.md)

Decentralized copy trading platform on Solana blockchain enabling automated trade replication from expert traders to followers with secure on-chain delegation.

## Overview

This project consists of:
- Solana programs (on-chain) built with the Anchor framework
- Off-chain service built with Node.js/TypeScript and Express
- Integration with AWS services (SNS, SQS)
- Integration with Jupiter aggregator
- Docker support for containerization

## Repository Structure

- `programs/`: Contains Solana programs (smart contracts)
- `off-chain/`: Contains off-chain service code, including web API
- `tests/`: Tests for programs and services
- `migrations/`: Migration scripts (if any)
- `Anchor.toml`: Anchor framework configuration
- `Cargo.toml`: Rust dependencies for Solana programs
- `package.json`: Node.js dependencies for off-chain service and scripts
- `Dockerfile`: Docker image definition for the application
- `docker-compose.yml`: Docker services definition
- `setup-ec2.sh`: EC2 instance setup script

## Prerequisites

- Rust
- Node.js (version 18+)
- Yarn or npm
- Solana CLI
- Anchor CLI
- Docker (optional, for containerization)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <REPOSITORY_URL>
    cd p2a
    ```

2.  **Install Rust dependencies (for on-chain programs):**
    ```bash
    # Navigate to program directory if needed
    # cargo build
    ```

3.  **Install Node.js dependencies (for off-chain service):**
    ```bash
    yarn install
    # or
    # npm install
    ```

4.  **Configure environment variables:**
    Create a `.env` file in the project root or in the `off-chain/` directory and add the necessary variables (e.g., API keys, endpoints, etc.).
    Example:
    ```env
    SOLANA_CLUSTER_URL=https://api.devnet.solana.com
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_REGION=your_region
    # Other variables...
    ```

## Build

-   **On-chain Programs (Anchor):**
    ```bash
    anchor build
    ```

-   **Off-chain Service (TypeScript):**
    (Usually no explicit build step when using `ts-node`, but if you transpile to JS, add the command here)
    ```bash
    # Example: yarn build
    ```

## Testing

-   **On-chain Program Tests (Anchor):**
    ```bash
    anchor test
    ```
    or
    ```bash
    yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
    ```

## Usage

### Running the Off-chain Service

```bash
yarn start
```
This will start the web server (usually at `http://localhost:PORT`, check the code in `off-chain/src/web/tracking-wallet/routes-v1.ts` for the port).

### Deploying On-chain Programs

1.  **Configure the provider and wallet in `Anchor.toml`:**
    ```toml
    [provider]
    cluster = "devnet" # or "mainnet-beta", "testnet"
    wallet = "/path/to/your/wallet.json"
    ```

2.  **Deploy:**
    ```bash
    anchor deploy
    ```

### Docker

To build and run the application using Docker:

```bash
docker-compose up --build
```
(Check `docker-compose.yml` for service names and configurations)

## Features

### On-chain Smart Contracts
- **Trader Management**: Initialize and manage trader accounts with permissions
- **Follower System**: Add followers to traders and manage relationships
- **Deposit & Apports**: Handle user deposits and investment allocations
- **Swap Delegation**: Delegate swap authority via PDA (Program Derived Address)
- **Execute Swaps**: Automated trade execution replicating trader actions
- **SOL Transfers**: Secure on-chain SOL transfer functionality

### Off-chain Services
- **Wallet Tracking**: Real-time monitoring of trader wallet activities
- **Event Processing**: AWS SNS/SQS integration for event-driven architecture
- **Trade Token Service**: Token trading operations and management
- **Transaction Processor**: Process and validate blockchain transactions
- **Smart Contract Service**: Interface for interacting with on-chain programs
- **Web API**: RESTful API for client applications

## Technologies

**Blockchain:**
- Solana
- Anchor Framework
- Rust
- Jupiter Aggregator

**Backend:**
- Node.js / TypeScript
- Express.js
- Helius SDK

**Cloud & DevOps:**
- AWS (SNS, SQS)
- Docker
- EC2

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests. (You will need to create this file)

## License

This project is licensed under the ISC License - see the `LICENSE` file for details. (Check `package.json` for the license, which is ISC. You may want to create a `LICENSE` file with the ISC license text).

## Program ID

```
9uWnELB4ExQ4HY4YhSPb6pkGchaLCzty1BryX8w5xqVu
```
Deployed on Solana Devnet

#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker ${USER}

# Create solana config directory
mkdir -p ~/.config/solana

# Clone the repository (replace with your repository URL)
git clone https://github.com/yourusername/wallet-tracker-sol.git
cd wallet-tracker-sol

# Create .env file
cat > .env << EOL
SECRET_KEY=your_secret_key_here
TRACKED_WALLET=your_wallet_address_here
EOL

# Start the application
sudo docker-compose up -d 
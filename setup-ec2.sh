#!/bin/bash

# Detect the Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

echo "Detected OS: $OS"

# Install Docker based on OS
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
elif command -v yum &> /dev/null; then
    # Amazon Linux/RHEL/CentOS
    sudo yum update -y
    sudo yum install -y docker
    sudo yum install -y docker-compose
    sudo amazon-linux-extras install docker
elif command -v dnf &> /dev/null; then
    # Fedora
    sudo dnf update -y
    sudo dnf install -y docker docker-compose
fi

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo groupadd docker || true
sudo usermod -aG docker ${USER}

# Create solana config directory
mkdir -p ~/.config/solana

# Start the application
sudo docker compose up -d

echo "Setup complete! Please log out and log back in for docker group changes to take effect." 
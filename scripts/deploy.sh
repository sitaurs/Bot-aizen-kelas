#!/bin/bash

# WhatsApp Class Manager Bot - Deployment Script for Ubuntu VPS 22.04
# Run this script as root or with sudo

set -e

echo "🚀 Starting WhatsApp Class Manager Bot deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git build-essential

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "npm version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Create application directory
APP_DIR="/opt/whatsapp-bot"
print_status "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (replace with your actual repository URL)
print_status "Cloning repository..."
# git clone https://github.com/yourusername/whatsapp-class-manager-bot.git .
# For now, we'll assume the code is already in the current directory

# Install dependencies
print_status "Installing npm dependencies..."
npm install

# Build the project
print_status "Building project..."
npm run build

# Create data directories
print_status "Creating data directories..."
mkdir -p data storage

# Copy example data files if they don't exist
if [ ! -f "data/schedule.json" ]; then
    print_status "Copying example data files..."
    cp -r data/* data/ 2>/dev/null || true
fi

# Create environment file
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cp env.example .env
    print_warning "Please edit .env file with your configuration before starting the bot"
fi

# Create systemd service file
print_status "Creating systemd service..."
cat > /etc/systemd/system/whatsapp-bot.service << EOF
[Unit]
Description=WhatsApp Class Manager Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable whatsapp-bot

print_status "Deployment completed!"
print_status "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Start the bot:"
echo "   systemctl start whatsapp-bot"
echo ""
echo "3. Check status:"
echo "   systemctl status whatsapp-bot"
echo ""
echo "4. View logs:"
echo "   journalctl -u whatsapp-bot -f"
echo ""
print_warning "Don't forget to:"
echo "- Set your Gemini API key in .env"
echo "- Configure your WhatsApp group ID"
echo "- Add note takers JIDs"
echo "- Set up your schedule in data/schedule.json"

print_status "Deployment script completed successfully! 🎉"

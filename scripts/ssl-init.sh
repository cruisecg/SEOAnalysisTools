#!/bin/bash

# Initial SSL Certificate Setup Script
# Run this script first time to obtain SSL certificates

set -e

DOMAIN="seo.onestep.place"
EMAIL="admin@onestep.place"  # Change this to your email
SSL_DIR="./ssl"
LOG_FILE="./logs/ssl-init.log"

# Create directories
mkdir -p ssl logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting initial SSL certificate setup for $DOMAIN"

# Check if certificates already exist
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    log "SSL certificates already exist. Checking validity..."
    
    if openssl x509 -checkend 86400 -noout -in "$SSL_DIR/cert.pem" >/dev/null 2>&1; then
        log "Existing certificates are valid for at least 24 hours. Skipping initialization."
        exit 0
    else
        log "Existing certificates are expired or expiring soon. Will obtain new ones."
    fi
fi

# Stop any running containers that might use port 80
log "Stopping containers to free port 80 for certbot"
docker compose --profile production down 2>/dev/null || true

# Check if certbot is available
if ! command -v certbot &> /dev/null; then
    log "Certbot not found. Installing..."
    
    # Detect OS and install certbot
    if [ -f /etc/debian_version ]; then
        sudo apt update
        sudo apt install -y certbot
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y certbot || sudo dnf install -y certbot
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install certbot
        else
            log "Please install Homebrew first, then run: brew install certbot"
            exit 1
        fi
    else
        log "Unsupported OS. Please install certbot manually."
        exit 1
    fi
fi

# Obtain SSL certificate
log "Obtaining SSL certificate for $DOMAIN"

certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN" \
    --non-interactive \
    --verbose

# Copy certificates to project directory
log "Copying certificates to project directory"

if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set correct permissions
    sudo chown $USER:$USER "$SSL_DIR"/*.pem
    chmod 600 "$SSL_DIR"/*.pem
    
    log "Certificates copied successfully"
else
    log "ERROR: Certificate directory not found at /etc/letsencrypt/live/$DOMAIN"
    exit 1
fi

# Verify certificates
log "Verifying certificates"
if openssl x509 -text -noout -in "$SSL_DIR/cert.pem" | grep -q "$DOMAIN"; then
    log "Certificate verification successful"
else
    log "ERROR: Certificate verification failed"
    exit 1
fi

# Start containers with SSL
log "Starting containers with SSL configuration"
docker compose --profile production up -d

# Wait for containers to start
sleep 15

# Test HTTPS connection
log "Testing HTTPS connection"
if curl -I -k "https://$DOMAIN" >/dev/null 2>&1; then
    log "✅ HTTPS connection successful!"
    log "🎉 SSL certificate setup completed successfully"
    
    # Display certificate info
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
    log "📅 Certificate expires: $EXPIRY_DATE"
    
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set up auto-renewal: sudo ./scripts/setup-ssl-cron.sh"
    echo "2. Test your site: https://$DOMAIN"
    echo "3. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    
else
    log "❌ ERROR: HTTPS connection failed"
    log "Check the logs and try again"
    exit 1
fi

log "SSL initialization completed successfully"
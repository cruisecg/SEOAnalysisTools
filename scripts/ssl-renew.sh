#!/bin/bash

# SSL Certificate Auto-Renewal Script for 空間便利店 SEO Inspector
# This script automatically renews Let's Encrypt SSL certificates

set -e

DOMAIN="seo.onestep.place"
SSL_DIR="./ssl"
LOG_FILE="./logs/ssl-renewal.log"
EMAIL="admin@onestep.place"  # Change this to your email

# Create logs directory if it doesn't exist
mkdir -p logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting SSL certificate renewal check for $DOMAIN"

# Check if certificates exist and their expiry
if [ -f "$SSL_DIR/cert.pem" ]; then
    # Check certificate expiry (renew if less than 30 days)
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    log "Current certificate expires in $DAYS_UNTIL_EXPIRY days"
    
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        log "Certificate is still valid for more than 30 days. No renewal needed."
        exit 0
    fi
else
    log "No existing certificate found. Will obtain new certificate."
    DAYS_UNTIL_EXPIRY=0
fi

# Stop docker containers for standalone mode
log "Stopping Docker containers for certificate renewal"
docker compose --profile production down || true

# Obtain or renew certificate using certbot
log "Running certbot for certificate renewal"

if [ $DAYS_UNTIL_EXPIRY -eq 0 ]; then
    # First time certificate
    certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN" \
        --non-interactive
else
    # Renew existing certificate
    certbot renew \
        --standalone \
        --pre-hook "docker compose --profile production down" \
        --post-hook "systemctl reload nginx" \
        --quiet
fi

# Copy certificates to project directory
log "Copying certificates to project directory"
mkdir -p "$SSL_DIR"

sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"

# Set correct permissions
sudo chown $USER:$USER "$SSL_DIR"/*.pem
chmod 600 "$SSL_DIR"/*.pem

log "Certificates updated successfully"

# Restart docker containers
log "Restarting Docker containers"
docker compose --profile production up -d

# Verify the new certificate
log "Verifying certificate installation"
sleep 10

# Test HTTPS connection
if curl -I -k "https://$DOMAIN" > /dev/null 2>&1; then
    log "HTTPS connection successful - certificate renewal completed"
    
    # Send notification (optional)
    if command -v mail &> /dev/null; then
        echo "SSL certificate for $DOMAIN has been successfully renewed." | mail -s "SSL Certificate Renewed" "$EMAIL"
    fi
else
    log "ERROR: HTTPS connection failed after certificate renewal"
    exit 1
fi

log "SSL certificate renewal process completed successfully"
#!/bin/bash

# Setup SSL Auto-Renewal Cron Job
# Run this script once to set up automatic SSL certificate renewal

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_SCRIPT="$PROJECT_DIR/scripts/ssl-renew.sh"

echo "Setting up SSL certificate auto-renewal for 空間便利店 SEO Inspector"
echo "Project directory: $PROJECT_DIR"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script needs to be run with sudo to set up cron jobs"
    echo "Usage: sudo ./scripts/setup-ssl-cron.sh"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot
fi

# Create cron job for root user (needed for certbot)
CRON_JOB="0 2 * * 1 cd $PROJECT_DIR && $CRON_SCRIPT >> $PROJECT_DIR/logs/ssl-cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    echo "Cron job already exists. Updating..."
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ SSL auto-renewal cron job installed successfully!"
echo "📅 Schedule: Every Monday at 2:00 AM"
echo "📝 Logs: $PROJECT_DIR/logs/ssl-cron.log"
echo ""
echo "Current crontab:"
crontab -l | grep ssl-renew || echo "No SSL renewal jobs found"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"
chown -R $SUDO_USER:$SUDO_USER "$PROJECT_DIR/logs"

echo ""
echo "🔧 To manually test the renewal script:"
echo "   sudo $CRON_SCRIPT"
echo ""
echo "🔍 To check renewal logs:"
echo "   tail -f $PROJECT_DIR/logs/ssl-renewal.log"
echo ""
echo "📋 To list current cron jobs:"
echo "   sudo crontab -l"
echo ""
echo "🗑️ To remove auto-renewal:"
echo "   sudo crontab -l | grep -v ssl-renew | sudo crontab -"
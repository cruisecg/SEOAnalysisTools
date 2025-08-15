#!/bin/bash

# SSL Certificate Status Check Script
# Displays current SSL certificate information and status

DOMAIN="seo.onestep.place"
SSL_DIR="./ssl"

echo "🔐 SSL Certificate Status for 空間便利店 SEO Inspector"
echo "=================================================="
echo ""

# Check if certificates exist
if [ ! -f "$SSL_DIR/cert.pem" ]; then
    echo "❌ No SSL certificate found at $SSL_DIR/cert.pem"
    echo ""
    echo "🚀 To set up SSL certificates:"
    echo "   ./scripts/ssl-init.sh"
    exit 1
fi

# Get certificate information
echo "📋 Certificate Information:"
echo "Domain: $DOMAIN"
echo "Certificate path: $SSL_DIR/cert.pem"
echo ""

# Check certificate validity
if openssl x509 -checkend 0 -noout -in "$SSL_DIR/cert.pem" >/dev/null 2>&1; then
    echo "✅ Certificate is currently valid"
else
    echo "❌ Certificate has expired!"
fi

# Get expiry information
EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))

echo "📅 Expiry Date: $EXPIRY_DATE"
echo "⏰ Days until expiry: $DAYS_UNTIL_EXPIRY"

# Status indicator
if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
    echo "🟢 Status: Healthy (renewal not needed)"
elif [ $DAYS_UNTIL_EXPIRY -gt 7 ]; then
    echo "🟡 Status: Renewal recommended (less than 30 days)"
elif [ $DAYS_UNTIL_EXPIRY -gt 0 ]; then
    echo "🟠 Status: Renewal urgent (less than 7 days)"
else
    echo "🔴 Status: EXPIRED - immediate action required"
fi

echo ""

# Check certificate details
echo "🔍 Certificate Details:"
openssl x509 -subject -issuer -noout -in "$SSL_DIR/cert.pem"

echo ""

# Check if auto-renewal is set up
echo "🔄 Auto-Renewal Status:"
if crontab -l 2>/dev/null | grep -q "ssl-renew"; then
    echo "✅ Auto-renewal cron job is installed"
    echo "📅 Schedule: $(crontab -l 2>/dev/null | grep ssl-renew | cut -d' ' -f1-5)"
else
    echo "❌ Auto-renewal not set up"
    echo "🚀 To set up auto-renewal: sudo ./scripts/setup-ssl-cron.sh"
fi

echo ""

# Check recent renewal logs
echo "📝 Recent SSL Activity:"
if [ -f "./logs/ssl-renewal.log" ]; then
    echo "Last 5 renewal log entries:"
    tail -5 "./logs/ssl-renewal.log" | sed 's/^/   /'
else
    echo "No renewal logs found"
fi

echo ""

# Check HTTPS connectivity
echo "🌐 HTTPS Connectivity Test:"
if curl -I -k "https://$DOMAIN" >/dev/null 2>&1; then
    echo "✅ HTTPS connection successful"
    
    # Get SSL Labs grade (if available)
    if command -v jq &> /dev/null; then
        echo "🔒 Checking SSL Labs rating..."
        SSL_GRADE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN" | jq -r '.endpoints[0].grade // "Unknown"' 2>/dev/null)
        if [ "$SSL_GRADE" != "null" ] && [ "$SSL_GRADE" != "Unknown" ]; then
            echo "🏆 SSL Labs Grade: $SSL_GRADE"
        fi
    fi
else
    echo "❌ HTTPS connection failed"
fi

echo ""
echo "=================================================="

# Provide action recommendations
if [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
    echo "🚨 RECOMMENDED ACTIONS:"
    echo "1. Run manual renewal: sudo ./scripts/ssl-renew.sh"
    echo "2. Check renewal logs: tail -f logs/ssl-renewal.log"
    echo "3. Verify auto-renewal: sudo ./scripts/setup-ssl-cron.sh"
fi
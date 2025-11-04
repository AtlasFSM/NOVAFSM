#!/bin/bash

# Generate RSA keys for JWT RS256 authentication
# Run this script once to generate keys for development

echo "🔐 Generating RSA key pair for JWT RS256..."

# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key from private key
openssl rsa -in private.pem -pubout -out public.pem

echo ""
echo "✅ Keys generated successfully!"
echo ""
echo "📋 Add these to your .env file:"
echo ""
echo "# JWT Keys (RS256)"
echo "JWT_PRIVATE_KEY=\"$(awk '{printf "%s\\n", $0}' private.pem)\""
echo ""
echo "JWT_PUBLIC_KEY=\"$(awk '{printf "%s\\n", $0}' public.pem)\""
echo ""
echo "⚠️  IMPORTANT: Keep private.pem secret! Add it to .gitignore"
echo ""

# Cleanup
rm private.pem public.pem

echo "🔒 Keys removed from disk for security. Copy the above to your .env file."

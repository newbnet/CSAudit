#!/usr/bin/env bash
# Run on 10.10.10.64 (cod-node) to restrict access.
# SSH: only from 10.10.10.5. Backend 5010: only from NPM (10.10.10.61).
# Run this while connected from 10.10.10.5 to avoid lockout!

set -e

echo "Installing UFW..."
apt install ufw -y

echo "Disabling IPv6 in UFW..."
sed -i 's/^IPV6=.*/IPV6=no/' /etc/default/ufw

echo "Resetting UFW (removes old rules)..."
yes | ufw reset

echo "Allowing SSH only from 10.10.10.5..."
ufw allow from 10.10.10.5 to any port 22 proto tcp

echo "Allowing only NPM (10.10.10.61) to access backend port 5010..."
ufw allow from 10.10.10.61 to any port 5010 proto tcp

echo "Enabling firewall..."
ufw --force enable

echo "Status:"
ufw status

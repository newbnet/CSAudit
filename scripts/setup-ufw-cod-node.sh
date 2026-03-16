#!/usr/bin/env bash
# Run on 10.10.10.64 (cod-node) to restrict access.
# SSH: only from 10.10.10.5.
# Cybersecurity: frontend 3010 + backend 5010 — only from NPM (10.10.10.61).
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

echo "Allowing NPM (10.10.10.61) to access Cybersecurity frontend (3010) and backend (5010)..."
ufw allow from 10.10.10.61 to any port 3010 proto tcp
ufw allow from 10.10.10.61 to any port 5010 proto tcp

echo "Enabling firewall..."
ufw --force enable

echo "Status:"
ufw status

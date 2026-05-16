#!/bin/bash
# Run on each instance to apply nftables rules
# Usage: sudo ./install-nftables.sh nftables.conf

set -e

RULES_FILE=${1:-nftables.conf}

if [ ! -f "$RULES_FILE" ]; then
    echo "Error: $RULES_FILE not found"
    exit 1
fi

sudo apt install nftables -y
sudo cp "$RULES_FILE" /etc/nftables.conf
sudo systemctl enable nftables
sudo systemctl restart nftables

echo "nftables rules applied:"
sudo nft list ruleset

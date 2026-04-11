#!/bin/bash

# ==============================================================================
# Script: monitor-config.sh
# Description: Uses inotifywait to monitor the app-config.json file for changes.
# Requirements: linux `inotify-tools` package. Will run via WSL on Windows.
# Usage: ./monitor-config.sh
# ==============================================================================

# Note: Before running, install inotify-tools in WSL:
# sudo apt-get update && sudo apt-get install -y inotify-tools

CONFIG_FILE="../config/app-config.json"

# Check if target file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Configuration file not found at $CONFIG_FILE"
    exit 1
fi

echo "Monitoring $CONFIG_FILE for modifications..."

# inotifywait monitors continuous events (-m), specifically modifications (-e modify)
inotifywait -m -e modify "$CONFIG_FILE" |
while read -r directory events filename; do
    echo "----------------------------------------"
    echo "$filename was updated with event(s): $events"
    echo "Fetching update at $(date)"
    
    # Normally, you would trigger the application reload here (e.g., via a SIGUSR1 or a Webhook)
    echo "Triggering application config reload webhook..."
    
    curl -X POST http://localhost:3000/api/reload-config
    echo ""
    echo "========================================"
done

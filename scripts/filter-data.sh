#!/bin/bash

# ==============================================================================
# Script: filter-data.sh
# Description: Script to filter and transform raw CDC data.
#              Simulates preprocessing before forwarding data.
# Usage: ./filter-data.sh <input_file.json>
# ==============================================================================

# Check if argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <input_file.json>"
  exit 1
fi

INPUT_FILE=$1

# Validate file existence
if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: '$INPUT_FILE' does not exist."
  exit 1
fi

echo "===== Sample Output Generation ====="
echo "Source File: $INPUT_FILE"

# Extract operation types
echo -e "\n[Operations Extracted]:"
grep -o '"operationType":"[^"]*"' "$INPUT_FILE" | awk -F '"' '{print "Command: " $4}'

# Extract document IDs
echo -e "\n[Document Keys]:"
grep -o '"_id":"[^"]*"' "$INPUT_FILE" | awk -F '"' '{print "Doc ID: " $4}'

# Transform data (mask sensitive info)
echo -e "\n[Sanitized Output]:"
sed 's/"password":"[^"]*"/"password":"***REDACTED***"/g' "$INPUT_FILE" > "filtered_$INPUT_FILE"

echo "Processed file saved as: filtered_$INPUT_FILE"
echo "===================================="
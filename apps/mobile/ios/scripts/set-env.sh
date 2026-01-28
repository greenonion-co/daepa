#!/bin/bash

# This script reads the .env file and generates tmp.xcconfig for Xcode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$(dirname "$IOS_DIR")"
ENV_FILE="$APP_DIR/.env"
OUTPUT_FILE="$IOS_DIR/tmp.xcconfig"

echo "// Auto-generated from .env - DO NOT EDIT" > "$OUTPUT_FILE"

if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
      continue
    fi

    # Only process lines with = sign
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Remove quotes if present
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      # Remove CR (for CRLF line endings)
      value="${value//$'\r'/}"
      # Escape $ to prevent xcconfig variable expansion
      value="${value//\$/\$\$}"
      echo "$key = $value" >> "$OUTPUT_FILE"
    fi
  done < "$ENV_FILE"
fi

echo "Generated $OUTPUT_FILE"

#!/bin/bash

# This script reads the .env file and generates tmp.xcconfig for Xcode
# Usage: ENVFILE=.env.production ./set-env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$(dirname "$IOS_DIR")"

# ENVFILE 환경변수가 설정되어 있으면 해당 파일 사용, 아니면 .env 사용
if [ -n "$ENVFILE" ]; then
  ENV_FILE="$APP_DIR/$ENVFILE"
else
  ENV_FILE="$APP_DIR/.env"
fi

OUTPUT_FILE="$IOS_DIR/tmp.xcconfig"

echo "Using env file: $ENV_FILE"
echo "// Auto-generated from $(basename "$ENV_FILE") - DO NOT EDIT" > "$OUTPUT_FILE"

# ENVFILE을 xcconfig에 추가하여 빌드 시 react-native-config가 올바른 env 파일을 사용하도록 함
if [ -n "$ENVFILE" ]; then
  echo "ENVFILE = $ENVFILE" >> "$OUTPUT_FILE"
fi

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
else
  echo "Warning: Env file not found: $ENV_FILE"
fi

echo "Generated $OUTPUT_FILE"

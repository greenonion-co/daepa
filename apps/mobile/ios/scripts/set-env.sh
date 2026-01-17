#!/bin/bash

# react-native-config 환경변수를 xcconfig 파일로 변환하는 스크립트
# 빌드 전에 실행되어야 함

set -e

ENVFILE="${ENVFILE:-.env}"
IOS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ROOT="$(cd "$IOS_DIR/.." && pwd)"
ENV_PATH="$PROJECT_ROOT/$ENVFILE"

echo "Using env file: $ENV_PATH"

if [ ! -f "$ENV_PATH" ]; then
  echo "Error: $ENV_PATH not found"
  exit 1
fi

# tmp.xcconfig 생성
TMP_XCCONFIG="$IOS_DIR/tmp.xcconfig"
echo "// Auto-generated from $ENVFILE - DO NOT EDIT" > "$TMP_XCCONFIG"

while IFS='=' read -r key value || [ -n "$key" ]; do
  # 주석과 빈 줄 무시
  [[ $key =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # 값에서 따옴표 제거
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  echo "$key = $value" >> "$TMP_XCCONFIG"
done < "$ENV_PATH"

echo "Generated $TMP_XCCONFIG"

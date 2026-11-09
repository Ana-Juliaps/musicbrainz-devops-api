#!/usr/bin/env bash
# Uso: ./scripts/rollback.sh <tag-anterior>   ex.: ./scripts/rollback.sh 1.1.0
set -euo pipefail
TAG="${1:?informe a tag para a qual voltar}"
exec "$(dirname "$0")/deploy.sh" "$TAG"

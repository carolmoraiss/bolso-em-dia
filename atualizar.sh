#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")"
CLASP=(npx --yes @google/clasp@3.4.1)
[ -f "$HOME/.clasprc.json" ] && chmod 600 "$HOME/.clasprc.json"

if [ ! -f .clasp.json ]; then
  echo "Projeto ainda não instalado nesta pasta. Rode ./instalar.sh primeiro."
  exit 1
fi
if [ ! -f .implantacao-id ]; then
  echo "Não achei o arquivo .implantacao-id. Rode: npx --yes @google/clasp@3.4.1 list-deployments"
  echo "e grave o ID que começa com AKfy num arquivo .implantacao-id nesta pasta."
  exit 1
fi

ID=$(cat .implantacao-id)
python3 montar.py >/dev/null
cp Code.gs dist/Index.html appsscript.json app/
"${CLASP[@]}" push --force
"${CLASP[@]}" update-deployment "$ID" --description "Bolso em Dia $(date +%Y-%m-%d)"
echo
echo "Atualizado. O link continua: https://script.google.com/macros/s/$ID/exec"
echo "Se a página estiver aberta no celular, feche e abra de novo."

#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")"
CLASP=(npx --yes @google/clasp@3.4.1)
[ -f "$HOME/.clasprc.json" ] && chmod 600 "$HOME/.clasprc.json"

if [ -f .clasp.json ] || [ -f app/.clasp.json ]; then
  echo "Este projeto já foi instalado. Para mandar uma versão nova, rode ./atualizar.sh"
  exit 1
fi

echo "1/4  Criando a planilha \"Bolso em Dia\" e o projeto do Apps Script na sua conta..."
mkdir -p app
"${CLASP[@]}" create-script --type sheets --title "Bolso em Dia" --rootDir ./app

echo "2/4  Montando a página..."
python3 montar.py >/dev/null
cp Code.gs dist/Index.html appsscript.json app/

echo "3/4  Enviando o código para o Google..."
"${CLASP[@]}" push --force

echo "4/4  Publicando o app da Web (acesso: somente você)..."
"${CLASP[@]}" create-deployment --description "Bolso em Dia" | tee .implantacao.log
ID=$(grep -oE 'AKfy[0-9A-Za-z_-]+' .implantacao.log | tail -1 || true)

echo
if [ -n "$ID" ]; then
  echo "$ID" > .implantacao-id
  echo "Pronto. Abra este link no PC e no celular (é sempre o mesmo):"
  echo
  echo "   https://script.google.com/macros/s/$ID/exec"
  echo
  echo "Na primeira vez o Google pede autorização: Revisar permissões > sua conta > Avançado > Acessar Bolso em Dia > Permitir."
else
  echo "Publicado, mas não consegui ler o código da implantação na saída acima."
  echo "Rode:  npx --yes @google/clasp@3.4.1 list-deployments   e use o ID que começa com AKfy."
fi

#!/usr/bin/env python3
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FONTE = RAIZ / 'fonte'
DIST = RAIZ / 'dist'

CSP = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")


def ler(nome: str) -> str:
    return (FONTE / nome).read_text(encoding='utf-8')


def montar(csp: str) -> str:
    cabecalho = ler('cabecalho.html')
    for marcador in ('{{CSP}}', '{{ESTILO}}'):
        if cabecalho.count(marcador) != 1:
            raise SystemExit(f'cabecalho.html precisa ter {marcador} exatamente uma vez')
    script = ler('app.js')
    if '</script' in script.lower():
        raise SystemExit('app.js não pode conter "</script"')
    return (cabecalho.replace('{{CSP}}', csp).replace('{{ESTILO}}', ler('estilo.css'))
            + ler('corpo.html') + '<script>\n' + script + '</script>\n</body>\n</html>\n')


def main() -> None:
    DIST.mkdir(exist_ok=True)
    saidas = {
        DIST / 'Index.html': montar(''),
        DIST / 'bolso-em-dia.html': montar(f'<meta http-equiv="Content-Security-Policy" content="{CSP}">\n'),
    }
    for caminho, conteudo in saidas.items():
        caminho.write_text(conteudo, encoding='utf-8')
        print(f'Gerado: {caminho.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()

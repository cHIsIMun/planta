// Workflow do GitHub Actions (seção 17.1): verificação com anotações SARIF,
// política de aceite, comentário de diff arquitetural e diagramas embutidos.

export function githubWorkflow(options: { dir: string; docs: string }): string {
  const dir = options.dir === "planta" ? "" : ` --dir ${options.dir}`;
  return `name: planta
on: [pull_request]

jobs:
  arquitetura:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      security-events: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: actions/setup-node@v4
        with: { node-version: 22 }

      - run: npm ci

      # Diagnósticos viram anotações no PR. Com --base, também falha se o
      # planta.lock foi alterado por uma identidade de agente (PL405).
      - name: Verificar planta
        run: npx planta check${dir} --base origin/\${{ github.base_ref }} --format sarif > planta.sarif

      - name: Publicar anotações
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with: { sarif_file: planta.sarif }

      - name: Diff arquitetural
        if: always()
        run: npx planta diff${dir} origin/\${{ github.base_ref }} --format markdown > diff.md

      - name: Comentar no PR
        if: always()
        uses: marocchino/sticky-pull-request-comment@v2
        with: { path: diff.md, header: planta }

      - name: Diagramas embutidos atualizados
        run: npx planta render${dir} --inject "${options.docs}" --check
`;
}

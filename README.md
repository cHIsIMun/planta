# Planta

Linguagem de especificação arquitetural ancorada em código. Você descreve o
sistema em arquivos `.planta` (contextos, entidades, endpoints, processos,
deployment, regras de dependência) e cada elemento aponta para o código ou a
infraestrutura que o implementa. A `planta check` confere a descrição contra o
código real e avisa quando os dois divergem; diagramas, rastreabilidade de
requisitos, OpenAPI e Structurizr saem do mesmo modelo.

```planta
context Vendas root "/apps/api/src/vendas" {
  entity Cliente @"clientes/cliente.entity.ts#Cliente" {
    id: uuid key
    email: string unique max(255)
  }

  service ClientesService @"clientes/clientes.service.ts#ClientesService" {
    op criar(dto: CriarClienteDto) -> Cliente justifiedBy "REQ-001"
    uses ClienteRepository
  }
}
```

A especificação completa da linguagem está em
[`planta-especificacao.md`](planta-especificacao.md).

## Instalação

Requer Node.js 22 ou mais recente. A CLI é publicada nos
[releases do GitHub](https://github.com/cHIsIMun/planta/releases); instale a
versão desejada como dependência de desenvolvimento do projeto:

```sh
npm install -D https://github.com/cHIsIMun/planta/releases/download/v0.1.0/planta-0.1.0.tgz
npx planta --version
```

Para atualizar, rode o mesmo comando com a versão nova. Fixar a versão na URL
mantém o `package-lock.json` reproduzível no CI.

### Extensão do VS Code

Baixe o `planta-vscode-*.vsix` do release e instale:

```sh
code --install-extension planta-vscode-0.1.0.vsix
```

A extensão usa o `node_modules/.bin/planta` do projeto (ou o comando definido em
`planta.server.command`) e oferece diagnósticos, completar de âncoras,
navegação entre planta e código, ações rápidas, CodeLens e pré-visualização das
views.

## Uso

```sh
npx planta check            # verifica a planta contra o código
npx planta review           # o que mudou desde a última revisão
npx planta accept --all     # marca como revisado no planta.lock
npx planta render           # diagramas Mermaid (ou --format d2)
npx planta serve            # visualizador web local
npx planta export --format openapi --out openapi.json
npx planta ci github --write  # workflow de PR: anotações, diff e diagramas
```

`npx planta --help` lista todos os comandos. A configuração fica em
`planta/planta.config.yaml`; os projetos em [`test/fixtures`](test/fixtures)
são exemplos completos (NestJS + React + Terraform, Django, Spring, FastAPI,
Next.js, CDK/Kubernetes/Compose).

Extratores incluídos: NestJS, TypeORM, React, Next.js, Django, FastAPI,
Spring, imports (TS/Python), Terraform, AWS CDK, Kubernetes, Docker Compose e
requisitos/decisões em Markdown. Regras e extratores próprios podem ser
escritos como plugins com `planta/sdk`.

## Desenvolvimento

```sh
pnpm install
pnpm test           # testes
pnpm run typecheck
pnpm run build      # compila para dist/
pnpm planta check   # roda a CLI direto do código-fonte
```

A gramática está em `grammar/Planta.g4` (`pnpm run generate` regenera o
parser) e precisa continuar idêntica à seção 7 da especificação.

### Lançar uma versão

1. Atualize `version` em `package.json` (e em `editors/vscode/package.json`, se
   a extensão mudou).
2. Faça o commit e crie a tag correspondente:

   ```sh
   git commit -am "v0.2.0"
   git tag v0.2.0
   git push origin main v0.2.0
   ```

O workflow `release` testa, empacota a CLI e a extensão e cria o release com
os dois arquivos. Se o segredo `NPM_TOKEN` estiver configurado no repositório,
ele também publica o pacote no npm, e a instalação passa a ser
`npm install -D planta`.

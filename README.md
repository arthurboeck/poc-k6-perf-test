# poc-k6-perf-test

PoC de testes de performance com [Grafana k6](https://k6.io) contra a API pública [Swagger Petstore](https://petstore.swagger.io).

O objetivo é exercitar um conjunto pequeno de endpoints (`pet` e `store`) com cenários de carga distintos, asserções via `k6-testing` e `check()`.

## Pré-requisitos

- [Docker](https://www.docker.com/) — usado para rodar o k6 via imagem oficial [`grafana/k6`](https://hub.docker.com/r/grafana/k6)
- Node.js (opcional, apenas para tipos e `npm install`)

A dependência `@types/k6` existe só para autocomplete no editor. O k6 **não** usa o `node_modules` em runtime; as libs extras vêm da [jslib](https://jslib.k6.io).

## Como executar

### Via Docker (imagem oficial `grafana/k6`)

Suite completa (todos os cenários definidos em `main.js`):

```bash
docker run --rm \
  -v "$(pwd):/src" \
  -w /src \
  grafana/k6:latest \
  run main.js
```

Com relatórios:

```bash
docker run --rm \
  -v "$(pwd):/src" \
  -w /src \
  grafana/k6:latest \
  run --summary-export summary.json --out json=results.json main.js
```

### Via k6 instalado localmente

```bash
k6 run main.js
```

Ou via npm:

```bash
npm test
```

Um único arquivo de teste:

```bash
k6 run petstore-perf-test/pet/find-by-status-test.js
```

> Scripts de teste exportam funções (`findByStatusTest`, `postPetTest`, etc.). Para rodá-los isolados, importe a função em um script com `export default` (como o `main.js`) ou adicione um `default` temporário no próprio arquivo.

## Estrutura

```text
.
├── main.js                          # orquestrador: options + default
├── package.json
└── petstore-perf-test/
    ├── pet/
    │   ├── find-by-status-test.js   # GET /pet/findByStatus
    │   └── post-pet-test.js         # POST /pet
    └── store/
        ├── get-inventory-test.js    # GET /store/inventory
        └── post-order-test.js       # POST /store/order
```

A URL base é `https://petstore.swagger.io/v2`. Cada teste concatena o path do recurso (`/pet`, `/store/order`, …).

## Cenários de carga

Definidos em `main.js`:

| Cenário        | Executor            | Configuração                         | Endpoint                    |
|----------------|---------------------|--------------------------------------|-----------------------------|
| `findByStatus` | `constant-vus`      | 5 VUs por 30s                        | `GET /pet/findByStatus`     |
| `getInventory` | `constant-vus`      | 5 VUs por 30s                        | `GET /store/inventory`      |
| `postPet`      | `per-vu-iterations` | 3 VUs × 10 iterações (max 30s)       | `POST /pet`                 |
| `postOrder`    | `per-vu-iterations` | 3 VUs × 10 iterações (max 30s)       | `POST /store/order`         |

A função `default` chama os quatro testes em sequência. Com vários cenários ativos, **cada VU de cada cenário executa essa mesma função** — os quatro requests rodam juntos, não um endpoint por cenário.

## Integração Contínua (CI)

O projeto possui um pipeline GitHub Actions em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) que roda em todo `push` e `pull_request` na branch `main`.

### O que o pipeline faz

1. Faz checkout do repositório
2. Instala Node.js 20 e as dependências (`npm ci`)
3. Instala o k6 via repositório oficial apt
4. Executa os testes de performance: `k6 run --summary-export summary.json --out json=results.json main.js`
5. Anexa os relatórios como artifact `relatorios-teste` (disponível na aba **Actions → [run] → Artifacts**)

### Relatórios gerados

| Arquivo | Descrição |
|---------|-----------|
| `results.json` | Relatório detalhado em JSON (todos os dados brutos da execução) |
| `summary.json` | Resumo agregado das métricas do k6 |

Ambos estão no `.gitignore` e não são commitados — são gerados a cada run do CI e disponibilizados como artifact para download.

### Executar localmente com relatórios

Via Docker (imagem oficial `grafana/k6`):

```bash
docker run --rm \
  -v "$(pwd):/src" \
  -w /src \
  grafana/k6:latest \
  run --summary-export summary.json --out json=results.json main.js
```

Ou com k6 instalado localmente:

```bash
k6 run --summary-export summary.json --out json=results.json main.js
```

## Asserções

Os testes combinam:

- **`expect` / `expect.soft`** da [k6-testing](https://grafana.com/docs/k6/latest/javascript-api/jslib/testing/) (sintaxe Playwright: `.toBe(200)`)
- **`check()`** do k6, para métricas de checks no relatório

`expect()` (hard) **aborta a iteração** se falhar. `expect.soft()` e `check()` registram a falha e seguem.

Query params usam a jslib [`URL`](https://grafana.com/docs/k6/latest/examples/url-query-parameters/), sem concatenar a query string na mão:

```javascript
const url = new URL(baseUrl + path);
url.searchParams.set('status', 'available');
http.get(url.toString(), params);
```

## Alvo

API de demonstração: [https://petstore.swagger.io](https://petstore.swagger.io). Pode responder 4xx/5xx ou ficar instável; isso não indica necessariamente um bug no script.

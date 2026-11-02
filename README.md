# poc-k6-perf-test

PoC de testes de performance com [Grafana k6](https://k6.io) contra a API pública [Swagger Petstore](https://petstore.swagger.io).

O objetivo é exercitar um conjunto pequeno de endpoints (`pet` e `store`) com cenários de carga distintos, asserções via `k6-testing` e `check()`.

## Pré-requisitos

- Node.js 
- Grafana/K6

A dependência `@types/k6` existe só para autocomplete no editor. O k6 **não** usa o `node_modules` em runtime; as libs extras vêm da [jslib](https://jslib.k6.io).

## Como executar

Suite completa (todos os cenários definidos em `main.js`):

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

O projeto possui um pipeline GitHub Actions em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) que roda em todo `push` e `pull_request` em qualquer branch.

O pipeline é dividido em dois jobs:

1. **`build`** — checkout do repositório, instala Node.js 20 e executa `npm ci`.
2. **`test`** (depende de `build`) — checkout do repositório, instala o k6 via [`grafana/setup-k6-action`](https://github.com/grafana/setup-k6-action) e executa os testes com [`grafana/run-k6-action`](https://github.com/grafana/run-k6-action), gerando o dashboard HTML em `html-report.html` e anexando-o como artifact `ke-reports`.

### O que o pipeline faz

1. Faz checkout do repositório
2. Instala Node.js 20 e as dependências (`npm ci`)
3. Instala o k6 via `grafana/setup-k6-action@v1.2.2`
4. Executa os testes de performance com `grafana/run-k6-action@v1.5.0` e `K6_WEB_DASHBOARD=true`
5. Anexa o relatório HTML como artifact `ke-reports` em `html-report.html` (disponível na aba **Actions → [run] → Artifacts**)

### Relatório gerado

| Arquivo | Descrição |
|---------|-----------|
| `html-report.html` | Dashboard HTML interativo do k6 (web dashboard) |

O arquivo está no `.gitignore` e não é commitado — é gerado a cada run do CI e disponibilizado como artifact para download.

### Executar localmente com relatório HTML

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run --summary-mode=full main.js
```

```bash
npm run test-report
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

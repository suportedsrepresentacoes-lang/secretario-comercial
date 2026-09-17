# CampoVista

O **copiloto do representante em campo**: geolocalização, prospecção por segmento, roteirização, Street View, navegação, registro de visitas e controle de combustível/despesas — para quem visita empresas e clientes presencialmente, em qualquer segmento B2B (materiais de construção, autopeças, agro, farmácias, distribuidoras, etc).

> Planeje sua rota. Encontre oportunidades. Visite mais clientes. Gaste menos.

Fluxo principal: **Início (resumo do dia) → Minha localização → Segmento → Buscar estabelecimentos → Ver fachada (Street View) → Selecionar → Adicionar clientes/prospects → Criar rota → Otimizar → Iniciar rota → Navegar até cada parada → Registrar visita → Finalizar → Histórico, despesas e relatório do dia.**

## Identidade

Interface **azul-claro + branco**, mobile-first, com poucas cores adicionais e função visual clara: azul para ações principais, verde para concluído, âmbar para atenção e vermelho para problema/cancelamento.

## Stack e arquitetura

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tokens de cor em `src/index.css`)
- Zustand (estado global único, persistido em `localStorage`)
- React Router (navegação por hash)
- React Leaflet + OpenStreetMap (desenho do mapa e rotas, sem chave de API)
- Google Places API (Text Search) para a busca de estabelecimentos por segmento — requer uma chave de API própria (variável `VITE_GOOGLE_PLACES_API_KEY`, injetada em build a partir do segredo `VITE_GOOGLE_MAPS_API_KEY` no GitHub Actions). Cobertura de comércio muito melhor que dados livres, principalmente em cidades pequenas, ao custo de depender de uma API paga com cota gratuita mensal.
- @hello-pangea/dnd (reordenar paradas da rota)
- vite-plugin-pwa (aplicativo instalável / offline)

Arquitetura modular, separando claramente cada responsabilidade:

```
src/
  types/        modelo de dados (cliente, rota, despesa, veículo, prospecção)
  services/     geolocalização, geocodificação, busca de lugares (Google Places),
                roteirização/otimização, Street View, navegação — cada um
                isolado e reutilizável, sem depender de nenhuma API paga
  store/        estado global (Zustand), persistido no dispositivo
  data/         segmentos de prospecção e dados de demonstração
  lib/          formatação e rótulos/cores compartilhados
  components/   layout (topo/navegação) e UI genérica (botão, card, sheet…)
  pages/        cada tela do produto
```

Os dados ficam salvos no navegador via `localStorage` — protótipo sem backend, cada dispositivo tem sua própria base. A separação em camadas acima facilita trocar essa persistência por um backend/autenticação no futuro sem reescrever as telas.

## Módulos

- **Início** — saudação, resumo da operação do dia (visitas planejadas, km, combustível estimado, prospects próximos) e clientes próximos por geolocalização.
- **Buscar** — geolocalização, prospecção por segmento (categorias predefinidas + segmento personalizado) e mapa com Street View e navegação por marcador.
- **Rotas** — construção e otimização de rota (nearest-neighbor + 2-opt), edição de paradas, execução com **Modo Campo** (tela simplificada mostrando só a próxima parada), registro de visita com resultado estruturado (venda realizada, pedido em negociação, proposta enviada, retornar, sem interesse, não atendido, cliente não encontrado, outro), locais favoritos como ponto de partida (casa/escritório) e cálculo de combustível.
- **Histórico** — rotas em andamento, planejadas e concluídas, com totais de distância e combustível.
- **Clientes** — cadastro rápido (inclusive a partir de um prospect encontrado na busca), tags/etiquetas, filtro por status e por tag, histórico de visitas e ações de rota/navegação/Street View.
- **Despesas** — lançamento de gastos de campo (combustível, pedágio, estacionamento, alimentação, hospedagem, outros) com totais por categoria e por mês.
- **Relatório** — resumo do dia: visitas realizadas/pendentes/retornos, quilometragem planejada x realizada, combustível estimado x gasto real, custo total da operação, prospects encontrados e clientes cadastrados.
- **Configurações** — perfil, dados do veículo (tipo de combustível, consumo médio e preço), locais favoritos e exportação/reset de dados.

## Fora do escopo desta primeira versão

Para não transformar o produto num ERP/CRM gigantesco antes da hora: filtros combinados avançados (ex. distância + tags + segmento ao mesmo tempo), alerta automático de proximidade (exigiria rastreamento contínuo de localização, evitado de propósito) e rotas recorrentes por dia da semana. São evoluções naturais dos módulos de Clientes/Rotas já existentes.

## Como rodar

A busca de estabelecimentos precisa de uma chave da Google Places API. Para rodar localmente, crie
um arquivo `.env.local` (não versionado) na raiz do projeto:

```
VITE_GOOGLE_PLACES_API_KEY=sua-chave-aqui
```

```bash
npm install
npm run dev
```

Acesse http://localhost:5173.

## Build de produção

```bash
npm run build
npm run preview
```

Para publicar em subpasta (ex: GitHub Pages), gere o build com o base path correspondente:

```bash
npm run build -- --base=/nome-do-repositorio/
```

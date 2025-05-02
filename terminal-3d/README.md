# Projeto Terminal 3D

Este documento descreve as melhorias implementadas no projeto Terminal 3D, transformando-o em uma aplicação mais robusta, organizada e extensível.

## Visão Geral das Melhorias

O projeto foi significativamente refatorado e aprimorado com foco em:

*   **Arquitetura e Organização:** Introdução de padrões de design e migração para TypeScript.
*   **Performance:** Otimizações para lidar com cenas complexas.
*   **Gerenciamento de Dados:** Implementação de um banco de dados em memória e sistemas de gerenciamento.
*   **Funcionalidades:** Adição de recursos como catalogação, filtros, anotações, versionamento, navegação e simulação.

## Melhorias Técnicas Detalhadas

### 1. Arquitetura e Padrões de Design

Foram implementados padrões de design para melhorar a organização, flexibilidade e manutenibilidade do código:

*   **Factory Pattern (`js/factory/equipmentFactory.ts`):** Centraliza a criação de objetos 3D (Tanques, Tubulações, Válvulas, etc.) a partir de dados do catálogo ou do banco de dados. Isso desacopla a lógica de criação da cena principal e facilita a adição de novos tipos de equipamentos.
*   **Strategy Pattern (`js/strategies/colorStrategy.ts`):** Permite definir e alternar diferentes algoritmos para a visualização de dados (ex: colorir equipamentos por tipo, status, produto). Isso torna a lógica de visualização mais flexível.
*   **Command Pattern (`js/commands/`):** Encapsula ações do usuário (como resetar câmera, alternar camadas) em objetos. Isso facilita a implementação de funcionalidades como desfazer/refazer e desacopla a interface do usuário da lógica de execução.

### 2. Migração para TypeScript

Todo o código JavaScript (`.js`) foi migrado para TypeScript (`.ts`). Isso introduz:

*   **Tipagem Estática:** Reduz erros em tempo de desenvolvimento e melhora a clareza do código.
*   **Interfaces e Classes:** Permite uma modelagem de dados mais robusta e orientação a objetos.
*   **Melhor Autocomplete e Refatoração:** Ferramentas de desenvolvimento funcionam de forma mais eficaz.
*   **Organização Modular:** Uso de `import`/`export` para gerenciar dependências entre módulos.

O projeto agora inclui um `tsconfig.json` para configurar o compilador TypeScript e um `package.json` com as dependências necessárias (`@babylonjs/core`, `typescript`, etc.). O código TypeScript é compilado para JavaScript (na pasta `dist/`) para ser executado no navegador.

### 3. Otimizações de Performance

Para garantir um bom desempenho mesmo com um grande número de objetos:

*   **Level of Detail (LOD):** Implementado nos modelos (`js/models/*.ts`). Objetos distantes da câmera usam representações de menor poligonagem, reduzindo a carga na GPU.
*   **Instancing:** Utilizado para objetos repetitivos como válvulas, suportes e degraus (`js/models/*.ts`). Em vez de criar múltiplos meshes idênticos, uma única geometria é desenhada várias vezes com diferentes transformações (posição, rotação, escala), economizando memória e draw calls.
*   **Meshes Fonte:** Os modelos base (tanque, válvula, etc.) são criados uma vez e desabilitados. As instâncias ou LODs são criados a partir desses meshes fonte, evitando recriações desnecessárias.

### 4. Sistema de Banco de Dados em Memória

Foi implementado um banco de dados relacional/NoSQL híbrido em memória (`js/database/inMemoryDb.ts`):

*   **Estrutura Híbrida:** Usa `Map` do JavaScript para simular tabelas (equipamentos) e coleções (anotações).
*   **Interfaces de Dados:** Interfaces TypeScript (`TankData`, `PipeData`, etc.) definem a estrutura dos dados.
*   **Gerenciamento:** A classe `InMemoryDatabase` (Singleton) fornece métodos para adicionar, atualizar, remover e buscar dados (`upsertEquipment`, `getEquipmentById`, `getEquipmentByType`, etc.).
*   **Indexação:** Índices simples (por tipo, por pai) são mantidos para acelerar buscas comuns.
*   **Carregamento Inicial:** Método `loadInitialData` para popular o banco a partir de uma estrutura de dados inicial (como o antigo `equipment.js`).
*   **Preparado para Expansão:** A estrutura foi pensada para facilitar uma futura migração para bancos de dados persistentes (ex: PostgreSQL, MongoDB).

## Melhorias Funcionais Detalhadas

### 1. Catalogação e Gerenciamento de Modelos (`js/factory/equipmentFactory.ts`)

*   **Catálogo de Equipamentos:** A `EquipmentFactory` agora inclui um catálogo interno com definições padrão para diferentes tipos de equipamentos (propriedades, descrição, tags).
*   **Gerenciamento do Catálogo:** Métodos para adicionar, atualizar, remover e buscar itens no catálogo.
*   **Criação a partir do Catálogo:** Equipamentos podem ser criados usando as definições do catálogo, garantindo consistência.
*   **Reutilização:** Facilita a reutilização de definições de componentes.

### 2. Categorias Hierárquicas e Filtros Avançados (`js/filters/`)

*   **`CategoryManager`:** Gerencia uma estrutura de árvore para categorizar equipamentos (ex: Terminal > Área A > Sistema A1).
    *   Permite criar, mover, renomear e remover categorias.
    *   Associa equipamentos a categorias.
    *   Busca equipamentos dentro de uma categoria ou subárvore.
*   **`FilterManager`:** Gerencia conjuntos de filtros para encontrar equipamentos específicos.
    *   **Tipos de Filtros:** Suporta filtros por texto, propriedades (com operadores), categoria (com/sem subcategorias), estado, produto e espacial (raio).
    *   **Conjuntos de Filtros:** Permite salvar, nomear, ativar/desativar e combinar múltiplos filtros.
    *   **Aplicação:** Método `applyActiveFilters` retorna os equipamentos que satisfazem o conjunto de filtros ativo.

### 3. Anotações e Documentação Integrada (`js/annotations/annotationManager.ts`)

*   **`AnnotationManager`:** Gerencia anotações associadas a equipamentos ou posições na cena.
    *   **Criação/Edição:** Permite adicionar, remover e atualizar anotações.
    *   **Tipos de Anotação:** Suporta diferentes tipos (nota, aviso, problema, link de documentação, medição) com marcadores visuais distintos.
    *   **Marcadores Visuais:** Cria instâncias de meshes (esferas coloridas) na cena para representar as anotações.
    *   **Integração com DB:** Salva e carrega anotações do banco de dados em memória.
*   **Links de Documentação:**
    *   Campo `documentationUrl` adicionado aos dados do equipamento.
    *   Métodos no `AnnotationManager` para definir e obter a URL de documentação de um equipamento.

### 4. Preparação para Visualização de Dados em Tempo Real (`js/simulation/dataSimulator.ts`)

*   **`DataSimulator`:** Simula atualizações periódicas de dados para equipamentos (nível de tanque, estado de válvula, fluxo/pressão de tubulação).
*   **Padrão Observer:** Usa `Observable` do Babylon.js para notificar outros componentes (ex: UI, visualizadores) sobre atualizações de dados (`onDataUpdateObservable`).
*   **Controle:** Permite iniciar, parar e ajustar a velocidade da simulação.
*   **Estrutura Pronta:** Facilita a substituição futura por uma fonte de dados real (ex: WebSocket, API).

### 5. Versionamento e Navegação Aprimorada (`js/versioning/`, `js/navigation/`)

*   **`VersionManager`:** Gerencia versões conceituais do modelo.
    *   **Metadados:** Cria e lista metadados de versões (ID, nome, timestamp, contagens).
    *   **Versão Ativa:** Permite definir qual versão está ativa para visualização.
    *   **Snapshot (Opcional):** Inclui um método `createSnapshotVersion` para criar cópias reais dos dados para uma versão (consome mais memória).
    *   **Busca por Versão:** Métodos para obter dados de uma versão específica (requer que os dados no DB tenham `versionId`).
*   **`NavigationManager`:** Gerencia pontos de vista e navegação guiada.
    *   **Pontos de Vista:** Permite salvar a posição/rotação/alvo da câmera atual como um ponto de vista nomeado.
    *   **Navegação:** Navega suavemente (com animação opcional) para pontos de vista salvos.
    *   **Foco em Equipamento:** Cria e navega para pontos de vista focados em equipamentos específicos.
    *   **Sequências Guiadas:** Permite criar sequências de etapas, onde cada etapa navega para um ponto de vista por uma duração definida, opcionalmente destacando equipamentos.
    *   **Controle de Sequência:** Inicia e para a reprodução de sequências.

### 6. Simulação de Operações (`js/simulation/operations/operationSimulator.ts`)

*   **`OperationSimulator`:** Simula operações discretas que ocorrem no terminal.
    *   **Operações Suportadas:** Mudança de estado de válvula, transferência de produto entre tanques (simplificada).
    *   **Gerenciamento:** Permite iniciar, cancelar e monitorar o status das operações (pendente, rodando, concluído, falha, cancelado).
    *   **Interação:** Interage com o `DataSimulator` e o `InMemoryDatabase` para refletir as mudanças causadas pelas operações.
    *   **Status e Progresso:** Notifica observadores sobre mudanças no status e progresso das operações (`onOperationStatusChangeObservable`).

## Como Construir e Executar

1.  **Instalar Dependências:**
    ```bash
    cd terminal-3d/terminal-3d
    npm install
    ```
2.  **Compilar TypeScript:**
    ```bash
    npm run build 
    # Ou para compilar e observar mudanças:
    # npm run watch 
    ```
    (Será necessário adicionar os scripts `build` e `watch` ao `package.json`: 
    `"build": "tsc"`, `"watch": "tsc -w"`)

3.  **Executar:** Abra o arquivo `index.html` (localizado em `terminal-3d/terminal-3d/`) em um navegador web. O `index.html` precisará ser atualizado para carregar o JavaScript compilado da pasta `dist/` (ex: `dist/app.js`).

## Próximos Passos Sugeridos

*   **Interface do Usuário (UI):** Desenvolver uma UI (usando HTML/CSS/JS ou um framework como React/Vue/Angular) para interagir com as novas funcionalidades (filtros, categorias, anotações, versionamento, etc.).
*   **Integração Visual:** Conectar as atualizações do `DataSimulator` e `OperationSimulator` a mudanças visuais na cena 3D (ex: mudar cor da válvula, animar nível do tanque).
*   **Testes:** Implementar testes unitários e de integração para garantir a robustez do código.
*   **Persistência:** Substituir o banco de dados em memória por um banco de dados real (PostgreSQL, MongoDB) e uma API backend.
*   **Dados em Tempo Real:** Conectar o `DataSimulator` a uma fonte de dados real.


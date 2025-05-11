# Terminal Viewer - Visualização de Terminal Petroquímico

## Descrição do Projeto

O Terminal Viewer é uma aplicação web que oferece uma visualização tridimensional interativa de um terminal de armazenamento e distribuição de produtos petroquímicos. Desenvolvido com Babylon.js e TypeScript, o projeto permite aos usuários explorar e monitorar os componentes de um terminal.

## Instruções de Instalação e Uso

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Dicommunitas/terminal-3d.git
    cd terminal-viewer/terminal-3d # Navegue para a pasta correta do projeto
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Compile o código TypeScript:**
    ```bash
    npm run build   # Para compilar o projeto
    ```
4.  **Execute um servidor web local:**
    Execute o projeto com Webpack. Para iniciar o servidor de desenvolvimento:
    ```bash
    npm run start
    ```
    Alternativamente, você pode usar para compilação contínua durante o desenvolvimento:
    ```bash
    npm run watch
    ```
    Você pode usar qualquer servidor web simples. Se tiver Python instalado:
    ```bash
    python -m http.server 8000
    ```
    Ou, se tiver Node.js e `http-server` instalado (`npm install -g http-server`):
    ```bash
    http-server -p 8000
    ```
5.  **Acesse no navegador:**
    Abra seu navegador e acesse `http://localhost:8000/index.html` (ou o endereço fornecido pelo seu servidor local).

## Navegação na Cena 3D

-   **Botão esquerdo + arrastar**: Rotacionar a câmera
-   **Roda do mouse**: Zoom in/out
-   **Botão direito + arrastar**: Mover a câmera lateralmente (Pan)
-   **Botão "Resetar Câmera"**: Retorna à visualização inicial

## Principais Funcionalidades

-   **Visualização 3D Completa**: Interface tridimensional que permite navegar livremente pelo terminal, com controles de câmera intuitivos.
-   **Componentes Modelados**: Representação detalhada dos principais elementos do terminal (Tanques, Tubulações, Válvulas, Áreas de Carregamento).
-   **Sistema de Camadas**: Controle de visibilidade dos diferentes componentes.
-   **Modos de Visualização**: Diferentes esquemas de cores para representar tipo de produto, status, etc.
-   **Informações Detalhadas**: Painel informativo que exibe dados ao selecionar equipamentos.
-   **Catalogação e Gerenciamento**: Sistema para organizar e gerenciar os modelos 3D.
-   **Categorias e Filtros**: Organização hierárquica e filtros avançados para busca de equipamentos.
-   **Anotações**: Adição de notas e marcações diretamente no modelo 3D.
-   **Simulação de Dados**: Simulação básica de atualizações de dados (nível, estado).
-   **Simulação de Operações**: Simulação de transferências e mudanças de estado.
-   **Versionamento**: Capacidade de gerenciar versões do modelo.
-   **Navegação Contextual**: Facilita a navegação entre componentes relacionados.

## Tecnologias Utilizadas

-   **Babylon.js**: Engine de renderização 3D para web
-   **TypeScript**: Linguagem de programação principal (superset do JavaScript)
-   **HTML5/CSS3**: Estruturação e estilização da interface
-   **Node.js/npm**: Gerenciamento de pacotes e build
-   **Arquitetura Modular**: Organização do código com padrões de design (Factory, Strategy, Command) para facilitar manutenção e expansão.

## Casos de Uso

O Terminal Viewer foi projetado para atender diversas necessidades:

1.  **Monitoramento Operacional**: Visualização do estado do terminal, incluindo níveis de produto, operações em andamento e status dos equipamentos.
2.  **Treinamento e Familiarização**: Ferramenta educacional para operadores se familiarizarem com o layout e funcionamento do terminal.
3.  **Planejamento de Manutenção**: Identificação visual de equipamentos.
4.  **Simulação de Operações**: Possibilidade de simular operações como transferências e carregamentos.

## Estado Atual

O projeto está em desenvolvimento ativo. As funcionalidades principais foram implementadas e o código foi refatorado para maior robustez e manutenibilidade usando TypeScript e padrões de design. Futuras implementações podem incluir:

-   Integração com sistemas SCADA e dados em tempo real
-   Simulações de fluxo mais avançadas
-   Análises preditivas de manutenção
-   Melhorias na interface do usuário
-   Suporte aprimorado para dispositivos móveis e realidade virtual

## Público-Alvo

-   Operadores de terminais petroquímicos
-   Equipes de manutenção e engenharia
-   Gerentes e supervisores de operações
-   Profissionais em treinamento

O Terminal Viewer representa uma abordagem moderna para a visualização e gestão de terminais, combinando tecnologias web avançadas com necessidades operacionais reais do setor.

## Requisitos Técnicos

-   Navegador moderno com suporte a WebGL (Chrome, Firefox, Edge, Safari)
-   Node.js e npm instalados para build
-   Conexão à internet para carregar as bibliotecas (se não incluídas localmente)
-   Dispositivo com mouse recomendado para melhor experiência de navegação 3D


# Terminal 3D - Protótipo de Visualização de Terminal Petroquímico

## Demonstração Online

**[Acesse a demonstração online do Terminal 3D aqui](https://dicommunitas.github.io/terminal-3d-prototipo/terminal-3d-prototipo/index.html)**

## Descrição do Projeto

O Terminal 3D é um protótipo de aplicação web que oferece uma visualização tridimensional interativa de um terminal de armazenamento e distribuição de produtos petroquímicos. Desenvolvido com Babylon.js, uma poderosa engine de renderização 3D para web, o projeto permite aos usuários explorar e monitorar os componentes de um terminal em tempo real.

## Instruções de Uso

1. **Navegação**: Use o mouse para interagir com a visualização 3D
   - **Botão esquerdo + arrastar**: Rotacionar a câmera
   - **Roda do mouse**: Zoom in/out
   - **Botão direito + arrastar**: Mover a câmera lateralmente
   - **Botão "Resetar Câmera"**: Retorna à visualização inicial

2. **Camadas**: Use o painel de camadas para mostrar/ocultar diferentes componentes do terminal

3. **Modos de Visualização**: Selecione diferentes modos de coloração no menu suspenso

4. **Informações**: Clique em qualquer componente para visualizar suas informações detalhadas

## Principais Funcionalidades

- **Visualização 3D Completa**: Interface tridimensional que permite navegar livremente pelo terminal, com controles de câmera intuitivos para zoom, rotação e deslocamento.

- **Componentes Modelados**: Representação detalhada dos principais elementos do terminal:
  - Tanques de armazenamento (cilíndricos e esféricos)
  - Rede de tubulações
  - Válvulas e conexões
  - Áreas de carregamento (caminhões, ferroviário, marítimo e barcaças)

- **Sistema de Camadas**: Controle de visibilidade dos diferentes componentes (tanques, tubulações, válvulas, áreas de carregamento) através de um painel de camadas.

- **Modos de Visualização**: Diferentes esquemas de cores para representar:
  - Tipo de produto
  - Status operacional
  - Temperatura
  - Visualização padrão

- **Informações Detalhadas**: Painel informativo que exibe dados relevantes ao selecionar qualquer equipamento, incluindo:
  - Identificação e especificações técnicas
  - Status operacional
  - Níveis de produto
  - Dados de manutenção
  - Histórico de operações

- **Simulação de Operações**: Capacidade de simular fluxos nas tubulações e operações de carregamento.

## Tecnologias Utilizadas

- **Babylon.js**: Engine de renderização 3D para web
- **JavaScript**: Linguagem de programação principal
- **HTML5/CSS3**: Estruturação e estilização da interface
- **Arquitetura Modular**: Organização do código em módulos especializados para facilitar manutenção e expansão

## Casos de Uso

O Terminal 3D foi projetado para atender diversas necessidades:

1. **Monitoramento Operacional**: Visualização em tempo real do estado do terminal, incluindo níveis de produto, operações em andamento e status dos equipamentos.

2. **Treinamento e Familiarização**: Ferramenta educacional para novos operadores se familiarizarem com o layout e funcionamento do terminal.

3. **Planejamento de Manutenção**: Identificação visual de equipamentos que necessitam manutenção ou apresentam falhas.

4. **Simulação de Operações**: Possibilidade de simular operações como transferências entre tanques, carregamentos e descarregamentos.

## Estado Atual

O projeto está em fase de protótipo inicial, demonstrando as principais funcionalidades e o potencial da tecnologia. Futuras implementações poderão incluir:

- Integração com sistemas SCADA e dados em tempo real
- Simulações de fluxo mais avançadas
- Análises preditivas de manutenção
- Suporte para dispositivos móveis e realidade virtual

## Público-Alvo

- Operadores de terminais petroquímicos
- Equipes de manutenção e engenharia
- Gerentes e supervisores de operações
- Profissionais em treinamento

O Terminal 3D representa uma abordagem moderna para a visualização e gestão de terminais petroquímicos, combinando tecnologias web avançadas com necessidades operacionais reais do setor.

## Requisitos Técnicos

- Navegador moderno com suporte a WebGL (Chrome, Firefox, Edge, Safari)
- Conexão à internet para carregar as bibliotecas necessárias
- Dispositivo com mouse recomendado para melhor experiência de navegação 3D

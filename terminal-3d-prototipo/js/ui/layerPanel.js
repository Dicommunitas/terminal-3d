/**
 * LayerPanel - Gerenciador do painel de camadas
 * 
 * Responsável por controlar a visibilidade das diferentes camadas
 * de objetos na cena 3D e implementar os modos de visualização.
 */

const LayerPanel = (function() {
    // Variáveis privadas
    let _currentColorMode = 'default';
    
    // Referências aos elementos da interface
    const _layerCheckboxes = {
        tanks: document.getElementById('layerTanks'),
        pipes: document.getElementById('layerPipes'),
        valves: document.getElementById('layerValves'),
        loadingAreas: document.getElementById('layerLoading')
    };
    
    const _colorModeSelect = document.getElementById('colorMode');
    
    // Configuração das camadas
    const _layerConfig = {
        tanks: {
            name: 'Tanques',
            group: null,
            visible: true,
            defaultColor: new BABYLON.Color3(0, 0.47, 0.75) // Azul petróleo
        },
        pipes: {
            name: 'Tubulações',
            group: null,
            visible: true,
            defaultColor: new BABYLON.Color3(0.53, 0.53, 0.53) // Cinza
        },
        valves: {
            name: 'Válvulas',
            group: null,
            visible: true,
            defaultColor: new BABYLON.Color3(0.7, 0.1, 0.1) // Vermelho
        },
        loadingAreas: {
            name: 'Áreas de Carregamento',
            group: null,
            visible: true,
            defaultColor: new BABYLON.Color3(0.7, 0.5, 0.2) // Marrom
        },
ground: {
    name: 'Terreno',
    group: null,
    visible: true,
    defaultColor: new BABYLON.Color3(0.6, 0.6, 0.6) // Cinza
}
    };
    
    /**
     * Inicializa o painel de camadas
     */
function initialize() {
  // Obter referências aos grupos de objetos da cena
  Object.keys(_layerConfig).forEach(key => {
    if (key !== 'ground') {
      _layerConfig[key].group = SceneManager.getGroup(key);
    }
  });

  // Tratar o terreno especificamente
  _layerConfig.ground.group = new BABYLON.TransformNode("groundGroup", SceneManager.scene);
  _layerConfig.ground.group.setEnabled = function(visible) {
    const ground = SceneManager.ground;
    if (ground) {
      ground.setEnabled(visible);
    }
  };

  // Configurar eventos dos controles
  _setupEventListeners();
  
  return Promise.resolve();
}

    
    /**
     * Configura os eventos dos controles do painel
     */
    function _setupEventListeners() {
        // Eventos para checkboxes de camadas
        Object.keys(_layerCheckboxes).forEach(key => {
            const checkbox = _layerCheckboxes[key];
            if (checkbox) {
                checkbox.addEventListener('change', function(e) {
                    toggleLayer(key, e.target.checked);
                });
            }
        });
        
        // Evento para seleção do modo de coloração
        if (_colorModeSelect) {
            _colorModeSelect.addEventListener('change', function(e) {
                setColorMode(e.target.value);
            });
        }
    }
    
    /**
     * Alterna a visibilidade de uma camada
     * @param {string} layerName - Nome da camada
     * @param {boolean} visible - Se a camada deve estar visível
     */
    function toggleLayer(layerName, visible) {
        const layer = _layerConfig[layerName];
        if (!layer || !layer.group) return;
        
        layer.visible = visible;
        layer.group.setEnabled(visible);
        
        // Atualizar o checkbox se necessário (em caso de chamada programática)
        const checkbox = _layerCheckboxes[layerName];
        if (checkbox && checkbox.checked !== visible) {
            checkbox.checked = visible;
        }
        
        // Disparar evento personalizado para notificar outras partes da aplicação
        const event = new CustomEvent('layerVisibilityChanged', {
            detail: { layer: layerName, visible: visible }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Define o modo de coloração dos objetos
     * @param {string} mode - Modo de coloração (default, product, status, temperature)
     */
    function setColorMode(mode) {
        if (_currentColorMode === mode) return;
        
        _currentColorMode = mode;
        
        // Atualizar o select se necessário (em caso de chamada programática)
        if (_colorModeSelect && _colorModeSelect.value !== mode) {
            _colorModeSelect.value = mode;
        }
        
        // Aplicar o modo de coloração através do ColorMapper
        ColorMapper.applyColorMode(mode);
        
        // Disparar evento personalizado para notificar outras partes da aplicação
        const event = new CustomEvent('colorModeChanged', {
            detail: { mode: mode }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Adiciona uma nova camada personalizada ao painel
     * @param {string} id - Identificador único da camada
     * @param {string} name - Nome de exibição da camada
     * @param {BABYLON.Color3} color - Cor indicativa da camada
     * @param {BABYLON.TransformNode} group - Grupo de objetos da camada
     */
    function addCustomLayer(id, name, color, group) {
        // Verificar se a camada já existe
        if (_layerConfig[id]) {
            console.warn(`Camada ${id} já existe e não será sobrescrita`);
            return;
        }
        
        // Adicionar à configuração
        _layerConfig[id] = {
            name: name,
            group: group,
            visible: true,
            defaultColor: color || new BABYLON.Color3(0.5, 0.5, 0.5)
        };
        
        // Criar elemento de interface
        const layerPanel = document.getElementById('layerPanel');
        if (!layerPanel) return;
        
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `layer${id}`;
        checkbox.checked = true;
        
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.backgroundColor = `rgb(${color.r*255}, ${color.g*255}, ${color.b*255})`;
        
        const textNode = document.createTextNode(name);
        
        label.appendChild(checkbox);
        label.appendChild(colorIndicator);
        label.appendChild(textNode);
        layerItem.appendChild(label);
        
        // Inserir antes do separador (se existir) ou no final
        const separator = layerPanel.querySelector('hr');
        if (separator) {
            layerPanel.insertBefore(layerItem, separator);
        } else {
            layerPanel.appendChild(layerItem);
        }
        
        // Adicionar à lista de checkboxes
        _layerCheckboxes[id] = checkbox;
        
        // Configurar evento
        checkbox.addEventListener('change', function(e) {
            toggleLayer(id, e.target.checked);
        });
    }
    
    /**
     * Remove uma camada personalizada do painel
     * @param {string} id - Identificador da camada
     */
    function removeCustomLayer(id) {
        // Verificar se é uma camada padrão (não removível)
        if (['tanks', 'pipes', 'valves', 'loadingAreas'].includes(id)) {
            console.warn(`Não é possível remover a camada padrão ${id}`);
            return;
        }
        
        // Verificar se a camada existe
        if (!_layerConfig[id]) {
            return;
        }
        
        // Remover elemento da interface
        const checkbox = _layerCheckboxes[id];
        if (checkbox) {
            const layerItem = checkbox.closest('.layer-item');
            if (layerItem && layerItem.parentNode) {
                layerItem.parentNode.removeChild(layerItem);
            }
        }
        
        // Remover das referências
        delete _layerCheckboxes[id];
        delete _layerConfig[id];
    }
    
    /**
     * Atualiza a visibilidade de todas as camadas de acordo com os checkboxes
     */
    function refreshLayerVisibility() {
        Object.keys(_layerConfig).forEach(key => {
            const checkbox = _layerCheckboxes[key];
            if (checkbox) {
                toggleLayer(key, checkbox.checked);
            }
        });
    }
    
    /**
     * Adiciona um novo modo de coloração personalizado
     * @param {string} id - Identificador do modo
     * @param {string} name - Nome de exibição do modo
     * @param {Function} colorFunction - Função para calcular cores (recebe objeto e retorna Color3)
     */
    function addCustomColorMode(id, name, colorFunction) {
        // Adicionar ao select de modos
        if (_colorModeSelect) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            _colorModeSelect.appendChild(option);
        }
        
        // Registrar no ColorMapper
        ColorMapper.registerColorMode(id, colorFunction);
    }
    
    /**
     * Expande ou recolhe o painel de camadas
     * @param {boolean} expanded - Se o painel deve estar expandido
     */
    function expandPanel(expanded) {
        const panel = document.getElementById('layerPanel');
        if (!panel) return;
        
        if (expanded) {
            panel.classList.add('expanded');
        } else {
            panel.classList.remove('expanded');
        }
    }
    
    /**
     * Obtém o modo de coloração atual
     * @returns {string} - Modo de coloração atual
     */
    function getCurrentColorMode() {
        return _currentColorMode;
    }
    
    /**
     * Obtém a configuração de uma camada
     * @param {string} layerName - Nome da camada
     * @returns {Object|null} - Configuração da camada ou null se não existir
     */
    function getLayerConfig(layerName) {
        return _layerConfig[layerName] || null;
    }
    
    /**
     * Verifica se uma camada está visível
     * @param {string} layerName - Nome da camada
     * @returns {boolean} - true se a camada estiver visível
     */
    function isLayerVisible(layerName) {
        const layer = _layerConfig[layerName];
        return layer ? layer.visible : false;
    }
    
    // API pública
    return {
        initialize,
        toggleLayer,
        setColorMode,
        addCustomLayer,
        removeCustomLayer,
        refreshLayerVisibility,
        addCustomColorMode,
        expandPanel,
        getCurrentColorMode,
        getLayerConfig,
        isLayerVisible
    };
})();

/**
 * InfoPanel - Gerenciador do painel de informações
 * 
 * Responsável por exibir informações detalhadas sobre os objetos
 * selecionados na cena 3D, incluindo propriedades, estados e dados
 * operacionais.
 */

const InfoPanel = (function() {
    // Variáveis privadas
    let _currentObject = null;
    let _isVisible = false;
    
    // Referências aos elementos da interface
    const _panel = document.getElementById('infoPanel');
    const _titleElement = document.getElementById('infoTitle');
    const _contentElement = document.getElementById('infoContent');
    const _closeButton = document.getElementById('closeInfo');
    const _detailsButton = document.getElementById('viewDetails');
    
    // Configuração para formatação de dados por tipo de objeto
    const _formatConfig = {
        tank: {
            icon: '🛢️',
            title: 'Tanque',
            properties: {
                capacity: { label: 'Capacidade', format: 'volume' },
                product: { label: 'Produto', format: 'text' },
                level: { label: 'Nível', format: 'percentage' },
                temperature: { label: 'Temperatura', format: 'temperature' },
                status: { label: 'Status', format: 'status' },
                lastInspection: { label: 'Última Inspeção', format: 'date' }
            }
        },
        pipe: {
            icon: '🔄',
            title: 'Tubulação',
            properties: {
                diameter: { label: 'Diâmetro', format: 'dimension' },
                product: { label: 'Produto', format: 'text' },
                flow: { label: 'Vazão', format: 'flow' },
                pressure: { label: 'Pressão', format: 'pressure' },
                temperature: { label: 'Temperatura', format: 'temperature' },
                material: { label: 'Material', format: 'text' }
            }
        },
        valve: {
            icon: '🔵',
            title: 'Válvula',
            properties: {
                type: { label: 'Tipo', format: 'text' },
                state: { label: 'Estado', format: 'valveState' },
                diameter: { label: 'Diâmetro', format: 'dimension' },
                lastMaintenance: { label: 'Última Manutenção', format: 'date' },
                manufacturer: { label: 'Fabricante', format: 'text' },
                installDate: { label: 'Data de Instalação', format: 'date' }
            }
        },
        loadingArea: {
            icon: '🚚',
            title: 'Área de Carregamento',
            properties: {
                areaType: { label: 'Tipo', format: 'loadingAreaType' },
                state: { label: 'Estado', format: 'loadingAreaState' },
                capacity: { label: 'Capacidade', format: 'volume' },
                lastOperation: { label: 'Última Operação', format: 'datetime' },
                nextScheduled: { label: 'Próx. Agendamento', format: 'datetime' }
            }
        }
    };
    
    /**
     * Inicializa o painel de informações
     */
    function initialize() {
        // Configurar eventos
        if (_closeButton) {
            _closeButton.addEventListener('click', hide);
        }
        
        if (_detailsButton) {
            _detailsButton.addEventListener('click', showDetailedView);
        }
        
        // Esconder o painel inicialmente
        hide();
        
        // Registrar para eventos de seleção de objetos
        document.addEventListener('objectSelected', handleObjectSelected);
        document.addEventListener('objectDeselected', handleObjectDeselected);
        
        return Promise.resolve();
    }
    
    /**
     * Manipula o evento de seleção de objeto
     * @param {CustomEvent} event - Evento de seleção
     */
    function handleObjectSelected(event) {
        if (!event.detail || !event.detail.object) return;
        
        const object = event.detail.object;
        showObjectInfo(object);
    }
    
    /**
     * Manipula o evento de desseleção de objeto
     */
    function handleObjectDeselected() {
        hide();
    }
    
    /**
     * Exibe informações sobre um objeto
     * @param {BABYLON.AbstractMesh|BABYLON.TransformNode} object - Objeto selecionado
     */
    function showObjectInfo(object) {
        if (!object || !object.metadata) {
            hide();
            return;
        }
        
        _currentObject = object;
        
        // Determinar o tipo de objeto
        const objectType = object.metadata.type || 'unknown';
        const objectId = object.metadata.id || object.name;
        const objectData = object.metadata.data || {};
        
        // Obter configuração de formatação para este tipo
        const formatInfo = _formatConfig[objectType] || {
            icon: '❓',
            title: 'Objeto',
            properties: {}
        };
        
        // Definir título
        const title = `${formatInfo.icon} ${formatInfo.title} ${objectId}`;
        if (_titleElement) {
            _titleElement.textContent = title;
        }
        
        // Gerar conteúdo
        if (_contentElement) {
            _contentElement.innerHTML = '';
            
            // Criar tabela de propriedades
            const table = document.createElement('table');
            
            // Adicionar propriedades comuns
            _addPropertyRow(table, 'ID', objectId);
            _addPropertyRow(table, 'Tipo', _formatObjectType(objectType));
            
            // Adicionar propriedades específicas do tipo de objeto
            for (const [key, config] of Object.entries(formatInfo.properties)) {
                if (objectData[key] !== undefined) {
                    const formattedValue = _formatValue(objectData[key], config.format);
                    _addPropertyRow(table, config.label, formattedValue);
                }
            }
            
            // Adicionar propriedades adicionais não mapeadas
            const mappedProps = Object.keys(formatInfo.properties);
            for (const [key, value] of Object.entries(objectData)) {
                if (!mappedProps.includes(key) && key !== 'id' && key !== 'type') {
                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                    _addPropertyRow(table, formattedKey, value);
                }
            }
            
            _contentElement.appendChild(table);
            
            // Adicionar indicadores visuais com base no estado
            if (objectData.state) {
                const stateIndicator = document.createElement('div');
                stateIndicator.className = 'state-indicator';
                
                const stateClass = `state-${objectData.state.toLowerCase().replace(/\s+/g, '-')}`;
                stateIndicator.innerHTML = `
                    <span class="status-indicator ${stateClass}"></span>
                    <span class="status-text">${_formatValue(objectData.state, 'status')}</span>
                `;
                
                _contentElement.appendChild(stateIndicator);
            }
            
            // Adicionar ações específicas com base no tipo
            const actionsDiv = _createActionsForObject(objectType, objectId);
            if (actionsDiv) {
                _contentElement.appendChild(actionsDiv);
            }
        }
        
        // Mostrar o painel
        show();
    }
    
    /**
     * Adiciona uma linha de propriedade à tabela
     * @param {HTMLTableElement} table - Tabela de propriedades
     * @param {string} label - Rótulo da propriedade
     * @param {string} value - Valor formatado da propriedade
     */
    function _addPropertyRow(table, label, value) {
        const row = document.createElement('tr');
        
        const labelCell = document.createElement('td');
        labelCell.textContent = label;
        
        const valueCell = document.createElement('td');
        
        // Verificar se o valor já é um HTML ou um texto simples
        if (typeof value === 'string' && value.includes('<')) {
            valueCell.innerHTML = value;
        } else {
            valueCell.textContent = value;
        }
        
        row.appendChild(labelCell);
        row.appendChild(valueCell);
        table.appendChild(row);
    }
    
    /**
     * Formata um valor com base no tipo de formatação
     * @param {any} value - Valor a ser formatado
     * @param {string} format - Tipo de formatação
     * @returns {string} - Valor formatado
     */
    function _formatValue(value, format) {
        if (value === null || value === undefined) {
            return '-';
        }
        
        switch (format) {
            case 'volume':
                return typeof value === 'number' 
                    ? `${value.toLocaleString()} m³` 
                    : value;
            
            case 'percentage':
                if (typeof value === 'number') {
                    return `${(value * 100).toFixed(1)}%`;
                } else if (typeof value === 'string' && value.endsWith('%')) {
                    return value;
                } else {
                    return `${value}%`;
                }
            
            case 'temperature':
                return typeof value === 'number' 
                    ? `${value.toFixed(1)}°C` 
                    : value;
            
            case 'pressure':
                return typeof value === 'number' 
                    ? `${value.toFixed(2)} kgf/cm²` 
                    : value;
            
            case 'flow':
                return typeof value === 'number' 
                    ? `${value.toFixed(1)} m³/h` 
                    : value;
            
            case 'dimension':
                return typeof value === 'number' 
                    ? `${value.toFixed(2)} m` 
                    : value;
            
            case 'date':
                if (value instanceof Date) {
                    return value.toLocaleDateString('pt-BR');
                } else if (typeof value === 'number') {
                    return new Date(value).toLocaleDateString('pt-BR');
                } else {
                    return value;
                }
            
            case 'datetime':
                if (value instanceof Date) {
                    return value.toLocaleString('pt-BR');
                } else if (typeof value === 'number') {
                    return new Date(value).toLocaleString('pt-BR');
                } else {
                    return value;
                }
            
            case 'status':
                return _formatStatus(value);
            
            case 'valveState':
                return _formatValveState(value);
            
            case 'loadingAreaState':
                return _formatLoadingAreaState(value);
            
            case 'loadingAreaType':
                return _formatLoadingAreaType(value);
            
            default:
                return value;
        }
    }
    
    /**
     * Formata um valor de status com indicador visual
     * @param {string} status - Valor do status
     * @returns {string} - HTML formatado
     */
    function _formatStatus(status) {
        let color;
        
        switch (String(status).toLowerCase()) {
            case 'operational':
            case 'em operação':
            case 'disponível':
            case 'available':
            case 'active':
            case 'ativo':
                color = '#4CAF50'; // Verde
                break;
            
            case 'maintenance':
            case 'em manutenção':
            case 'warning':
            case 'alerta':
                color = '#FFC107'; // Amarelo
                break;
            
            case 'fault':
            case 'falha':
            case 'error':
            case 'erro':
            case 'offline':
            case 'unavailable':
            case 'indisponível':
                color = '#F44336'; // Vermelho
                break;
            
            case 'standby':
            case 'em espera':
            case 'idle':
            case 'ocioso':
                color = '#2196F3'; // Azul
                break;
            
            default:
            color = '#9E9E9E'; // Cinza
        }
        return `<span class="status-indicator" style="background-color: ${color}"></span> ${status}`;
     } // Adicionar este fechamento de chave
    
    /**
     * Formata o estado de uma válvula com indicador visual
     * @param {string} state - Estado da válvula
     * @returns {string} - HTML formatado
     */
    function _formatValveState(state) {
        let color;
        let label = state;
        
        switch (String(state).toLowerCase()) {
            case 'open':
            case 'aberta':
                color = '#4CAF50'; // Verde
                label = 'Aberta';
                break;
            
            case 'closed':
            case 'fechada':
                color = '#F44336'; // Vermelho
                label = 'Fechada';
                break;
            
            case 'partial':
            case 'parcial':
                color = '#FFC107'; // Amarelo
                label = 'Parcialmente Aberta';
                break;
            
            case 'maintenance':
            case 'em manutenção':
                color = '#2196F3'; // Azul
                label = 'Em Manutenção';
                break;
            
            case 'fault':
            case 'falha':
                color = '#FF5722'; // Laranja
                label = 'Falha';
                break;
            
            default:
                color = '#9E9E9E'; // Cinza
        }
        
        return `<span class="status-indicator" style="background-color: ${color}"></span> ${label}`;
    }
    
    /**
     * Formata o estado de uma área de carregamento com indicador visual
     * @param {string} state - Estado da área
     * @returns {string} - HTML formatado
     */
    function _formatLoadingAreaState(state) {
        let color;
        let label = state;
        
        switch (String(state).toLowerCase()) {
            case 'available':
            case 'disponível':
                color = '#4CAF50'; // Verde
                label = 'Disponível';
                break;
            
            case 'loading':
            case 'em carregamento':
                color = '#FFC107'; // Amarelo
                label = 'Em Carregamento';
                break;
            
            case 'maintenance':
            case 'em manutenção':
                color = '#2196F3'; // Azul
                label = 'Em Manutenção';
                break;
            
            case 'unavailable':
            case 'indisponível':
                color = '#F44336'; // Vermelho
                label = 'Indisponível';
                break;
            
            default:
                color = '#9E9E9E'; // Cinza
        }
        
        return `<span class="status-indicator" style="background-color: ${color}"></span> ${label}`;
    }
    
    /**
     * Formata o tipo de área de carregamento
     * @param {string} type - Tipo da área
     * @returns {string} - Tipo formatado
     */
    function _formatLoadingAreaType(type) {
        switch (String(type).toLowerCase()) {
            case 'truckbay':
                return 'Baia de Caminhões';
            case 'railloading':
                return 'Carregamento Ferroviário';
            case 'marinepier':
                return 'Píer Marítimo';
            case 'bargedock':
                return 'Doca de Barcaças';
            default:
                return type;
        }
    }
    
    /**
     * Formata o tipo de objeto
     * @param {string} objectType - Tipo do objeto
     * @returns {string} - Tipo formatado
     */
    function _formatObjectType(objectType) {
        switch (objectType) {
            case 'tank':
                return 'Tanque';
            case 'pipe':
                return 'Tubulação';
            case 'valve':
                return 'Válvula';
            case 'loadingArea':
                return 'Área de Carregamento';
            default:
                return objectType;
        }
    }
    
    /**
     * Cria botões de ação específicos para o tipo de objeto
     * @param {string} objectType - Tipo do objeto
     * @param {string} objectId - ID do objeto
     * @returns {HTMLElement|null} - Elemento com as ações ou null
     */
    function _createActionsForObject(objectType, objectId) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'object-actions';
        
        let hasActions = false;
        
        switch (objectType) {
            case 'tank':
                // Ações para tanques
                const viewLevelHistoryBtn = _createActionButton('Histórico de Nível', () => {
                    alert(`Visualizando histórico de nível para ${objectId}`);
                    // Aqui poderia abrir um modal ou navegar para uma tela de histórico
                });
                
                const viewTemperatureBtn = _createActionButton('Gráfico de Temperatura', () => {
                    alert(`Visualizando gráfico de temperatura para ${objectId}`);
                    // Aqui poderia abrir um modal com gráfico
                });
                
                actionsDiv.appendChild(viewLevelHistoryBtn);
                actionsDiv.appendChild(viewTemperatureBtn);
                hasActions = true;
                break;
                
            case 'valve':
                // Ações para válvulas
                if (_currentObject && _currentObject.metadata && _currentObject.metadata.state) {
                    const currentState = _currentObject.metadata.state;
                    
                    if (currentState !== 'maintenance' && currentState !== 'fault') {
                        const toggleValveBtn = _createActionButton(
                            currentState === 'open' ? 'Fechar Válvula' : 'Abrir Válvula', 
                            () => {
                                const newState = currentState === 'open' ? 'closed' : 'open';
                                ValvesManager.changeValveState(objectId, newState, true);
                                // Atualizar o painel após mudança
                                setTimeout(() => showObjectInfo(_currentObject), 100);
                            }
                        );
                        actionsDiv.appendChild(toggleValveBtn);
                        hasActions = true;
                    }
                    
                    const viewHistoryBtn = _createActionButton('Histórico de Operações', () => {
                        alert(`Visualizando histórico de operações para ${objectId}`);
                    });
                    actionsDiv.appendChild(viewHistoryBtn);
                    hasActions = true;
                }
                break;
                
            case 'pipe':
                // Ações para tubulações
                const simulateFlowBtn = _createActionButton('Simular Fluxo', () => {
                    PipesManager.simulateFlow(objectId, 1.0, true);
                    setTimeout(() => {
                        alert(`Simulação de fluxo iniciada em ${objectId}`);
                    }, 100);
                });
                
                const stopFlowBtn = _createActionButton('Parar Fluxo', () => {
                    PipesManager.simulateFlow(objectId, 0, false);
                    setTimeout(() => {
                        alert(`Fluxo interrompido em ${objectId}`);
                    }, 100);
                });
                
                actionsDiv.appendChild(simulateFlowBtn);
                actionsDiv.appendChild(stopFlowBtn);
                hasActions = true;
                break;
                
            case 'loadingArea':
                // Ações para áreas de carregamento
                if (_currentObject && _currentObject.metadata && _currentObject.metadata.state) {
                    const currentState = _currentObject.metadata.state;
                    
                    if (currentState === 'available') {
                        const startLoadingBtn = _createActionButton('Iniciar Carregamento', () => {
                            LoadingAreasManager.simulateLoading(objectId, true);
                            setTimeout(() => {
                                showObjectInfo(_currentObject);
                            }, 100);
                        });
                        actionsDiv.appendChild(startLoadingBtn);
                        hasActions = true;
                    } else if (currentState === 'loading') {
                        const stopLoadingBtn = _createActionButton('Finalizar Carregamento', () => {
                            LoadingAreasManager.simulateLoading(objectId, false);
                            setTimeout(() => {
                                showObjectInfo(_currentObject);
                            }, 100);
                        });
                        actionsDiv.appendChild(stopLoadingBtn);
                        hasActions = true;
                    }
                    
                    const viewScheduleBtn = _createActionButton('Ver Agendamentos', () => {
                        alert(`Visualizando agendamentos para ${objectId}`);
                    });
                    actionsDiv.appendChild(viewScheduleBtn);
                    hasActions = true;
                }
                break;
        }
        
        return hasActions ? actionsDiv : null;
    }
    
    /**
     * Cria um botão de ação
     * @param {string} label - Texto do botão
     * @param {Function} clickHandler - Função de clique
     * @returns {HTMLButtonElement} - Botão criado
     */
    function _createActionButton(label, clickHandler) {
        const button = document.createElement('button');
        button.className = 'action-btn';
        button.textContent = label;
        button.addEventListener('click', clickHandler);
        return button;
    }
    
    /**
     * Mostra o painel de informações
     */
    function show() {
        if (!_panel) return;
        
        _panel.style.display = 'block';
        _isVisible = true;
        
        // Adicionar efeito de entrada
        setTimeout(() => {
            _panel.classList.add('visible');
        }, 10);
        
        // Disparar evento
        const event = new CustomEvent('infoPanelShown', {
            detail: { object: _currentObject }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Esconde o painel de informações
     */
    function hide() {
        if (!_panel) return;
        
        _panel.classList.remove('visible');
        
        // Aguardar a transição terminar antes de esconder completamente
        setTimeout(() => {
            if (!_panel.classList.contains('visible')) {
                _panel.style.display = 'none';
                _isVisible = false;
            }
        }, 300);
        
        // Limpar objeto atual
        _currentObject = null;
        
        // Disparar evento
        const event = new CustomEvent('infoPanelHidden');
        document.dispatchEvent(event);
    }
    
    /**
     * Abre uma visualização detalhada do objeto atual
     */
    function showDetailedView() {
        if (!_currentObject) return;
        
        const objectType = _currentObject.metadata.type || 'unknown';
        const objectId = _currentObject.metadata.id || _currentObject.name;
        
        // Aqui poderia abrir uma nova página, um modal, ou expandir o painel
        alert(`Visualização detalhada para ${objectType} ${objectId} será implementada em uma versão futura.`);
        
        // Exemplo de como poderia ser implementado:
        // window.open(`details.html?type=${objectType}&id=${objectId}`, '_blank');
    }
    
    /**
     * Atualiza o conteúdo do painel se o mesmo objeto ainda estiver selecionado
     * @param {string} objectId - ID do objeto a atualizar
     */
    function updateIfCurrent(objectId) {
        if (_currentObject && _currentObject.metadata && _currentObject.metadata.id === objectId) {
            showObjectInfo(_currentObject);
        }
    }
    
    /**
     * Verifica se o painel está visível
     * @returns {boolean} - true se o painel estiver visível
     */
    function isVisible() {
        return _isVisible;
    }
    
    /**
     * Obtém o objeto atualmente exibido
     * @returns {BABYLON.AbstractMesh|BABYLON.TransformNode|null} - Objeto atual ou null
     */
    function getCurrentObject() {
        return _currentObject;
    }
    
    /**
     * Registra um novo tipo de objeto com sua configuração de formatação
     * @param {string} objectType - Tipo de objeto
     * @param {Object} config - Configuração de formatação
     */
    function registerObjectType(objectType, config) {
        if (!objectType || !config) return;
        
        _formatConfig[objectType] = {
            icon: config.icon || '❓',
            title: config.title || objectType,
            properties: config.properties || {}
        };
    }
    
    // API pública
    return {
        initialize,
        show,
        hide,
        showObjectInfo,
        showDetailedView,
        updateIfCurrent,
        isVisible,
        getCurrentObject,
        registerObjectType
    };
})();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectPicker = void 0;
const core_1 = require("@babylonjs/core");
/**
 * ObjectPicker - Utilitário para seleção de objetos na cena 3D
 *
 * Responsável por gerenciar a interação do usuário com objetos na cena,
 * incluindo seleção, destaque visual e rastreamento do objeto selecionado.
 */
class ObjectPicker {
    constructor(scene, canvas) {
        this._selectedObject = null;
        this._pointerDownObserver = null;
        this._pointerMoveObserver = null;
        this._enabled = true;
        this._config = {
            highlightColor: new core_1.Color3(1, 0.8, 0.2), // Amarelo
            highlightIntensity: 0.5, // Intensidade não é diretamente usada por HighlightLayer da mesma forma
            outlineWidth: 0.02,
            tooltipDelay: 1000, // Milissegundos para mostrar tooltip
            selectionMode: 'click', // 'click' ou 'hover'
            hoverHighlight: true,
            clickSound: null // Caminho para som de clique (opcional)
        };
        this._hoveredObject = null;
        this._tooltipTimeout = null;
        this._currentTooltip = null;
        this._clickSound = null;
        // Usar arrow function para manter o 'this' correto no event listener
        this._handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        };
        // Usar arrow function para manter o 'this' correto no event listener
        this._clearHoverState = () => {
            if (this._hoveredObject) {
                if (this._hoveredObject !== this._selectedObject) {
                    this._removeHighlight(this._hoveredObject);
                }
                this._hoveredObject = null;
            }
            if (this._tooltipTimeout) {
                clearTimeout(this._tooltipTimeout);
                this._tooltipTimeout = null;
            }
            if (this._currentTooltip) {
                document.body.removeChild(this._currentTooltip);
                this._currentTooltip = null;
            }
            this._canvas.style.cursor = 'default';
        };
        this._scene = scene;
        this._canvas = canvas;
        // Criar camada de destaque
        this._highlightLayer = new core_1.HighlightLayer("selectionHighlight", this._scene);
        this._highlightLayer.innerGlow = false;
        this._highlightLayer.outerGlow = true;
        // Configurar observadores de eventos
        this._setupEventObservers();
        // Configurar som de clique (opcional)
        if (this._config.clickSound) {
            this._loadSoundEffect(this._config.clickSound);
        }
        console.log("ObjectPicker inicializado.");
    }
    /**
     * Configura os observadores de eventos para interação
     */
    _setupEventObservers() {
        // Limpar observadores existentes se houver
        if (this._pointerDownObserver) {
            this._scene.onPointerObservable.remove(this._pointerDownObserver);
        }
        if (this._pointerMoveObserver) {
            this._scene.onPointerObservable.remove(this._pointerMoveObserver);
        }
        // Observador para cliques
        this._pointerDownObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (!this._enabled)
                return;
            if (pointerInfo.type === core_1.PointerEventTypes.POINTERDOWN) {
                this._handlePointerDown(pointerInfo);
            }
        });
        // Observador para movimento do mouse (hover)
        this._pointerMoveObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (!this._enabled)
                return;
            if (pointerInfo.type === core_1.PointerEventTypes.POINTERMOVE) {
                this._handlePointerMove(pointerInfo);
            }
        });
        // Evento para quando o mouse sai do canvas
        this._canvas.addEventListener('mouseout', this._clearHoverState);
        // Evento para tecla ESC (cancelar seleção)
        window.addEventListener('keydown', this._handleKeyDown);
    }
    /**
     * Manipula eventos de clique do mouse
     * @param pointerInfo - Informações do evento
     */
    _handlePointerDown(pointerInfo) {
        var _a;
        if (pointerInfo.event.button !== 0)
            return; // Botão principal
        const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => mesh.isPickable && mesh.isVisible // Adicionar verificação de visibilidade
        );
        if ((pickResult === null || pickResult === void 0 ? void 0 : pickResult.hit) && pickResult.pickedMesh) {
            this._processSelection(pickResult.pickedMesh);
            (_a = this._clickSound) === null || _a === void 0 ? void 0 : _a.play();
        }
        else {
            this.clearSelection();
        }
    }
    /**
     * Manipula eventos de movimento do mouse
     * @param pointerInfo - Informações do evento
     */
    _handlePointerMove(pointerInfo) {
        const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => mesh.isPickable && mesh.isVisible);
        const pickedMesh = pickResult === null || pickResult === void 0 ? void 0 : pickResult.pickedMesh;
        if (pickedMesh) {
            const targetObject = this._findObjectWithMetadata(pickedMesh);
            if (this._hoveredObject !== targetObject) {
                this._clearHoverState();
                this._hoveredObject = targetObject;
                if (this._config.hoverHighlight && targetObject !== this._selectedObject) {
                    this._addHighlight(targetObject);
                }
                this._tooltipTimeout = setTimeout(() => {
                    this._showTooltip(targetObject, pointerInfo.event);
                }, this._config.tooltipDelay);
                this._canvas.style.cursor = 'pointer';
                if (this._config.selectionMode === 'hover') {
                    this._processSelection(targetObject);
                }
            }
            else {
                if (this._currentTooltip) {
                    this._updateTooltipPosition(pointerInfo.event);
                }
            }
        }
        else {
            this._clearHoverState();
        }
    }
    /**
     * Processa a seleção de um objeto
     * @param targetObject - O objeto (mesh ou nó pai com metadados) selecionado
     */
    _processSelection(targetObject) {
        if (targetObject === this._selectedObject)
            return;
        this.clearSelection();
        this._selectedObject = targetObject;
        this._addHighlight(targetObject);
        const metadata = targetObject.metadata;
        const objectId = (metadata === null || metadata === void 0 ? void 0 : metadata.id) || targetObject.name;
        // Atualizar barra de status (assumindo que existe)
        const statusElement = document.getElementById('selectedObject');
        if (statusElement) {
            if (metadata) {
                const type = metadata.type || 'objeto';
                statusElement.textContent = `Selecionado: ${this._formatType(type)} ${objectId}`;
            }
            else {
                statusElement.textContent = `Selecionado: ${targetObject.name || 'Objeto sem nome'}`;
            }
        }
        // Disparar evento de seleção
        const event = new CustomEvent('objectSelected', {
            detail: {
                object: targetObject,
                mesh: targetObject instanceof core_1.AbstractMesh ? targetObject : null // Passa o mesh original se possível
            }
        });
        document.dispatchEvent(event);
        // Armazenar referência global (provisório)
        if (typeof Terminal3D !== 'undefined') {
            Terminal3D.selectedObjectId = objectId;
        }
    }
    /**
     * Mostra um tooltip para o objeto
     * @param targetObject - O objeto sob hover
     * @param event - Evento do mouse
     */
    _showTooltip(targetObject, event) {
        if (this._currentTooltip) {
            document.body.removeChild(this._currentTooltip);
            this._currentTooltip = null;
        }
        const metadata = targetObject.metadata;
        let tooltipContent = '';
        if (metadata) {
            const type = metadata.type || 'Objeto';
            const id = metadata.id || targetObject.name;
            tooltipContent = `<strong>${this._formatType(type)}: ${id}</strong>`;
            if (metadata.data) {
                const data = metadata.data;
                if (data.product)
                    tooltipContent += `<br>Produto: ${data.product}`;
                if (data.state)
                    tooltipContent += `<br>Estado: ${data.state}`;
                if (data.level !== undefined) {
                    const level = typeof data.level === 'number' ? `${(data.level * 100).toFixed(0)}%` : data.level;
                    tooltipContent += `<br>Nível: ${level}`;
                }
                if (data.temperature !== undefined)
                    tooltipContent += `<br>Temp: ${data.temperature.toFixed(1)}°C`;
                if (data.pressure !== undefined)
                    tooltipContent += `<br>Pressão: ${data.pressure.toFixed(1)} bar`;
            }
        }
        else {
            tooltipContent = `<strong>${targetObject.name || 'Objeto'}</strong>`;
        }
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip'; // Assume que a classe CSS 'tooltip' existe
        tooltip.innerHTML = tooltipContent;
        document.body.appendChild(tooltip);
        this._positionTooltip(tooltip, event);
        this._currentTooltip = tooltip;
    }
    /**
     * Posiciona o tooltip próximo ao cursor
     * @param tooltip - Elemento do tooltip
     * @param event - Evento do mouse
     */
    _positionTooltip(tooltip, event) {
        const x = event.clientX;
        const y = event.clientY;
        const margin = 10;
        tooltip.style.position = 'fixed'; // Use fixed para evitar problemas com scroll
        tooltip.style.left = `${x + margin}px`;
        tooltip.style.top = `${y + margin}px`;
        tooltip.style.zIndex = '10000'; // Garantir que fique na frente
        // Ajustar se estiver fora da tela (após renderização inicial)
        requestAnimationFrame(() => {
            const rect = tooltip.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            let finalX = x + margin;
            let finalY = y + margin;
            if (rect.right > windowWidth - margin) {
                finalX = x - rect.width - margin;
            }
            if (rect.bottom > windowHeight - margin) {
                finalY = y - rect.height - margin;
            }
            // Evitar posição negativa
            if (finalX < margin)
                finalX = margin;
            if (finalY < margin)
                finalY = margin;
            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        });
    }
    /**
     * Atualiza a posição do tooltip existente
     * @param event - Evento do mouse
     */
    _updateTooltipPosition(event) {
        if (!this._currentTooltip)
            return;
        this._positionTooltip(this._currentTooltip, event);
    }
    /**
     * Formata o tipo de objeto para exibição
     * @param type - Tipo do objeto
     * @returns Tipo formatado
     */
    _formatType(type) {
        if (!type)
            return 'Objeto';
        const lowerType = type.toLowerCase();
        switch (lowerType) {
            case 'tank': return 'Tanque';
            case 'pipe': return 'Tubulação';
            case 'valve': return 'Válvula';
            case 'loadingarea': return 'Área de Carregamento';
            // Adicionar outros tipos conforme necessário
            default:
                // Capitalizar primeira letra
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }
    /**
     * Carrega um efeito sonoro para feedback de clique
     * @param soundUrl - URL do arquivo de som
     */
    _loadSoundEffect(soundUrl) {
        this._clickSound = new core_1.Sound("clickSound", soundUrl, this._scene, null, {
            volume: 0.5,
            autoplay: false,
            loop: false
        });
    }
    /**
     * Limpa a seleção atual
     */
    clearSelection() {
        if (this._selectedObject) {
            this._removeHighlight(this._selectedObject);
            this._selectedObject = null;
            const statusElement = document.getElementById('selectedObject');
            if (statusElement) {
                statusElement.textContent = 'Nenhum objeto selecionado';
            }
            if (typeof Terminal3D !== 'undefined') {
                Terminal3D.selectedObjectId = null;
            }
            const event = new CustomEvent('objectDeselected');
            document.dispatchEvent(event);
        }
    }
    /**
     * Seleciona um objeto específico por ID
     * @param objectId - ID do objeto a ser selecionado
     * @returns true se o objeto foi encontrado e selecionado
     */
    selectObjectById(objectId) {
        var _a;
        if (!objectId)
            return false;
        // Procurar em todos os nós da cena (incluindo TransformNodes)
        const targetNode = this._scene.getTransformNodeById(objectId) || this._scene.getMeshById(objectId);
        if (targetNode) {
            // Encontrou um nó com o ID, verificar se tem metadados ou é selecionável
            const objectToSelect = this._findObjectWithMetadata(targetNode);
            if (objectToSelect.isPickable || objectToSelect.metadata) {
                this._processSelection(objectToSelect);
                // Opcional: Focar a câmera no objeto selecionado
                // CommandInvoker.executeCommand(new FocusObjectCommand(this._scene.activeCamera as ArcRotateCamera, objectToSelect));
                return true;
            }
        }
        // Fallback: Procurar por metadados em todos os meshes (menos eficiente)
        for (const mesh of this._scene.meshes) {
            const objectWithMetadata = this._findObjectWithMetadata(mesh);
            if (((_a = objectWithMetadata.metadata) === null || _a === void 0 ? void 0 : _a.id) === objectId) {
                this._processSelection(objectWithMetadata);
                return true;
            }
        }
        console.warn(`Objeto com ID '${objectId}' não encontrado para seleção.`);
        return false;
    }
    /**
     * Habilita o seletor de objetos
     */
    enable() {
        this._enabled = true;
        this._canvas.style.cursor = 'default';
    }
    /**
     * Desabilita o seletor de objetos
     */
    disable() {
        this._enabled = false;
        this._clearHoverState();
        this.clearSelection();
        this._canvas.style.cursor = 'not-allowed';
    }
    /**
     * Retorna o objeto atualmente selecionado
     * @returns O objeto selecionado (mesh ou nó pai com metadados) ou null
     */
    getSelectedObject() {
        return this._selectedObject;
    }
    /**
     * Adiciona destaque visual a um objeto
     * @param targetObject - O objeto a ser destacado
     */
    _addHighlight(targetObject) {
        if (targetObject instanceof core_1.AbstractMesh) {
            this._highlightLayer.addMesh(targetObject, this._config.highlightColor);
            targetObject.renderOutline = true;
            targetObject.outlineColor = this._config.highlightColor;
            targetObject.outlineWidth = this._config.outlineWidth;
        }
        else if (targetObject instanceof core_1.TransformNode) {
            // Aplicar aos meshes filhos
            targetObject.getChildMeshes(false).forEach(mesh => {
                if (mesh.isPickable) { // Destacar apenas filhos selecionáveis?
                    this._highlightLayer.addMesh(mesh, this._config.highlightColor);
                    mesh.renderOutline = true;
                    mesh.outlineColor = this._config.highlightColor;
                    mesh.outlineWidth = this._config.outlineWidth;
                }
            });
        }
    }
    /**
     * Remove destaque visual de um objeto
     * @param targetObject - O objeto a ter o destaque removido
     */
    _removeHighlight(targetObject) {
        if (targetObject instanceof core_1.AbstractMesh) {
            this._highlightLayer.removeMesh(targetObject);
            targetObject.renderOutline = false;
        }
        else if (targetObject instanceof core_1.TransformNode) {
            targetObject.getChildMeshes(false).forEach(mesh => {
                this._highlightLayer.removeMesh(mesh);
                mesh.renderOutline = false;
            });
        }
    }
    /**
     * Encontra o nó pai (ou o próprio nó) que contém os metadados relevantes
     * @param startingNode - O nó (geralmente mesh) a partir do qual começar a busca
     * @returns O nó com metadados ou o nó inicial se nenhum for encontrado
     */
    _findObjectWithMetadata(startingNode) {
        var _a;
        let currentNode = startingNode;
        while (currentNode) {
            if ((_a = currentNode.metadata) === null || _a === void 0 ? void 0 : _a.id) {
                return currentNode;
            }
            currentNode = currentNode.parent;
        }
        return startingNode; // Retorna o nó original se não encontrar metadados na hierarquia
    }
    /**
     * Limpa os recursos ao descartar o picker
     */
    dispose() {
        var _a;
        if (this._pointerDownObserver) {
            this._scene.onPointerObservable.remove(this._pointerDownObserver);
            this._pointerDownObserver = null;
        }
        if (this._pointerMoveObserver) {
            this._scene.onPointerObservable.remove(this._pointerMoveObserver);
            this._pointerMoveObserver = null;
        }
        this._canvas.removeEventListener('mouseout', this._clearHoverState);
        window.removeEventListener('keydown', this._handleKeyDown);
        this._highlightLayer.dispose();
        (_a = this._clickSound) === null || _a === void 0 ? void 0 : _a.dispose();
        this._clearHoverState();
        this.clearSelection();
        console.log("ObjectPicker descartado.");
    }
}
exports.ObjectPicker = ObjectPicker;
//# sourceMappingURL=picker.js.map
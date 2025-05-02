"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectPicker = void 0;
const core_1 = require("@babylonjs/core"); // Added Mesh, Node
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
            // Remove highlight if the hovered object is not the selected one
            if (this._hoveredObject && this._hoveredObject !== this._selectedObject) {
                this._removeHighlight(this._hoveredObject);
            }
            this._hoveredObject = null; // Clear hovered object reference
            // Clear tooltip timeout and remove tooltip element
            if (this._tooltipTimeout) {
                clearTimeout(this._tooltipTimeout);
                this._tooltipTimeout = null;
            }
            if (this._currentTooltip) {
                document.body.removeChild(this._currentTooltip);
                this._currentTooltip = null;
            }
            // Reset cursor
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
            // Use _findObjectWithMetadata to get the object with metadata (could be parent)
            const objectToSelect = this._findObjectWithMetadata(pickResult.pickedMesh);
            if (objectToSelect) { // Check if an object was found
                this._processSelection(objectToSelect);
                (_a = this._clickSound) === null || _a === void 0 ? void 0 : _a.play();
            }
            else {
                // No selectable object found up the hierarchy, clear selection
                this.clearSelection();
            }
        }
        else {
            // Clicked on empty space
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
        let targetObject = null;
        if (pickedMesh) {
            targetObject = this._findObjectWithMetadata(pickedMesh);
        }
        // Check if hover target changed
        if (this._hoveredObject !== targetObject) {
            // Clear previous hover state (tooltip, highlight)
            this._clearHoverState();
            this._hoveredObject = targetObject;
            if (this._hoveredObject) {
                // Apply new hover state
                if (this._config.hoverHighlight && this._hoveredObject !== this._selectedObject) {
                    this._addHighlight(this._hoveredObject);
                }
                // Start tooltip timer
                this._tooltipTimeout = setTimeout(() => {
                    if (this._hoveredObject) { // Check again in case mouse moved out quickly
                        this._showTooltip(this._hoveredObject, pointerInfo.event);
                    }
                }, this._config.tooltipDelay);
                this._canvas.style.cursor = 'pointer';
                // Handle hover selection mode
                if (this._config.selectionMode === 'hover') {
                    this._processSelection(this._hoveredObject);
                }
            }
        }
        else if (this._hoveredObject && this._currentTooltip) {
            // Hover target is the same, just update tooltip position
            this._updateTooltipPosition(pointerInfo.event);
        }
    }
    /**
     * Processa a seleção de um objeto
     * @param targetObject - O objeto (mesh ou nó pai com metadados) selecionado
     */
    _processSelection(targetObject) {
        if (targetObject === this._selectedObject)
            return; // Already selected
        // Clear previous selection
        this.clearSelection();
        // Set new selection
        this._selectedObject = targetObject;
        this._addHighlight(targetObject); // Apply highlight to the new selection
        const metadata = targetObject.metadata;
        const objectId = (metadata === null || metadata === void 0 ? void 0 : metadata.id) || targetObject.name;
        // Update status bar (assuming it exists)
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
        // Dispatch selection event
        const event = new CustomEvent('objectSelected', {
            detail: {
                object: targetObject,
                // Pass the original mesh if the targetObject is just a TransformNode wrapper
                mesh: targetObject instanceof core_1.AbstractMesh ? targetObject : null
                // Consider finding the primary mesh if targetObject is a TransformNode
            }
        });
        document.dispatchEvent(event);
        // Store global reference (provisional)
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
        if (!tooltipContent)
            return; // Don't show empty tooltip
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
            this._removeHighlight(this._selectedObject); // Remove highlight from the deselected object
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
        var _a, _b;
        if (!objectId)
            return false;
        // Procurar por ID diretamente (mais eficiente)
        // Note: getTransformNodeById or getMeshById might not find nodes nested deeply without metadata ID propagation.
        // Consider a more robust search if IDs are only on top-level nodes.
        const nodeById = this._scene.getNodeById(objectId); // Try getNodeById first
        let targetNode = null;
        if (nodeById && (nodeById instanceof core_1.AbstractMesh || nodeById instanceof core_1.TransformNode)) {
            targetNode = nodeById;
        }
        else {
            // Fallback: Iterate through meshes/transformNodes if getNodeById fails or returns wrong type
            targetNode = this._scene.getTransformNodeById(objectId) || this._scene.getMeshById(objectId);
        }
        if (targetNode) {
            // Found a node, now find the object with metadata (could be the node itself or a parent)
            const objectToSelect = this._findObjectWithMetadata(targetNode);
            if (objectToSelect) { // Check if null
                // Check if it's pickable (if it's a mesh) or has metadata
                const isPickable = objectToSelect instanceof core_1.AbstractMesh ? objectToSelect.isPickable : true; // Assume TransformNode is "pickable" conceptually
                if (isPickable || objectToSelect.metadata) {
                    this._processSelection(objectToSelect);
                    // Optional: Focus camera
                    // CommandInvoker.executeCommand(new FocusObjectCommand(this._scene.activeCamera as ArcRotateCamera, objectToSelect));
                    return true;
                }
            }
        }
        // Deeper Fallback: Search all meshes for metadata ID (less efficient)
        // This might be needed if IDs are only in metadata and not on the node ID itself.
        for (const mesh of this._scene.meshes) {
            const objectWithMetadata = this._findObjectWithMetadata(mesh);
            if (objectWithMetadata && ((_a = objectWithMetadata.metadata) === null || _a === void 0 ? void 0 : _a.id) === objectId) {
                this._processSelection(objectWithMetadata);
                return true;
            }
        }
        for (const transformNode of this._scene.transformNodes) {
            const objectWithMetadata = this._findObjectWithMetadata(transformNode);
            if (objectWithMetadata && ((_b = objectWithMetadata.metadata) === null || _b === void 0 ? void 0 : _b.id) === objectId) {
                this._processSelection(objectWithMetadata);
                return true;
            }
        }
        console.warn(`Objeto com ID '${objectId}' não encontrado ou não selecionável.`);
        return false;
    }
    /**
     * Encontra o nó pai (ou o próprio nó) que contém metadados de equipamento.
     * Percorre a hierarquia para cima a partir do nó inicial.
     * @param startNode - O nó (mesh ou transform node) inicial da busca.
     * @returns O nó com metadados (AbstractMesh ou TransformNode) ou null se não encontrado.
     */
    _findObjectWithMetadata(startNode) {
        var _a;
        let current = startNode;
        while (current) {
            // Check if the current node has metadata
            if ((_a = current.metadata) === null || _a === void 0 ? void 0 : _a.id) {
                // Found metadata, check if it's the correct type
                if (current instanceof core_1.AbstractMesh || current instanceof core_1.TransformNode) {
                    return current; // Return the node with metadata
                }
                else {
                    // Metadata found on an unexpected node type, log error and continue up? Or return null?
                    console.warn("Metadata found on unexpected node type:", current);
                    // Let's return null here, as we expect metadata on AbstractMesh or TransformNode
                    return null;
                }
            }
            // Stop if we reach the root
            if (!current.parent) {
                break; // Reached root without finding metadata in parents
            }
            current = current.parent; // Move up
        }
        // If loop finishes without finding metadata in parents, return null.
        // The original startNode might not have metadata itself.
        // If the intent is to always return *something*, we could return startNode here,
        // but returning null seems safer if no metadata object is identified.
        return null;
    }
    /**
     * Adiciona destaque visual a um objeto
     * @param targetObject - O objeto a ser destacado
     */
    _addHighlight(targetObject) {
        try {
            if (targetObject instanceof core_1.Mesh) {
                // Check if already highlighted to avoid duplicates
                if (!this._highlightLayer.hasMesh(targetObject)) {
                    this._highlightLayer.addMesh(targetObject, this._config.highlightColor);
                }
            }
            else if (targetObject instanceof core_1.TransformNode) {
                // If it's a TransformNode, highlight its descendant meshes
                targetObject.getChildMeshes(false).forEach(mesh => {
                    if (mesh instanceof core_1.Mesh) { // Ensure it's a Mesh
                        // Check if already highlighted
                        if (!this._highlightLayer.hasMesh(mesh)) {
                            this._highlightLayer.addMesh(mesh, this._config.highlightColor);
                        }
                    }
                });
            }
            // Handle InstancedMesh separately if needed. HighlightLayer might handle sourceMesh automatically.
            // else if (targetObject instanceof InstancedMesh) { ... }
        }
        catch (error) {
            console.error("Error adding highlight:", error, targetObject);
        }
    }
    /**
     * Remove destaque visual de um objeto
     * @param targetObject - O objeto a ter destaque removido
     */
    _removeHighlight(targetObject) {
        try {
            if (targetObject instanceof core_1.Mesh) {
                this._highlightLayer.removeMesh(targetObject);
            }
            else if (targetObject instanceof core_1.TransformNode) {
                targetObject.getChildMeshes(false).forEach(mesh => {
                    if (mesh instanceof core_1.Mesh) { // Ensure it's a Mesh
                        this._highlightLayer.removeMesh(mesh);
                    }
                });
            }
            // Handle InstancedMesh if needed
            // else if (targetObject instanceof InstancedMesh) { ... }
        }
        catch (error) {
            console.error("Error removing highlight:", error, targetObject);
        }
    }
    /**
     * Habilita ou desabilita o picker
     * @param enabled - true para habilitar, false para desabilitar
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) {
            this.clearSelection();
            this._clearHoverState();
            this._canvas.style.cursor = 'default';
        }
        else {
            // Re-attach observers if they were removed, or simply rely on the _enabled flag
            // If observers were completely removed, they need to be re-added here.
            // Assuming they are still attached and just check the flag.
        }
        console.log(`ObjectPicker ${enabled ? 'enabled' : 'disabled'}.`);
    }
    /**
     * Obtém o estado atual do picker
     * @returns true se habilitado, false caso contrário
     */
    isEnabled() {
        return this._enabled;
    }
    /**
     * Limpa recursos ao descartar o picker
     */
    dispose() {
        var _a;
        this.clearSelection();
        this._clearHoverState();
        // Remover observadores
        if (this._pointerDownObserver) {
            this._scene.onPointerObservable.remove(this._pointerDownObserver);
            this._pointerDownObserver = null;
        }
        if (this._pointerMoveObserver) {
            this._scene.onPointerObservable.remove(this._pointerMoveObserver);
            this._pointerMoveObserver = null;
        }
        // Remover event listeners
        this._canvas.removeEventListener('mouseout', this._clearHoverState);
        window.removeEventListener('keydown', this._handleKeyDown);
        // Limpar camada de destaque
        this._highlightLayer.dispose();
        // Limpar som
        (_a = this._clickSound) === null || _a === void 0 ? void 0 : _a.dispose();
        console.log("ObjectPicker disposed.");
    }
}
exports.ObjectPicker = ObjectPicker;
// Disponibilizar no escopo global para compatibilidade (opcional)
// (window as any).ObjectPicker = ObjectPicker; // Exposing class might be better than instance
//# sourceMappingURL=picker.js.map
import { Scene, AbstractMesh, PointerInfo, PointerEventTypes, HighlightLayer, Color3, Observer, Nullable, Sound, Vector3, TransformNode, PickingInfo } from "@babylonjs/core";

// Interface para metadados (pode ser movida para um arquivo compartilhado)
interface EquipmentMetadata {
    id: string;
    type: string;
    equipmentType?: string;
    state?: string;
    data?: any; // Pode ser mais específico
    components?: { [key: string]: AbstractMesh | TransformNode };
}

// Interface para a configuração do Picker
interface PickerConfig {
    highlightColor: Color3;
    highlightIntensity: number;
    outlineWidth: number;
    tooltipDelay: number;
    selectionMode: 'click' | 'hover';
    hoverHighlight: boolean;
    clickSound: Nullable<string>;
}

// Definição para a referência global (provisório)
declare global {
    var Terminal3D: {
        selectedObjectId: Nullable<string>;
        // Adicionar outras propriedades globais se necessário
    };
}

/**
 * ObjectPicker - Utilitário para seleção de objetos na cena 3D
 * 
 * Responsável por gerenciar a interação do usuário com objetos na cena,
 * incluindo seleção, destaque visual e rastreamento do objeto selecionado.
 */
export class ObjectPicker {
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _selectedObject: Nullable<AbstractMesh | TransformNode> = null;
    private _highlightLayer: HighlightLayer;
    private _pointerDownObserver: Nullable<Observer<PointerInfo>> = null;
    private _pointerMoveObserver: Nullable<Observer<PointerInfo>> = null;
    private _enabled: boolean = true;

    private readonly _config: PickerConfig = {
        highlightColor: new Color3(1, 0.8, 0.2),  // Amarelo
        highlightIntensity: 0.5, // Intensidade não é diretamente usada por HighlightLayer da mesma forma
        outlineWidth: 0.02,
        tooltipDelay: 1000,  // Milissegundos para mostrar tooltip
        selectionMode: 'click',  // 'click' ou 'hover'
        hoverHighlight: true,
        clickSound: null  // Caminho para som de clique (opcional)
    };

    private _hoveredObject: Nullable<AbstractMesh | TransformNode> = null;
    private _tooltipTimeout: Nullable<NodeJS.Timeout> = null;
    private _currentTooltip: Nullable<HTMLElement> = null;
    private _clickSound: Nullable<Sound> = null;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this._scene = scene;
        this._canvas = canvas;

        // Criar camada de destaque
        this._highlightLayer = new HighlightLayer("selectionHighlight", this._scene);
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
    private _setupEventObservers(): void {
        // Limpar observadores existentes se houver
        if (this._pointerDownObserver) {
            this._scene.onPointerObservable.remove(this._pointerDownObserver);
        }
        if (this._pointerMoveObserver) {
            this._scene.onPointerObservable.remove(this._pointerMoveObserver);
        }

        // Observador para cliques
        this._pointerDownObserver = this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
            if (!this._enabled) return;
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                this._handlePointerDown(pointerInfo);
            }
        });

        // Observador para movimento do mouse (hover)
        this._pointerMoveObserver = this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
            if (!this._enabled) return;
            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                this._handlePointerMove(pointerInfo);
            }
        });

        // Evento para quando o mouse sai do canvas
        this._canvas.addEventListener('mouseout', this._clearHoverState);

        // Evento para tecla ESC (cancelar seleção)
        window.addEventListener('keydown', this._handleKeyDown);
    }
    
    // Usar arrow function para manter o 'this' correto no event listener
    private _handleKeyDown = (e: KeyboardEvent): void => {
         if (e.key === 'Escape') {
             this.clearSelection();
         }
    }

    /**
     * Manipula eventos de clique do mouse
     * @param pointerInfo - Informações do evento
     */
    private _handlePointerDown(pointerInfo: PointerInfo): void {
        if ((pointerInfo.event as MouseEvent).button !== 0) return; // Botão principal

        const pickResult = this._scene.pick(
            this._scene.pointerX,
            this._scene.pointerY,
            (mesh) => mesh.isPickable && mesh.isVisible // Adicionar verificação de visibilidade
        );

        if (pickResult?.hit && pickResult.pickedMesh) {
            this._processSelection(pickResult.pickedMesh);
            this._clickSound?.play();
        } else {
            this.clearSelection();
        }
    }

    /**
     * Manipula eventos de movimento do mouse
     * @param pointerInfo - Informações do evento
     */
    private _handlePointerMove(pointerInfo: PointerInfo): void {
        const pickResult = this._scene.pick(
            this._scene.pointerX,
            this._scene.pointerY,
            (mesh) => mesh.isPickable && mesh.isVisible
        );

        const pickedMesh = pickResult?.pickedMesh;

        if (pickedMesh) {
            const targetObject = this._findObjectWithMetadata(pickedMesh);

            if (this._hoveredObject !== targetObject) {
                this._clearHoverState();
                this._hoveredObject = targetObject;

                if (this._config.hoverHighlight && targetObject !== this._selectedObject) {
                    this._addHighlight(targetObject);
                }

                this._tooltipTimeout = setTimeout(() => {
                    this._showTooltip(targetObject, pointerInfo.event as MouseEvent);
                }, this._config.tooltipDelay);

                this._canvas.style.cursor = 'pointer';

                if (this._config.selectionMode === 'hover') {
                    this._processSelection(targetObject);
                }
            } else {
                if (this._currentTooltip) {
                    this._updateTooltipPosition(pointerInfo.event as MouseEvent);
                }
            }
        } else {
            this._clearHoverState();
        }
    }
    
    // Usar arrow function para manter o 'this' correto no event listener
    private _clearHoverState = (): void => {
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
    }

    /**
     * Processa a seleção de um objeto
     * @param targetObject - O objeto (mesh ou nó pai com metadados) selecionado
     */
    private _processSelection(targetObject: AbstractMesh | TransformNode): void {
        if (targetObject === this._selectedObject) return;

        this.clearSelection();
        this._selectedObject = targetObject;
        this._addHighlight(targetObject);

        const metadata = (targetObject as any).metadata as EquipmentMetadata | undefined;
        const objectId = metadata?.id || targetObject.name;

        // Atualizar barra de status (assumindo que existe)
        const statusElement = document.getElementById('selectedObject');
        if (statusElement) {
            if (metadata) {
                const type = metadata.type || 'objeto';
                statusElement.textContent = `Selecionado: ${this._formatType(type)} ${objectId}`;
            } else {
                statusElement.textContent = `Selecionado: ${targetObject.name || 'Objeto sem nome'}`;
            }
        }

        // Disparar evento de seleção
        const event = new CustomEvent('objectSelected', {
            detail: {
                object: targetObject,
                mesh: targetObject instanceof AbstractMesh ? targetObject : null // Passa o mesh original se possível
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
    private _showTooltip(targetObject: AbstractMesh | TransformNode, event: MouseEvent): void {
        if (this._currentTooltip) {
            document.body.removeChild(this._currentTooltip);
            this._currentTooltip = null;
        }

        const metadata = (targetObject as any).metadata as EquipmentMetadata | undefined;
        let tooltipContent = '';

        if (metadata) {
            const type = metadata.type || 'Objeto';
            const id = metadata.id || targetObject.name;
            tooltipContent = `<strong>${this._formatType(type)}: ${id}</strong>`;

            if (metadata.data) {
                const data = metadata.data;
                if (data.product) tooltipContent += `<br>Produto: ${data.product}`;
                if (data.state) tooltipContent += `<br>Estado: ${data.state}`;
                if (data.level !== undefined) {
                    const level = typeof data.level === 'number' ? `${(data.level * 100).toFixed(0)}%` : data.level;
                    tooltipContent += `<br>Nível: ${level}`;
                }
                if (data.temperature !== undefined) tooltipContent += `<br>Temp: ${data.temperature.toFixed(1)}°C`;
                if (data.pressure !== undefined) tooltipContent += `<br>Pressão: ${data.pressure.toFixed(1)} bar`;
            }
        } else {
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
    private _positionTooltip(tooltip: HTMLElement, event: MouseEvent): void {
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
            if (finalX < margin) finalX = margin;
            if (finalY < margin) finalY = margin;

            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        });
    }

    /**
     * Atualiza a posição do tooltip existente
     * @param event - Evento do mouse
     */
    private _updateTooltipPosition(event: MouseEvent): void {
        if (!this._currentTooltip) return;
        this._positionTooltip(this._currentTooltip, event);
    }

    /**
     * Formata o tipo de objeto para exibição
     * @param type - Tipo do objeto
     * @returns Tipo formatado
     */
    private _formatType(type: string): string {
        if (!type) return 'Objeto';
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
    private _loadSoundEffect(soundUrl: string): void {
        this._clickSound = new Sound("clickSound", soundUrl, this._scene, null, {
            volume: 0.5,
            autoplay: false,
            loop: false
        });
    }

    /**
     * Limpa a seleção atual
     */
    public clearSelection(): void {
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
    public selectObjectById(objectId: string): boolean {
        if (!objectId) return false;

        // Procurar em todos os nós da cena (incluindo TransformNodes)
        const targetNode = this._scene.getTransformNodeById(objectId) || this._scene.getMeshById(objectId);

        if (targetNode) {
             // Encontrou um nó com o ID, verificar se tem metadados ou é selecionável
             const objectToSelect = this._findObjectWithMetadata(targetNode);
             if (objectToSelect.isPickable || (objectToSelect as any).metadata) {
                 this._processSelection(objectToSelect);
                 // Opcional: Focar a câmera no objeto selecionado
                 // CommandInvoker.executeCommand(new FocusObjectCommand(this._scene.activeCamera as ArcRotateCamera, objectToSelect));
                 return true;
             }
        }
        
        // Fallback: Procurar por metadados em todos os meshes (menos eficiente)
        for (const mesh of this._scene.meshes) {
            const objectWithMetadata = this._findObjectWithMetadata(mesh);
            if ((objectWithMetadata as any).metadata?.id === objectId) {
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
    public enable(): void {
        this._enabled = true;
        this._canvas.style.cursor = 'default';
    }

    /**
     * Desabilita o seletor de objetos
     */
    public disable(): void {
        this._enabled = false;
        this._clearHoverState();
        this.clearSelection();
        this._canvas.style.cursor = 'not-allowed';
    }

    /**
     * Retorna o objeto atualmente selecionado
     * @returns O objeto selecionado (mesh ou nó pai com metadados) ou null
     */
    public getSelectedObject(): Nullable<AbstractMesh | TransformNode> {
        return this._selectedObject;
    }

    /**
     * Adiciona destaque visual a um objeto
     * @param targetObject - O objeto a ser destacado
     */
    private _addHighlight(targetObject: AbstractMesh | TransformNode): void {
        if (targetObject instanceof AbstractMesh) {
            this._highlightLayer.addMesh(targetObject, this._config.highlightColor);
            targetObject.renderOutline = true;
            targetObject.outlineColor = this._config.highlightColor;
            targetObject.outlineWidth = this._config.outlineWidth;
        } else if (targetObject instanceof TransformNode) {
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
    private _removeHighlight(targetObject: AbstractMesh | TransformNode): void {
         if (targetObject instanceof AbstractMesh) {
            this._highlightLayer.removeMesh(targetObject);
            targetObject.renderOutline = false;
        } else if (targetObject instanceof TransformNode) {
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
    private _findObjectWithMetadata(startingNode: AbstractMesh | TransformNode): AbstractMesh | TransformNode {
        let currentNode: Nullable<AbstractMesh | TransformNode> = startingNode;
        while (currentNode) {
            if ((currentNode as any).metadata?.id) {
                return currentNode;
            }
            currentNode = currentNode.parent;
        }
        return startingNode; // Retorna o nó original se não encontrar metadados na hierarquia
    }
    
    /**
     * Limpa os recursos ao descartar o picker
     */
    public dispose(): void {
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
        this._clickSound?.dispose();
        this._clearHoverState();
        this.clearSelection();
        console.log("ObjectPicker descartado.");
    }
}


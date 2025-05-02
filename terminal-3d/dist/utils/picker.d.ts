import { Scene, AbstractMesh, Nullable, TransformNode } from "@babylonjs/core";
declare global {
    var Terminal3D: {
        selectedObjectId: Nullable<string>;
    };
}
/**
 * ObjectPicker - Utilitário para seleção de objetos na cena 3D
 *
 * Responsável por gerenciar a interação do usuário com objetos na cena,
 * incluindo seleção, destaque visual e rastreamento do objeto selecionado.
 */
export declare class ObjectPicker {
    private _scene;
    private _canvas;
    private _selectedObject;
    private _highlightLayer;
    private _pointerDownObserver;
    private _pointerMoveObserver;
    private _enabled;
    private readonly _config;
    private _hoveredObject;
    private _tooltipTimeout;
    private _currentTooltip;
    private _clickSound;
    constructor(scene: Scene, canvas: HTMLCanvasElement);
    /**
     * Configura os observadores de eventos para interação
     */
    private _setupEventObservers;
    private _handleKeyDown;
    /**
     * Manipula eventos de clique do mouse
     * @param pointerInfo - Informações do evento
     */
    private _handlePointerDown;
    /**
     * Manipula eventos de movimento do mouse
     * @param pointerInfo - Informações do evento
     */
    private _handlePointerMove;
    private _clearHoverState;
    /**
     * Processa a seleção de um objeto
     * @param targetObject - O objeto (mesh ou nó pai com metadados) selecionado
     */
    private _processSelection;
    /**
     * Mostra um tooltip para o objeto
     * @param targetObject - O objeto sob hover
     * @param event - Evento do mouse
     */
    private _showTooltip;
    /**
     * Posiciona o tooltip próximo ao cursor
     * @param tooltip - Elemento do tooltip
     * @param event - Evento do mouse
     */
    private _positionTooltip;
    /**
     * Atualiza a posição do tooltip existente
     * @param event - Evento do mouse
     */
    private _updateTooltipPosition;
    /**
     * Formata o tipo de objeto para exibição
     * @param type - Tipo do objeto
     * @returns Tipo formatado
     */
    private _formatType;
    /**
     * Carrega um efeito sonoro para feedback de clique
     * @param soundUrl - URL do arquivo de som
     */
    private _loadSoundEffect;
    /**
     * Limpa a seleção atual
     */
    clearSelection(): void;
    /**
     * Seleciona um objeto específico por ID
     * @param objectId - ID do objeto a ser selecionado
     * @returns true se o objeto foi encontrado e selecionado
     */
    selectObjectById(objectId: string): boolean;
    /**
     * Habilita o seletor de objetos
     */
    enable(): void;
    /**
     * Desabilita o seletor de objetos
     */
    disable(): void;
    /**
     * Retorna o objeto atualmente selecionado
     * @returns O objeto selecionado (mesh ou nó pai com metadados) ou null
     */
    getSelectedObject(): Nullable<AbstractMesh | TransformNode>;
    /**
     * Adiciona destaque visual a um objeto
     * @param targetObject - O objeto a ser destacado
     */
    private _addHighlight;
    /**
     * Remove destaque visual de um objeto
     * @param targetObject - O objeto a ter o destaque removido
     */
    private _removeHighlight;
    /**
     * Encontra o nó pai (ou o próprio nó) que contém os metadados relevantes
     * @param startingNode - O nó (geralmente mesh) a partir do qual começar a busca
     * @returns O nó com metadados ou o nó inicial se nenhum for encontrado
     */
    private _findObjectWithMetadata;
    /**
     * Limpa os recursos ao descartar o picker
     */
    dispose(): void;
}

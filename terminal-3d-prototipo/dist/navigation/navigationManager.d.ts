import { Scene, Vector3, Camera, Observable } from "@babylonjs/core";
/**
 * Interface para um ponto de vista salvo
 */
export interface ViewPoint {
    id: string;
    name: string;
    description?: string;
    targetPosition: Vector3;
    cameraPosition: Vector3;
    cameraRotation?: {
        alpha: number;
        beta: number;
        radius: number;
    };
    cameraType: "arc" | "free" | "target";
    tags?: string[];
    equipmentFocus?: string;
    dateCreated: Date;
}
/**
 * Interface para uma etapa de navegação guiada
 */
export interface NavigationStep {
    id: string;
    name: string;
    description?: string;
    viewPointId: string;
    duration: number;
    order: number;
    equipmentHighlights?: string[];
}
/**
 * Interface para uma sequência de navegação guiada
 */
export interface NavigationSequence {
    id: string;
    name: string;
    description?: string;
    steps: NavigationStep[];
    dateCreated: Date;
}
/**
 * NavigationManager - Gerencia a navegação contextual e pontos de interesse.
 *
 * Permite salvar, carregar e navegar entre pontos de vista predefinidos,
 * além de criar sequências de navegação guiada.
 */
export declare class NavigationManager {
    private static _instance;
    private _viewPoints;
    private _sequences;
    private _scene;
    private _camera;
    private _activeSequenceId;
    private _currentStepIndex;
    private _sequenceTimer;
    onViewPointChangedObservable: Observable<ViewPoint>;
    onSequenceStepChangedObservable: Observable<NavigationStep>;
    onSequenceCompletedObservable: Observable<NavigationSequence>;
    /**
     * Obtém a instância única do NavigationManager (Singleton)
     */
    static getInstance(): NavigationManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador com a cena e câmera.
     * @param scene - A cena Babylon.js.
     * @param camera - A câmera principal.
     */
    initialize(scene: Scene, camera: Camera): void;
    /**
     * Inicializa com pontos de vista padrão.
     */
    private _initializeDefaultViewPoints;
    /**
     * Salva o ponto de vista atual da câmera.
     * @param name - Nome do ponto de vista.
     * @param description - Descrição opcional.
     * @param tags - Tags opcionais para categorização.
     * @param equipmentFocus - ID do equipamento em foco (opcional).
     * @returns O ponto de vista criado ou null em caso de erro.
     */
    saveCurrentViewPoint(name: string, description?: string, tags?: string[], equipmentFocus?: string): ViewPoint | null;
    /**
     * Navega para um ponto de vista salvo.
     * @param viewPointId - ID do ponto de vista.
     * @param animate - Se true, anima a transição (padrão: true).
     * @param duration - Duração da animação em segundos (padrão: 1).
     * @returns true se a navegação foi iniciada, false caso contrário.
     */
    navigateToViewPoint(viewPointId: string, animate?: boolean, duration?: number): boolean;
    /**
     * Destaca um equipamento na cena.
     * @param equipmentId - ID do equipamento.
     * @private
     */
    private _highlightEquipment;
    /**
     * Remove um ponto de vista.
     * @param viewPointId - ID do ponto de vista.
     * @returns true se removido com sucesso, false caso contrário.
     */
    removeViewPoint(viewPointId: string): boolean;
    /**
     * Obtém um ponto de vista pelo ID.
     * @param viewPointId - ID do ponto de vista.
     * @returns O ponto de vista ou undefined se não encontrado.
     */
    getViewPointById(viewPointId: string): ViewPoint | undefined;
    /**
     * Obtém todos os pontos de vista.
     * @returns Array com todos os pontos de vista.
     */
    getAllViewPoints(): ViewPoint[];
    /**
     * Obtém pontos de vista filtrados por tags.
     * @param tags - Tags para filtrar.
     * @returns Array com os pontos de vista que possuem pelo menos uma das tags.
     */
    getViewPointsByTags(tags: string[]): ViewPoint[];
    /**
     * Cria uma sequência de navegação guiada.
     * @param name - Nome da sequência.
     * @param description - Descrição opcional.
     * @param steps - Etapas da sequência (opcional, pode ser adicionado depois).
     * @returns A sequência criada ou null em caso de erro.
     */
    createNavigationSequence(name: string, description?: string, steps?: NavigationStep[]): NavigationSequence | null;
    /**
     * Adiciona uma etapa a uma sequência de navegação.
     * @param sequenceId - ID da sequência.
     * @param viewPointId - ID do ponto de vista.
     * @param name - Nome da etapa.
     * @param description - Descrição opcional.
     * @param duration - Duração em segundos.
     * @param equipmentHighlights - IDs dos equipamentos a destacar.
     * @returns A etapa criada ou null em caso de erro.
     */
    addStepToSequence(sequenceId: string, viewPointId: string, name: string, description?: string, duration?: number, equipmentHighlights?: string[]): NavigationStep | null;
    /**
     * Remove uma etapa de uma sequência.
     * @param sequenceId - ID da sequência.
     * @param stepId - ID da etapa.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeStepFromSequence(sequenceId: string, stepId: string): boolean;
    /**
     * Inicia a reprodução de uma sequência de navegação.
     * @param sequenceId - ID da sequência.
     * @returns true se a reprodução foi iniciada, false caso contrário.
     */
    playNavigationSequence(sequenceId: string): boolean;
    /**
     * Reproduz a próxima etapa da sequência ativa.
     * @private
     */
    private _playNextStep;
    /**
     * Para a reprodução da sequência ativa.
     */
    stopNavigationSequence(): void;
    /**
     * Obtém uma sequência pelo ID.
     * @param sequenceId - ID da sequência.
     * @returns A sequência ou undefined se não encontrada.
     */
    getSequenceById(sequenceId: string): NavigationSequence | undefined;
    /**
     * Obtém todas as sequências.
     * @returns Array com todas as sequências.
     */
    getAllSequences(): NavigationSequence[];
    /**
     * Remove uma sequência.
     * @param sequenceId - ID da sequência.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeSequence(sequenceId: string): boolean;
    /**
     * Cria um ponto de vista focado em um equipamento específico.
     * @param equipmentId - ID do equipamento.
     * @param name - Nome do ponto de vista.
     * @param description - Descrição opcional.
     * @param distance - Distância da câmera ao equipamento.
     * @returns O ponto de vista criado ou null em caso de erro.
     */
    createViewPointForEquipment(equipmentId: string, name: string, description?: string, distance?: number): ViewPoint | null;
}
export declare const navigationManager: NavigationManager;

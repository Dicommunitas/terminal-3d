import { Vector3, TransformNode, Nullable } from "@babylonjs/core";
interface LoadingAreaData {
    id: string;
    type?: string;
    position: Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    state?: string;
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
    loadingArms?: number;
    [key: string]: any;
}
/**
 * LoadingAreasManager - Gerenciador de áreas de carregamento
 *
 * Responsável por criar, modificar e gerenciar as áreas de carregamento
 * na cena 3D do terminal.
 */
export declare class LoadingAreasManager {
    private static _instance;
    private _loadingAreasGroup;
    private _loadingAreaMeshes;
    private readonly _loadingAreaConfig;
    /**
     * Obtém a instância única do LoadingAreasManager (Singleton)
     */
    static getInstance(): LoadingAreasManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador de áreas de carregamento
     */
    initialize(): Promise<void>;
    /**
     * Cria as áreas de carregamento na cena
     */
    createLoadingAreas(): Promise<void>;
    /**
     * Cria uma área de carregamento a partir de dados
     * @param areaData - Dados da área de carregamento
     */
    createLoadingAreaFromData(areaData: LoadingAreaData): Nullable<TransformNode>;
    /**
     * Cria áreas de carregamento de demonstração quando não há dados disponíveis
     */
    createDemoLoadingAreas(): void;
    /**
     * Cria a plataforma base para uma área de carregamento
     * @param id - ID da área
     * @param type - Tipo de área
     * @param config - Configuração do tipo de área
     * @returns Mesh da plataforma
     */
    private _createPlatform;
    /**
     * Cria elementos específicos para baia de caminhões
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createTruckBayElements;
    /**
     * Cria elementos específicos para carregamento ferroviário
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createRailLoadingElements;
    /**
     * Cria elementos específicos para píer marítimo
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createMarinePierElements;
    /**
     * Cria elementos específicos para doca de barcaças
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createBargeDockElements;
    /**
     * Cria um indicador visual para o estado da área
     * @param id - ID da área
     * @param state - Estado atual
     * @param config - Configuração do estado
     * @returns Mesh do indicador
     */
    private _createStateIndicator;
    /**
     * Cria braços de carregamento (simplificado)
     * @param id - ID da área
     * @param type - Tipo de área
     * @param count - Número de braços
     * @returns Nó com os braços de carregamento
     */
    private _createLoadingArms;
    /**
     * Cria um material standard simples
     * @param name - Nome do material
     * @param color - Cor do material
     * @returns Material criado
     */
    private _createMaterial;
    /**
     * Obtém todos os meshes de áreas de carregamento
     * @returns Array de meshes de áreas de carregamento
     */
    getLoadingAreaMeshes(): TransformNode[];
    /**
     * Obtém uma área de carregamento específica por ID
     * @param id - ID da área
     * @returns A área encontrada ou null
     */
    getLoadingAreaById(id: string): Nullable<TransformNode>;
    /**
     * Atualiza o estado de uma área de carregamento
     * @param id - ID da área
     * @param newState - Novo estado ('available', 'loading', etc.)
     * @returns true se a área foi encontrada e atualizada
     */
    updateLoadingAreaState(id: string, newState: string): boolean;
    /**
     * Limpa todas as áreas de carregamento da cena
     */
    clearLoadingAreas(): void;
}
export {};

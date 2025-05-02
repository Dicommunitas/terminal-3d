import { Scene, Vector3, TransformNode, Color3, Nullable } from "@babylonjs/core";
import { EquipmentDataUnion } from "../database/inMemoryDb";
/**
 * Interface para metadados de equipamentos
 */
export interface EquipmentMetadata {
    id: string;
    type: string;
    equipmentType?: string;
    data: EquipmentDataUnion;
}
/**
 * Interface para configuração de equipamentos
 */
export interface EquipmentConfig {
    tanks: {
        defaultMaterial: {
            color: Color3;
            metallic: number;
            roughness: number;
        };
        types: {
            [key: string]: {
                height?: number;
                diameter: number;
                segments: number;
                lodSegments?: number;
            };
        };
    };
    pipes: {
        materials: {
            [key: string]: {
                color: Color3;
                roughness: number;
                metallic: number;
            };
        };
        diameters: {
            [key: string]: number;
        };
        tessellation: {
            [key: string]: number;
        };
    };
    valves: {
        types: {
            [key: string]: {
                name: string;
                size: {
                    width: number;
                    height: number;
                    depth: number;
                };
                color: Color3;
                lodTessellation?: number;
            };
        };
        states: {
            [key: string]: {
                name: string;
                color: Color3;
                wheelRotation: number;
                diskRotation?: number;
                sphereRotation?: number;
            };
        };
    };
}
/**
 * Interface para grupos de equipamentos na cena
 */
export interface EquipmentGroups {
    tanks: TransformNode;
    pipes: TransformNode;
    valves: TransformNode;
    loadingAreas?: TransformNode;
}
/**
 * Interface para catálogo de equipamentos
 */
export interface EquipmentCatalogItem {
    id: string;
    type: string;
    subtype: string;
    name: string;
    description?: string;
    tags: string[];
    previewImage?: string;
    defaultProperties: any;
    dateAdded: Date;
    dateModified: Date;
    usageCount: number;
}
/**
 * EquipmentFactory - Fábrica para criação e catalogação de equipamentos 3D
 *
 * Implementa o padrão Factory para centralizar a lógica de criação de diferentes
 * tipos de equipamentos (Tanques, Tubulações, Válvulas) na cena 3D.
 * Também gerencia o catálogo de equipamentos disponíveis.
 */
export declare class EquipmentFactory {
    private static _instance;
    private _scene;
    private _groups;
    private _catalog;
    private _catalogByType;
    private _catalogByTag;
    private readonly _config;
    /**
     * Obtém a instância única do EquipmentFactory (Singleton)
     */
    static getInstance(): EquipmentFactory;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa a fábrica com a cena e os grupos
     * @param scene - A cena Babylon.js
     * @param groups - Objeto contendo referências aos grupos (tanks, pipes, valves)
     */
    initialize(scene: Scene, groups: EquipmentGroups): void;
    /**
     * Inicializa o catálogo de equipamentos com itens padrão
     */
    private _initializeCatalog;
    /**
     * Adiciona um item ao catálogo
     * @param item - Item a ser adicionado ao catálogo
     */
    private _addCatalogItem;
    /**
     * Adiciona um ID a um índice
     * @param index - Índice a ser atualizado
     * @param key - Chave do índice
     * @param id - ID a ser adicionado
     */
    private _addToIndex;
    /**
     * Remove um ID de um índice
     * @param index - Índice a ser atualizado
     * @param key - Chave do índice
     * @param id - ID a ser removido
     */
    private _removeFromIndex;
    /**
     * Cria um equipamento com base nos dados fornecidos.
     * Função principal da Factory.
     * @param equipmentData - Dados do equipamento
     * @returns O nó do equipamento criado ou null em caso de erro.
     */
    createEquipment(equipmentData: EquipmentDataUnion): Nullable<TransformNode>;
    /**
     * Cria um equipamento a partir de um item do catálogo
     * @param catalogId - ID do item no catálogo
     * @param position - Posição do equipamento
     * @param customProperties - Propriedades personalizadas para sobrescrever as padrão
     * @returns O nó do equipamento criado ou null em caso de erro
     */
    createFromCatalog(catalogId: string, position: Vector3, customProperties?: any): Nullable<TransformNode>;
    /**
     * Cria um tanque (delegando para TanksManager)
     * @param tankData - Dados do tanque
     * @returns O nó do tanque criado
     */
    private _createTank;
    /**
     * Cria uma tubulação (delegando para PipesManager)
     * @param pipeData - Dados da tubulação
     * @returns O nó da tubulação criada
     */
    private _createPipe;
    /**
     * Cria uma válvula (delegando para ValvesManager)
     * @param valveData - Dados da válvula
     * @returns O nó da válvula criada
     */
    private _createValve;
    /**
     * Obtém todos os itens do catálogo
     * @returns Array com todos os itens do catálogo
     */
    getAllCatalogItems(): EquipmentCatalogItem[];
    /**
     * Obtém itens do catálogo por tipo
     * @param type - Tipo de equipamento ('tank', 'pipe', 'valve', 'loadingArea')
     * @returns Array com os itens do catálogo do tipo especificado
     */
    getCatalogItemsByType(type: string): EquipmentCatalogItem[];
    /**
     * Obtém itens do catálogo por tag
     * @param tag - Tag para busca
     * @returns Array com os itens do catálogo que possuem a tag especificada
     */
    getCatalogItemsByTag(tag: string): EquipmentCatalogItem[];
    /**
     * Busca itens no catálogo por texto
     * @param searchText - Texto para busca
     * @returns Array com os itens do catálogo que correspondem à busca
     */
    searchCatalog(searchText: string): EquipmentCatalogItem[];
    /**
     * Adiciona um novo item ao catálogo
     * @param item - Item a ser adicionado
     * @returns true se adicionado com sucesso, false caso contrário
     */
    addCatalogItem(item: EquipmentCatalogItem): boolean;
    /**
     * Atualiza um item existente no catálogo
     * @param id - ID do item a ser atualizado
     * @param updates - Atualizações a serem aplicadas
     * @returns true se atualizado com sucesso, false caso contrário
     */
    updateCatalogItem(id: string, updates: Partial<EquipmentCatalogItem>): boolean;
    /**
     * Remove um item do catálogo
     * @param id - ID do item a ser removido
     * @returns true se removido com sucesso, false caso contrário
     */
    removeCatalogItem(id: string): boolean;
    /**
     * Obtém as configurações de equipamentos
     * @returns Configurações de equipamentos
     */
    getConfig(): EquipmentConfig;
}
export declare const equipmentFactory: EquipmentFactory;

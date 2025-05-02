import { Vector3 } from "@babylonjs/core";
interface BaseEquipmentData {
    id: string;
    type: string;
    name?: string;
    description?: string;
    tags?: string[];
    parentId?: string;
    position?: Vector3 | {
        x?: number;
        y?: number;
        z?: number;
    };
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
    metadata?: {
        [key: string]: any;
    };
    documentationUrl?: string;
    versionId?: string;
}
export interface TankData extends BaseEquipmentData {
    type: 'tank';
    equipmentType: 'standard' | 'large' | 'small' | 'spherical';
    product?: string;
    level?: number;
    capacity?: number;
    status?: string;
    temperature?: number;
}
export interface PipeData extends BaseEquipmentData {
    type: 'pipe';
    size: 'small' | 'medium' | 'large' | 'extraLarge';
    materialType: 'standard' | 'insulated' | 'highTemp';
    product?: string;
    points: Vector3[] | {
        x: number;
        y: number;
        z: number;
    }[];
    connectedTo?: {
        start?: string;
        end?: string;
    };
    status?: string;
}
export interface ValveData extends BaseEquipmentData {
    type: 'valve';
    valveType: 'gate' | 'ball' | 'check' | 'butterfly' | 'control';
    state: 'open' | 'closed' | 'partial' | 'maintenance' | 'fault';
    connectedPipe?: string;
}
export interface LoadingAreaData extends BaseEquipmentData {
    type: 'loadingArea';
    areaType: 'truck' | 'ship' | 'rail';
    status?: string;
}
export interface AnnotationData {
    id: string;
    targetId: string;
    position: Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    text: string;
    author: string;
    timestamp: Date;
    versionId?: string;
}
export type EquipmentDataUnion = TankData | PipeData | ValveData | LoadingAreaData;
/**
 * InMemoryDatabase - Gerencia os dados do terminal em memória.
 *
 * Utiliza uma estrutura híbrida, com uma tabela principal relacional (Map)
 * e coleções NoSQL (Map) para dados como anotações.
 * Implementa o padrão Singleton.
 */
export declare class InMemoryDatabase {
    private static _instance;
    private _db;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Obtém a instância única do InMemoryDatabase (Singleton)
     */
    static getInstance(): InMemoryDatabase;
    /**
     * Limpa todo o banco de dados.
     */
    clearDatabase(): void;
    /**
     * Adiciona ou atualiza um equipamento no banco de dados.
     * @param equipmentData - Dados do equipamento.
     */
    upsertEquipment(equipmentData: EquipmentDataUnion): void;
    /**
     * Remove um equipamento do banco de dados.
     * @param id - ID do equipamento a ser removido.
     * @returns true se o equipamento foi removido, false caso contrário.
     */
    deleteEquipment(id: string): boolean;
    /**
     * Busca um equipamento pelo ID.
     * @param id - ID do equipamento.
     * @returns Os dados do equipamento ou undefined se não encontrado.
     */
    getEquipmentById(id: string): EquipmentDataUnion | undefined;
    /**
     * Busca todos os equipamentos de um determinado tipo.
     * @param type - Tipo do equipamento ('tank', 'pipe', etc.).
     * @returns Um array com os dados dos equipamentos encontrados.
     */
    getEquipmentByType(type: string): EquipmentDataUnion[];
    /**
     * Busca todos os equipamentos.
     * @returns Um array com os dados de todos os equipamentos.
     */
    getAllEquipment(): EquipmentDataUnion[];
    /**
     * Busca equipamentos filhos de um determinado pai.
     * @param parentId - ID do equipamento pai.
     * @returns Um array com os dados dos equipamentos filhos.
     */
    getChildrenOf(parentId: string): EquipmentDataUnion[];
    /**
     * Adiciona ou atualiza uma anotação.
     * @param annotationData - Dados da anotação.
     */
    upsertAnnotation(annotationData: AnnotationData): void;
    /**
     * Remove uma anotação.
     * @param id - ID da anotação.
     * @returns true se removida, false caso contrário.
     */
    deleteAnnotation(id: string): boolean;
    /**
     * Busca uma anotação pelo ID.
     * @param id - ID da anotação.
     * @returns Os dados da anotação ou undefined.
     */
    getAnnotationById(id: string): AnnotationData | undefined;
    /**
     * Busca todas as anotações associadas a um equipamento.
     * @param targetId - ID do equipamento alvo.
     * @returns Um array com as anotações encontradas.
     */
    getAnnotationsByTarget(targetId: string): AnnotationData[];
    /**
     * Busca todas as anotações.
     * @returns Um array com todas as anotações.
     */
    getAllAnnotations(): AnnotationData[];
    private _addToIndex;
    private _removeFromIndex;
    /**
     * Carrega dados iniciais no banco de dados a partir de um objeto.
     * Espera um objeto com chaves como 'tanks', 'pipes', 'valves', etc.
     * @param initialData - Objeto contendo arrays de dados para cada tipo.
     */
    loadInitialData(initialData: {
        [key: string]: any[];
    }): void;
}
export declare const db: InMemoryDatabase;
export {};

import { TransformNode, Nullable } from "@babylonjs/core";
import { TankData as DbTankData } from "../database/inMemoryDb";
/**
 * TanksManager - Gerenciador de tanques
 *
 * Responsável por criar, modificar e gerenciar os tanques
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export declare class TanksManager {
    private static _instance;
    private _tanksGroup;
    private _tankMeshes;
    private _sourceMeshes;
    private _instanceMaterials;
    private readonly _tankConfig;
    /**
     * Obtém a instância única do TanksManager (Singleton)
     */
    static getInstance(): TanksManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador de tanques e cria meshes fonte
     */
    initialize(): Promise<void>;
    /**
     * Cria os meshes que serão usados como fonte para instâncias
     */
    private _createSourceMeshes;
    /**
     * Cria os tanques na cena buscando dados do InMemoryDatabase.
     */
    createTanks(): Promise<void>;
    /**
     * Cria um tanque a partir de dados do InMemoryDatabase.
     * @param tankData - Dados do tanque (DbTankData).
     */
    createTankFromData(tankData: DbTankData): TransformNode;
    /**
     * Cria um tanque cilíndrico com LOD
     */
    private _createCylindricalTank;
    /**
     * Cria um tanque esférico com LOD e suportes instanciados
     */
    private _createSphericalTank;
    /**
     * Adiciona escadas instanciadas ao tanque
     */
    private _addTankStairsInstanced;
    /**
     * Adiciona conexões de tubulação instanciadas ao tanque
     */
    private _addTankConnectionsInstanced;
    /**
     * Cria um material PBR para o tanque
     */
    private _createPBRMaterial;
    /**
     * Cria um material standard simples
     */
    private _createMaterial;
    /**
     * Obtém todos os meshes de tanques
     */
    getTankMeshes(): TransformNode[];
    /**
     * Obtém um tanque específico por ID
     */
    getTankById(id: string): Nullable<TransformNode>;
    /**
     * Atualiza o nível de produto em um tanque (no DB e visualmente se necessário)
     */
    updateTankLevel(id: string, level: number): boolean;
    /**
     * Atualiza o status de um tanque (no DB e visualmente se necessário)
     */
    updateTankStatus(id: string, status: string): boolean;
    /**
     * Limpa todos os tanques da cena e meshes fonte
     */
    clearTanks(): void;
}

import { InstancedMesh } from "@babylonjs/core";
import { ValveData as DbValveData } from "../database/inMemoryDb";
type ValveState = "open" | "closed" | "partial" | "maintenance" | "fault";
interface ValveMetadata {
    id: string;
    type: "valve";
    valveType: string;
    state: ValveState;
    data: DbValveData;
    components: {
        body: InstancedMesh;
        wheelOrLever: InstancedMesh;
        stateIndicator?: InstancedMesh;
        ballSphere?: InstancedMesh;
        butterflyDisk?: InstancedMesh;
        checkCap?: InstancedMesh;
        checkArrow?: InstancedMesh;
        controlActuator?: InstancedMesh;
    };
}
/**
 * ValvesManager - Gerenciador de válvulas
 *
 * Responsável por criar, modificar e gerenciar as válvulas
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export declare class ValvesManager {
    private static _instance;
    private _valvesGroup;
    private _valveInstances;
    private _sourceMeshes;
    private _instanceMaterials;
    private readonly _valveConfig;
    /**
     * Obtém a instância única do ValvesManager (Singleton)
     */
    static getInstance(): ValvesManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador de válvulas e cria meshes fonte
     */
    initialize(): Promise<void>;
    /**
     * Cria um material padrão
     * @param name Nome do material
     * @param color Cor difusa
     * @returns O material criado
     */
    private _createMaterial;
    /**
     * Cria materiais para instâncias
     */
    private _createInstanceMaterials;
    /**
     * Cria meshes fonte para instancing
     */
    private _createSourceMeshes;
    /**
     * Cria as válvulas na cena buscando dados do InMemoryDatabase.
     */
    createValves(): Promise<void>;
    /**
     * Cria ou atualiza uma válvula na cena com base nos dados.
     * @param valveData - Dados da válvula (DbValveData).
     */
    createOrUpdateValve(valveData: DbValveData): void;
    /**
     * Cria uma nova instância de válvula.
     * @param valveData - Dados da válvula.
     * @private
     */
    private _createValveInstance;
    /**
     * Atualiza uma válvula existente com base nos novos dados.
     * @param valveData - Novos dados da válvula.
     */
    updateValve(valveData: DbValveData): void;
    /**
     * Define o estado visual de uma válvula.
     * @param valveId - ID da válvula.
     * @param newState - Novo estado ('open', 'closed', 'partial', etc.).
     */
    setValveState(valveId: string, newState: ValveState): void;
    /**
     * Obtém os metadados de uma válvula pelo ID.
     * @param valveId - ID da válvula.
     * @returns Os metadados da válvula ou undefined.
     */
    getValveMetadata(valveId: string): ValveMetadata | undefined;
    /**
     * Remove uma válvula da cena.
     * @param valveId - ID da válvula a ser removida.
     */
    removeValve(valveId: string): void;
    /**
     * Limpa todas as válvulas e recursos relacionados.
     */
    dispose(): void;
}
export declare const valvesManager: ValvesManager;
export {};

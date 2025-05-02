import { TransformNode, Nullable } from "@babylonjs/core";
import { PipeData as DbPipeData } from "../database/inMemoryDb";
/**
 * PipesManager - Gerenciador de tubulações
 *
 * Responsável por criar, modificar e gerenciar as tubulações
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export declare class PipesManager {
    private static _instance;
    private _pipesGroup;
    private _pipeMeshes;
    private _sourceMeshes;
    private _instanceMaterials;
    private readonly _pipeConfig;
    /**
     * Obtém a instância única do PipesManager (Singleton)
     */
    static getInstance(): PipesManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador de tubulações e cria meshes fonte
     */
    initialize(): Promise<void>;
    /**
     * Cria materiais para instâncias
     */
    private _createInstanceMaterials;
    /**
     * Cria meshes fonte para instancing
     */
    private _createSourceMeshes;
    /**
     * Cria as tubulações na cena buscando dados do InMemoryDatabase.
     */
    createPipes(): Promise<void>;
    /**
     * Cria uma tubulação a partir de dados do InMemoryDatabase, com otimizações.
     * @param pipeData - Dados da tubulação (DbPipeData).
     */
    createPipeFromData(pipeData: DbPipeData): Nullable<TransformNode>;
    /**
     * Cria um segmento de tubulação otimizado entre dois pontos usando instancing e LOD
     * @param id - Identificador do segmento
     * @param start - Ponto inicial
     * @param end - Ponto final
     * @param size - Tamanho da tubulação
     * @param materialType - Tipo de material
     * @returns O mesh do segmento criado
     */
    private _createPipeSegmentOptimized;
    /**
     * Cria uma conexão (curva/esfera) otimizada em um ponto usando instancing
     * @param id - Identificador da conexão
     * @param center - Ponto central da conexão
     * @param prev - Ponto anterior (para orientação, se necessário)
     * @param next - Próximo ponto (para orientação, se necessário)
     * @param size - Tamanho da tubulação
     * @param materialType - Tipo de material
     * @returns O mesh da conexão criada
     */
    private _createPipeConnectionOptimized;
    /**
     * Cria suportes otimizados para uma tubulação usando instancing
     * @param pipeData - Dados da tubulação
     * @param spacing - Espaçamento entre suportes
     */
    private _createPipeSupportsOptimized;
    /**
     * Posiciona e orienta um cilindro entre dois pontos
     * @param cylinder - O mesh do cilindro
     * @param start - Ponto inicial
     * @param end - Ponto final
     */
    private _positionCylinder;
    /**
     * Cria um material PBR
     */
    private _createPBRMaterial;
    /**
     * Cria um material standard simples
     */
    private _createMaterial;
    /**
     * Obtém todos os nós de tubulações
     */
    getPipeNodes(): TransformNode[];
    /**
     * Obtém um nó de tubulação específico por ID
     */
    getPipeNodeById(id: string): Nullable<TransformNode>;
    /**
     * Atualiza o status de uma tubulação (no DB e visualmente se necessário)
     */
    updatePipeStatus(id: string, status: string): boolean;
    /**
     * Limpa todas as tubulações da cena e meshes fonte
     */
    clearPipes(): void;
}

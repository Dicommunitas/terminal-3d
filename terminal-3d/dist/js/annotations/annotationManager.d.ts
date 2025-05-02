import { Vector3, Scene, Nullable } from "@babylonjs/core";
import { AnnotationData } from "../database/inMemoryDb";
/**
 * AnnotationManager - Gerencia anotações e marcações na cena 3D.
 *
 * Permite criar, visualizar, modificar e remover anotações associadas
 * a equipamentos ou posições específicas.
 */
export declare class AnnotationManager {
    private static _instance;
    private _annotations;
    private _annotationsGroup;
    private _markerMaterial;
    private _markerSourceMesh;
    /**
     * Obtém a instância única do AnnotationManager (Singleton)
     */
    static getInstance(): AnnotationManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa o gerenciador com a cena e cria recursos visuais.
     * @param scene - A cena Babylon.js.
     */
    initialize(scene: Scene): void;
    /**
     * Carrega anotações do banco de dados em memória.
     */
    private _loadAnnotationsFromDb;
    /**
     * Adiciona uma nova anotação.
     * @param targetId - ID do equipamento alvo.
     * @param text - Conteúdo da anotação.
     * @param type - Tipo da anotação.
     * @param position - Posição do marcador visual no mundo.
     * @param targetRelativePosition - Posição relativa ao alvo (opcional).
     * @param author - Autor da anotação.
     * @param metadata - Metadados adicionais.
     * @returns A anotação criada ou null em caso de erro.
     */
    addAnnotation(targetId: string, text: string, type: AnnotationData["type"], position: Vector3, // Posição do marcador no mundo
    targetRelativePosition?: Vector3, // Posição relativa opcional
    author?: string, metadata?: any): Nullable<AnnotationData>;
    /**
     * Remove uma anotação.
     * @param id - ID da anotação a ser removida.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeAnnotation(id: string): boolean;
    /**
     * Atualiza uma anotação existente.
     * @param id - ID da anotação a ser atualizada.
     * @param updates - Atualizações a serem aplicadas (parcial de AnnotationData).
     * @returns A anotação atualizada ou null se não encontrada.
     */
    updateAnnotation(id: string, updates: Partial<AnnotationData>): Nullable<AnnotationData>;
    /**
     * Obtém uma anotação pelo ID.
     * @param id - ID da anotação.
     * @returns A anotação (AnnotationData) ou undefined se não encontrada.
     */
    getAnnotationById(id: string): AnnotationData | undefined;
    /**
     * Obtém todas as anotações.
     * @returns Array com todas as anotações (AnnotationData).
     */
    getAllAnnotations(): AnnotationData[];
    /**
     * Obtém todas as anotações associadas a um equipamento específico.
     * @param targetId - ID do equipamento alvo.
     * @returns Array com as anotações (AnnotationData) do equipamento.
     */
    getAnnotationsByTarget(targetId: string): AnnotationData[];
    /**
     * Cria um marcador visual para a anotação na cena.
     * @param annotation - A anotação (AnnotationData) para a qual criar o marcador.
     */
    private _createVisualMarker;
    /**
     * Remove o marcador visual de uma anotação.
     * @param annotation - A anotação (AnnotationData) cujo marcador deve ser removido.
     */
    private _removeVisualMarker;
    /**
     * Obtém a cor para um tipo de anotação.
     * @param type - Tipo da anotação.
     * @returns Cor3 para o tipo.
     */
    private _getColorForType;
    /**
     * Adiciona ou atualiza o link de documentação para um equipamento.
     * @param equipmentId - ID do equipamento.
     * @param url - URL da documentação.
     * @returns true se atualizado com sucesso, false caso contrário.
     */
    setDocumentationUrl(equipmentId: string, url: string): boolean;
    /**
     * Obtém o link de documentação de um equipamento.
     * @param equipmentId - ID do equipamento.
     * @returns A URL da documentação ou undefined se não houver.
     */
    getDocumentationUrl(equipmentId: string): string | undefined;
}
export declare const annotationManager: AnnotationManager;

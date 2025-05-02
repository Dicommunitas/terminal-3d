import { Vector3, Scene, Nullable } from "@babylonjs/core";
/**
 * Interface para uma anotação
 */
export interface Annotation {
    id: string;
    targetId: string;
    targetPosition?: Vector3;
    text: string;
    author?: string;
    dateCreated: Date;
    dateModified: Date;
    type: "note" | "warning" | "issue" | "docLink" | "measurement";
    metadata?: any;
    visualMarkerId?: string;
}
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
     * @param position - Posição relativa ao alvo ou absoluta.
     * @param author - Autor da anotação.
     * @param metadata - Metadados adicionais.
     * @returns A anotação criada ou null em caso de erro.
     */
    addAnnotation(targetId: string, text: string, type: Annotation["type"], position: Vector3, author?: string, metadata?: any): Nullable<Annotation>;
    /**
     * Remove uma anotação.
     * @param id - ID da anotação a ser removida.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeAnnotation(id: string): boolean;
    /**
     * Atualiza uma anotação existente.
     * @param id - ID da anotação a ser atualizada.
     * @param updates - Atualizações a serem aplicadas.
     * @returns A anotação atualizada ou null se não encontrada.
     */
    updateAnnotation(id: string, updates: Partial<Annotation>): Nullable<Annotation>;
    /**
     * Obtém uma anotação pelo ID.
     * @param id - ID da anotação.
     * @returns A anotação ou undefined se não encontrada.
     */
    getAnnotationById(id: string): Annotation | undefined;
    /**
     * Obtém todas as anotações.
     * @returns Array com todas as anotações.
     */
    getAllAnnotations(): Annotation[];
    /**
     * Obtém todas as anotações associadas a um equipamento específico.
     * @param targetId - ID do equipamento alvo.
     * @returns Array com as anotações do equipamento.
     */
    getAnnotationsByTarget(targetId: string): Annotation[];
    /**
     * Cria um marcador visual para a anotação na cena.
     * @param annotation - A anotação para a qual criar o marcador.
     */
    private _createVisualMarker;
    /**
     * Remove o marcador visual de uma anotação.
     * @param annotation - A anotação cujo marcador deve ser removido.
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

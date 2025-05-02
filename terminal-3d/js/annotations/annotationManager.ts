import { Vector3, Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Nullable, TransformNode, InstancedMesh, AbstractMesh } from "@babylonjs/core"; // Import InstancedMesh and AbstractMesh
import { db, AnnotationData, EquipmentDataUnion } from "../database/inMemoryDb"; // Use AnnotationData from DB

// Remove local Annotation interface, use AnnotationData from DB

// Declare SceneManager (assuming it will be properly imported/structured later)
declare var SceneManager: {
    scene: Scene;
    getGroup(name: string): Nullable<TransformNode>; // Correct return type
    getMeshById(id: string): Nullable<AbstractMesh>; // Add getMeshById
    getTransformNodeById(id: string): Nullable<TransformNode>; // Add getTransformNodeById
};

/**
 * AnnotationManager - Gerencia anotações e marcações na cena 3D.
 * 
 * Permite criar, visualizar, modificar e remover anotações associadas
 * a equipamentos ou posições específicas.
 */
export class AnnotationManager {
    private static _instance: AnnotationManager;
    private _annotations: Map<string, AnnotationData> = new Map(); // Use AnnotationData
    private _annotationsGroup: Nullable<TransformNode> = null;
    private _markerMaterial: Nullable<StandardMaterial> = null;
    private _markerSourceMesh: Nullable<Mesh> = null;

    /**
     * Obtém a instância única do AnnotationManager (Singleton)
     */
    public static getInstance(): AnnotationManager {
        if (!AnnotationManager._instance) {
            AnnotationManager._instance = new AnnotationManager();
        }
        return AnnotationManager._instance;
    }

    /**
     * Construtor privado (Singleton)
     */
    private constructor() {
        // Carregar anotações existentes do DB (se houver)
        this._loadAnnotationsFromDb();
    }

    /**
     * Inicializa o gerenciador com a cena e cria recursos visuais.
     * @param scene - A cena Babylon.js.
     */
    public initialize(scene: Scene): void {
        this._annotationsGroup = SceneManager.getGroup("annotations");
        if (!this._annotationsGroup) {
            this._annotationsGroup = new TransformNode("annotationsGroup", scene);
            console.warn("Grupo de anotações não encontrado, criando um novo.");
        }

        // Criar material para marcadores
        this._markerMaterial = new StandardMaterial("annotationMarkerMat", scene);
        this._markerMaterial.diffuseColor = new Color3(1, 1, 0); // Amarelo
        this._markerMaterial.emissiveColor = new Color3(0.3, 0.3, 0); // Leve brilho

        // Criar mesh fonte para marcadores (ex: pequena esfera)
        this._markerSourceMesh = MeshBuilder.CreateSphere("annotationMarkerSource", {
            diameter: 0.2, 
            segments: 8 
        }, scene);
        this._markerSourceMesh.material = this._markerMaterial;
        this._markerSourceMesh.setEnabled(false); // Desabilitar mesh fonte

        // Recriar marcadores visuais para anotações carregadas
        this._annotations.forEach(annotation => {
            this._createVisualMarker(annotation);
        });

        console.log("AnnotationManager inicializado.");
    }

    /**
     * Carrega anotações do banco de dados em memória.
     */
    private _loadAnnotationsFromDb(): void {
        const annotationsFromDb = db.getAllAnnotations();
        annotationsFromDb.forEach(annotation => {
            // Converter posições se necessário (DB deve idealmente já ter Vector3)
            if (annotation.position && !(annotation.position instanceof Vector3)) {
                annotation.position = new Vector3(
                    annotation.position.x || 0,
                    annotation.position.y || 0,
                    annotation.position.z || 0
                );
            }
             if (annotation.targetPosition && !(annotation.targetPosition instanceof Vector3)) {
                annotation.targetPosition = new Vector3(
                    annotation.targetPosition.x || 0,
                    annotation.targetPosition.y || 0,
                    annotation.targetPosition.z || 0
                );
            }
            // Garantir que as datas são objetos Date
            if (annotation.dateCreated && !(annotation.dateCreated instanceof Date)) {
                annotation.dateCreated = new Date(annotation.dateCreated);
            }
            if (annotation.dateModified && !(annotation.dateModified instanceof Date)) {
                annotation.dateModified = new Date(annotation.dateModified);
            }
            // Garantir tipo padrão
            if (!annotation.type) {
                annotation.type = "note";
            }
            
            this._annotations.set(annotation.id, annotation);
        });
        console.log(`${this._annotations.size} anotações carregadas do DB.`);
    }

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
    public addAnnotation(
        targetId: string, 
        text: string, 
        type: AnnotationData["type"], 
        position: Vector3, // Posição do marcador no mundo
        targetRelativePosition?: Vector3, // Posição relativa opcional
        author?: string,
        metadata?: any
    ): Nullable<AnnotationData> {
        const equipment = db.getEquipmentById(targetId);
        if (!equipment && targetId) { // Permitir anotações sem alvo se targetId for vazio/null
            console.warn(`Equipamento alvo com ID ${targetId} não encontrado.`);
            // return null; // Decidir se permite anotações órfãs
        }

        const newAnnotation: AnnotationData = {
            id: `anno_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            targetId,
            position: position, // Posição do marcador visual
            targetPosition: targetRelativePosition, // Posição relativa (se fornecida)
            text,
            author: author || "Unknown", // Garantir autor
            dateCreated: new Date(),
            dateModified: new Date(),
            type: type || "note", // Garantir tipo
            metadata
            // visualMarkerId será definido por _createVisualMarker
        };

        // Salvar no DB
        db.upsertAnnotation(newAnnotation);
        this._annotations.set(newAnnotation.id, newAnnotation);

        // Criar marcador visual
        this._createVisualMarker(newAnnotation);

        console.log(`Anotação ${newAnnotation.id} adicionada para ${targetId || 'posição'}.`);
        return newAnnotation;
    }

    /**
     * Remove uma anotação.
     * @param id - ID da anotação a ser removida.
     * @returns true se removida com sucesso, false caso contrário.
     */
    public removeAnnotation(id: string): boolean {
        const annotation = this._annotations.get(id);
        if (!annotation) {
            console.warn(`Anotação com ID ${id} não encontrada.`);
            return false;
        }

        // Remover marcador visual
        this._removeVisualMarker(annotation);

        // Remover do DB
        db.deleteAnnotation(id);
        this._annotations.delete(id);

        console.log(`Anotação ${id} removida.`);
        return true;
    }

    /**
     * Atualiza uma anotação existente.
     * @param id - ID da anotação a ser atualizada.
     * @param updates - Atualizações a serem aplicadas (parcial de AnnotationData).
     * @returns A anotação atualizada ou null se não encontrada.
     */
    public updateAnnotation(id: string, updates: Partial<AnnotationData>): Nullable<AnnotationData> {
        const annotation = this._annotations.get(id);
        if (!annotation) {
            console.warn(`Anotação com ID ${id} não encontrada.`);
            return null;
        }

        // Aplicar atualizações
        const updatedAnnotation: AnnotationData = { 
            ...annotation, 
            ...updates, 
            dateModified: new Date() // Sempre atualiza data de modificação
        };
        
        // Garantir que campos obrigatórios não foram removidos
        updatedAnnotation.type = updatedAnnotation.type || "note";
        updatedAnnotation.author = updatedAnnotation.author || "Unknown";

        // Atualizar no DB
        db.upsertAnnotation(updatedAnnotation);
        this._annotations.set(id, updatedAnnotation);

        // Atualizar marcador visual (posição pode ter mudado)
        this._removeVisualMarker(annotation); // Remove o antigo
        this._createVisualMarker(updatedAnnotation); // Cria o novo

        console.log(`Anotação ${id} atualizada.`);
        return updatedAnnotation;
    }

    /**
     * Obtém uma anotação pelo ID.
     * @param id - ID da anotação.
     * @returns A anotação (AnnotationData) ou undefined se não encontrada.
     */
    public getAnnotationById(id: string): AnnotationData | undefined {
        return this._annotations.get(id);
    }

    /**
     * Obtém todas as anotações.
     * @returns Array com todas as anotações (AnnotationData).
     */
    public getAllAnnotations(): AnnotationData[] {
        return Array.from(this._annotations.values());
    }

    /**
     * Obtém todas as anotações associadas a um equipamento específico.
     * @param targetId - ID do equipamento alvo.
     * @returns Array com as anotações (AnnotationData) do equipamento.
     */
    public getAnnotationsByTarget(targetId: string): AnnotationData[] {
        return Array.from(this._annotations.values()).filter(anno => anno.targetId === targetId);
    }

    /**
     * Cria um marcador visual para a anotação na cena.
     * @param annotation - A anotação (AnnotationData) para a qual criar o marcador.
     */
    private _createVisualMarker(annotation: AnnotationData): void {
        if (!this._annotationsGroup || !this._markerSourceMesh || !SceneManager.scene) {
            console.warn("AnnotationManager não inicializado corretamente para criar marcadores.");
            return;
        }

        // Remover marcador antigo se existir (usa visualMarkerId da annotation)
        this._removeVisualMarker(annotation);

        const marker = this._markerSourceMesh.createInstance(`marker_${annotation.id}`);
        marker.parent = this._annotationsGroup;
        marker.isPickable = true;
        marker.metadata = { annotationId: annotation.id }; // Associar ao ID da anotação

        // Definir posição do marcador usando annotation.position (posição no mundo)
        if (annotation.position) {
             marker.position = annotation.position instanceof Vector3 ? annotation.position : new Vector3(annotation.position.x, annotation.position.y, annotation.position.z);
        } else {
             // Fallback se position não estiver definida (deve estar)
             marker.position = Vector3.Zero();
             console.warn(`Anotação ${annotation.id} sem posição definida para o marcador.`);
        }
        
        // Mudar cor com base no tipo
        if (this._markerMaterial && annotation.type) { // Checar se type existe
             const color = this._getColorForType(annotation.type);
             // Clonar o material para a instância específica
             const instanceMaterial = this._markerMaterial.clone(`markerMat_${annotation.id}`);
             if (instanceMaterial) { // Checar se clone funcionou
                 instanceMaterial.diffuseColor = color;
                 instanceMaterial.emissiveColor = color.scale(0.3);
                 marker.material = instanceMaterial;
             }
        }

        // Atualizar visualMarkerId na anotação em memória e no DB
        annotation.visualMarkerId = marker.id;
        db.upsertAnnotation(annotation); // Salvar o ID do marcador no DB
    }

    /**
     * Remove o marcador visual de uma anotação.
     * @param annotation - A anotação (AnnotationData) cujo marcador deve ser removido.
     */
    private _removeVisualMarker(annotation: AnnotationData): void {
        if (annotation.visualMarkerId && SceneManager.scene) {
            // Usar getMeshById que retorna AbstractMesh ou Nullable<AbstractMesh>
            const marker = SceneManager.getMeshById(annotation.visualMarkerId);
            if (marker instanceof InstancedMesh) { // Verificar se é InstancedMesh antes de acessar material
                // Remover material clonado se existir
                if (marker.material && marker.material !== this._markerMaterial && marker.material.name.startsWith('markerMat_')) {
                    marker.material.dispose();
                }
                marker.dispose();
                annotation.visualMarkerId = undefined; // Limpar ID na anotação em memória
                // Não precisa salvar no DB aqui, será salvo se a anotação for atualizada/removida
            } else if (marker) {
                 // Se encontrou algo mas não é InstancedMesh, apenas dispose
                 marker.dispose();
                 annotation.visualMarkerId = undefined;
            }
        }
    }
    
    /**
     * Obtém a cor para um tipo de anotação.
     * @param type - Tipo da anotação.
     * @returns Cor3 para o tipo.
     */
    private _getColorForType(type: AnnotationData["type"]): Color3 {
        switch (type) {
            case "note":
                return new Color3(0.8, 0.8, 0.8); // Cinza claro
            case "warning":
                return new Color3(1, 0.5, 0); // Laranja
            case "issue":
                return new Color3(1, 0, 0); // Vermelho
            case "docLink":
                return new Color3(0, 0.5, 1); // Azul
            case "measurement":
                return new Color3(0, 1, 0.5); // Verde-azulado
            default:
                return new Color3(1, 1, 0); // Amarelo padrão
        }
    }

    /**
     * Adiciona ou atualiza o link de documentação para um equipamento.
     * @param equipmentId - ID do equipamento.
     * @param url - URL da documentação.
     * @returns true se atualizado com sucesso, false caso contrário.
     */
    public setDocumentationUrl(equipmentId: string, url: string): boolean {
        const equipment = db.getEquipmentById(equipmentId);
        if (!equipment) {
            console.warn(`Equipamento com ID ${equipmentId} não encontrado.`);
            return false;
        }

        equipment.documentationUrl = url;
        db.upsertEquipment(equipment);
        console.log(`URL de documentação atualizada para ${equipmentId}.`);
        return true;
    }

    /**
     * Obtém o link de documentação de um equipamento.
     * @param equipmentId - ID do equipamento.
     * @returns A URL da documentação ou undefined se não houver.
     */
    public getDocumentationUrl(equipmentId: string): string | undefined {
        const equipment = db.getEquipmentById(equipmentId);
        return equipment?.documentationUrl;
    }
}

// Exportar instância singleton para fácil acesso
export const annotationManager = AnnotationManager.getInstance();

// Disponibilizar no escopo global para compatibilidade (opcional)
(window as any).AnnotationManager = annotationManager;


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.annotationManager = exports.AnnotationManager = void 0;
const core_1 = require("@babylonjs/core");
const inMemoryDb_1 = require("../database/inMemoryDb");
/**
 * AnnotationManager - Gerencia anotações e marcações na cena 3D.
 *
 * Permite criar, visualizar, modificar e remover anotações associadas
 * a equipamentos ou posições específicas.
 */
class AnnotationManager {
    /**
     * Obtém a instância única do AnnotationManager (Singleton)
     */
    static getInstance() {
        if (!AnnotationManager._instance) {
            AnnotationManager._instance = new AnnotationManager();
        }
        return AnnotationManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._annotations = new Map();
        this._annotationsGroup = null;
        this._markerMaterial = null;
        this._markerSourceMesh = null;
        // Carregar anotações existentes do DB (se houver)
        this._loadAnnotationsFromDb();
    }
    /**
     * Inicializa o gerenciador com a cena e cria recursos visuais.
     * @param scene - A cena Babylon.js.
     */
    initialize(scene) {
        this._annotationsGroup = SceneManager.getGroup("annotations");
        if (!this._annotationsGroup) {
            this._annotationsGroup = new core_1.TransformNode("annotationsGroup", scene);
            console.warn("Grupo de anotações não encontrado, criando um novo.");
        }
        // Criar material para marcadores
        this._markerMaterial = new core_1.StandardMaterial("annotationMarkerMat", scene);
        this._markerMaterial.diffuseColor = new core_1.Color3(1, 1, 0); // Amarelo
        this._markerMaterial.emissiveColor = new core_1.Color3(0.3, 0.3, 0); // Leve brilho
        // Criar mesh fonte para marcadores (ex: pequena esfera)
        this._markerSourceMesh = core_1.MeshBuilder.CreateSphere("annotationMarkerSource", {
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
    _loadAnnotationsFromDb() {
        const annotationsFromDb = inMemoryDb_1.db.getAllAnnotations();
        annotationsFromDb.forEach(annotation => {
            // Converter posição se necessário
            if (annotation.targetPosition && !(annotation.targetPosition instanceof core_1.Vector3)) {
                annotation.targetPosition = new core_1.Vector3(annotation.targetPosition.x || 0, annotation.targetPosition.y || 0, annotation.targetPosition.z || 0);
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
     * @param position - Posição relativa ao alvo ou absoluta.
     * @param author - Autor da anotação.
     * @param metadata - Metadados adicionais.
     * @returns A anotação criada ou null em caso de erro.
     */
    addAnnotation(targetId, text, type, position, author, metadata) {
        const equipment = inMemoryDb_1.db.getEquipmentById(targetId);
        if (!equipment) {
            console.warn(`Equipamento alvo com ID ${targetId} não encontrado.`);
            // Permitir anotações sem alvo? Por enquanto, não.
            // return null;
        }
        const newAnnotation = {
            id: `anno_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            targetId,
            targetPosition: position, // Posição fornecida
            text,
            author,
            dateCreated: new Date(),
            dateModified: new Date(),
            type,
            metadata
        };
        // Salvar no DB
        inMemoryDb_1.db.upsertAnnotation(newAnnotation);
        this._annotations.set(newAnnotation.id, newAnnotation);
        // Criar marcador visual
        this._createVisualMarker(newAnnotation);
        console.log(`Anotação ${newAnnotation.id} adicionada para ${targetId}.`);
        return newAnnotation;
    }
    /**
     * Remove uma anotação.
     * @param id - ID da anotação a ser removida.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeAnnotation(id) {
        const annotation = this._annotations.get(id);
        if (!annotation) {
            console.warn(`Anotação com ID ${id} não encontrada.`);
            return false;
        }
        // Remover marcador visual
        this._removeVisualMarker(annotation);
        // Remover do DB
        inMemoryDb_1.db.deleteAnnotation(id);
        this._annotations.delete(id);
        console.log(`Anotação ${id} removida.`);
        return true;
    }
    /**
     * Atualiza uma anotação existente.
     * @param id - ID da anotação a ser atualizada.
     * @param updates - Atualizações a serem aplicadas.
     * @returns A anotação atualizada ou null se não encontrada.
     */
    updateAnnotation(id, updates) {
        const annotation = this._annotations.get(id);
        if (!annotation) {
            console.warn(`Anotação com ID ${id} não encontrada.`);
            return null;
        }
        // Aplicar atualizações
        const updatedAnnotation = Object.assign(Object.assign(Object.assign({}, annotation), updates), { dateModified: new Date() });
        // Atualizar no DB
        inMemoryDb_1.db.upsertAnnotation(updatedAnnotation);
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
     * @returns A anotação ou undefined se não encontrada.
     */
    getAnnotationById(id) {
        return this._annotations.get(id);
    }
    /**
     * Obtém todas as anotações.
     * @returns Array com todas as anotações.
     */
    getAllAnnotations() {
        return Array.from(this._annotations.values());
    }
    /**
     * Obtém todas as anotações associadas a um equipamento específico.
     * @param targetId - ID do equipamento alvo.
     * @returns Array com as anotações do equipamento.
     */
    getAnnotationsByTarget(targetId) {
        return Array.from(this._annotations.values()).filter(anno => anno.targetId === targetId);
    }
    /**
     * Cria um marcador visual para a anotação na cena.
     * @param annotation - A anotação para a qual criar o marcador.
     */
    _createVisualMarker(annotation) {
        if (!this._annotationsGroup || !this._markerSourceMesh || !SceneManager.scene) {
            console.warn("AnnotationManager não inicializado corretamente para criar marcadores.");
            return;
        }
        // Remover marcador antigo se existir
        this._removeVisualMarker(annotation);
        const marker = this._markerSourceMesh.createInstance(`marker_${annotation.id}`);
        marker.parent = this._annotationsGroup;
        marker.isPickable = true;
        marker.metadata = { annotationId: annotation.id }; // Associar ao ID da anotação
        // Definir posição
        if (annotation.targetPosition) {
            // Tentar encontrar o nó do equipamento alvo para posicionamento relativo
            const targetNode = SceneManager.scene.getTransformNodeById(annotation.targetId) || SceneManager.scene.getMeshById(annotation.targetId);
            if (targetNode) {
                // Se a posição for relativa (ex: (0, 1, 0) significa 1 unidade acima do centro do alvo)
                // Precisamos transformar a posição relativa para o espaço do mundo
                const worldMatrix = targetNode.getWorldMatrix();
                marker.position = core_1.Vector3.TransformCoordinates(annotation.targetPosition, worldMatrix);
            }
            else {
                // Se o alvo não for encontrado na cena, usar a posição como absoluta
                marker.position = annotation.targetPosition;
            }
        }
        else {
            // Se não houver posição definida, tentar colocar no centro do alvo
            const targetNode = SceneManager.scene.getTransformNodeById(annotation.targetId) || SceneManager.scene.getMeshById(annotation.targetId);
            if (targetNode) {
                marker.position = targetNode.getAbsolutePosition();
            }
            else {
                // Sem alvo e sem posição, colocar na origem (ou logar erro)
                marker.position = core_1.Vector3.Zero();
                console.warn(`Anotação ${annotation.id} sem alvo e sem posição definida.`);
            }
        }
        // Mudar cor com base no tipo?
        if (this._markerMaterial) {
            const color = this._getColorForType(annotation.type);
            // Criar um material específico para esta instância ou usar Vertex Color?
            // Por simplicidade, vamos apenas mudar a cor do material compartilhado por enquanto
            // this._markerMaterial.diffuseColor = color;
            // Uma abordagem melhor seria clonar o material:
            const instanceMaterial = this._markerMaterial.clone(`markerMat_${annotation.id}`);
            instanceMaterial.diffuseColor = color;
            instanceMaterial.emissiveColor = color.scale(0.3);
            marker.material = instanceMaterial;
        }
        annotation.visualMarkerId = marker.id; // Salvar ID do marcador na anotação
    }
    /**
     * Remove o marcador visual de uma anotação.
     * @param annotation - A anotação cujo marcador deve ser removido.
     */
    _removeVisualMarker(annotation) {
        if (annotation.visualMarkerId && SceneManager.scene) {
            const marker = SceneManager.scene.getMeshById(annotation.visualMarkerId);
            if (marker) {
                // Remover material clonado se existir
                if (marker.material && marker.material !== this._markerMaterial) {
                    marker.material.dispose();
                }
                marker.dispose();
            }
            annotation.visualMarkerId = undefined;
        }
    }
    /**
     * Obtém a cor para um tipo de anotação.
     * @param type - Tipo da anotação.
     * @returns Cor3 para o tipo.
     */
    _getColorForType(type) {
        switch (type) {
            case "note":
                return new core_1.Color3(0.8, 0.8, 0.8); // Cinza claro
            case "warning":
                return new core_1.Color3(1, 0.5, 0); // Laranja
            case "issue":
                return new core_1.Color3(1, 0, 0); // Vermelho
            case "docLink":
                return new core_1.Color3(0, 0.5, 1); // Azul
            case "measurement":
                return new core_1.Color3(0, 1, 0.5); // Verde-azulado
            default:
                return new core_1.Color3(1, 1, 0); // Amarelo padrão
        }
    }
    /**
     * Adiciona ou atualiza o link de documentação para um equipamento.
     * @param equipmentId - ID do equipamento.
     * @param url - URL da documentação.
     * @returns true se atualizado com sucesso, false caso contrário.
     */
    setDocumentationUrl(equipmentId, url) {
        const equipment = inMemoryDb_1.db.getEquipmentById(equipmentId);
        if (!equipment) {
            console.warn(`Equipamento com ID ${equipmentId} não encontrado.`);
            return false;
        }
        equipment.documentationUrl = url;
        inMemoryDb_1.db.upsertEquipment(equipment);
        console.log(`URL de documentação atualizada para ${equipmentId}.`);
        return true;
    }
    /**
     * Obtém o link de documentação de um equipamento.
     * @param equipmentId - ID do equipamento.
     * @returns A URL da documentação ou undefined se não houver.
     */
    getDocumentationUrl(equipmentId) {
        const equipment = inMemoryDb_1.db.getEquipmentById(equipmentId);
        return equipment === null || equipment === void 0 ? void 0 : equipment.documentationUrl;
    }
}
exports.AnnotationManager = AnnotationManager;
// Exportar instância singleton para fácil acesso
exports.annotationManager = AnnotationManager.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.AnnotationManager = exports.annotationManager;
//# sourceMappingURL=annotationManager.js.map
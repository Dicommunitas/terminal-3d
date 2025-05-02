"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationManager = exports.NavigationManager = void 0;
const core_1 = require("@babylonjs/core");
const inMemoryDb_1 = require("../database/inMemoryDb");
/**
 * NavigationManager - Gerencia a navegação contextual e pontos de interesse.
 *
 * Permite salvar, carregar e navegar entre pontos de vista predefinidos,
 * além de criar sequências de navegação guiada.
 */
class NavigationManager {
    /**
     * Obtém a instância única do NavigationManager (Singleton)
     */
    static getInstance() {
        if (!NavigationManager._instance) {
            NavigationManager._instance = new NavigationManager();
        }
        return NavigationManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._viewPoints = new Map();
        this._sequences = new Map();
        this._scene = null;
        this._camera = null;
        this._activeSequenceId = null;
        this._currentStepIndex = -1;
        this._sequenceTimer = null;
        // Observáveis para notificar sobre eventos de navegação
        this.onViewPointChangedObservable = new core_1.Observable();
        this.onSequenceStepChangedObservable = new core_1.Observable();
        this.onSequenceCompletedObservable = new core_1.Observable();
    }
    /**
     * Inicializa o gerenciador com a cena e câmera.
     * @param scene - A cena Babylon.js.
     * @param camera - A câmera principal.
     */
    initialize(scene, camera) {
        this._scene = scene;
        this._camera = camera;
        this._initializeDefaultViewPoints();
        console.log("NavigationManager inicializado.");
    }
    /**
     * Inicializa com pontos de vista padrão.
     */
    _initializeDefaultViewPoints() {
        // Exemplo: Criar um ponto de vista para a visão geral do terminal
        if (this._camera && this._camera instanceof core_1.ArcRotateCamera) {
            const overviewPoint = {
                id: "overview",
                name: "Visão Geral",
                description: "Visão panorâmica do terminal",
                targetPosition: new core_1.Vector3(0, 0, 0),
                cameraPosition: new core_1.Vector3(0, 50, -100),
                cameraRotation: {
                    alpha: this._camera.alpha,
                    beta: this._camera.beta,
                    radius: this._camera.radius
                },
                cameraType: "arc",
                tags: ["overview", "default"],
                dateCreated: new Date()
            };
            this._viewPoints.set(overviewPoint.id, overviewPoint);
        }
        console.log("Pontos de vista padrão inicializados.");
    }
    /**
     * Salva o ponto de vista atual da câmera.
     * @param name - Nome do ponto de vista.
     * @param description - Descrição opcional.
     * @param tags - Tags opcionais para categorização.
     * @param equipmentFocus - ID do equipamento em foco (opcional).
     * @returns O ponto de vista criado ou null em caso de erro.
     */
    saveCurrentViewPoint(name, description, tags, equipmentFocus) {
        if (!this._camera || !this._scene) {
            console.error("Camera ou Scene não inicializados.");
            return null;
        }
        let viewPoint;
        const id = `vp_${Date.now()}`;
        if (this._camera instanceof core_1.ArcRotateCamera) {
            viewPoint = {
                id,
                name,
                description,
                targetPosition: this._camera.target.clone(),
                cameraPosition: this._camera.position.clone(),
                cameraRotation: {
                    alpha: this._camera.alpha,
                    beta: this._camera.beta,
                    radius: this._camera.radius
                },
                cameraType: "arc",
                tags,
                equipmentFocus,
                dateCreated: new Date()
            };
        }
        else if (this._camera instanceof core_1.FreeCamera) {
            viewPoint = {
                id,
                name,
                description,
                targetPosition: new core_1.Vector3(0, 0, 0), // Não há target explícito
                cameraPosition: this._camera.position.clone(),
                cameraType: "free",
                tags,
                equipmentFocus,
                dateCreated: new Date()
            };
        }
        else if (this._camera instanceof core_1.TargetCamera) {
            viewPoint = {
                id,
                name,
                description,
                targetPosition: this._camera.getTarget().clone(),
                cameraPosition: this._camera.position.clone(),
                cameraType: "target",
                tags,
                equipmentFocus,
                dateCreated: new Date()
            };
        }
        else {
            console.error("Tipo de câmera não suportado.");
            return null;
        }
        this._viewPoints.set(viewPoint.id, viewPoint);
        console.log(`Ponto de vista '${name}' (ID: ${id}) salvo.`);
        return viewPoint;
    }
    /**
     * Navega para um ponto de vista salvo.
     * @param viewPointId - ID do ponto de vista.
     * @param animate - Se true, anima a transição (padrão: true).
     * @param duration - Duração da animação em segundos (padrão: 1).
     * @returns true se a navegação foi iniciada, false caso contrário.
     */
    navigateToViewPoint(viewPointId, animate = true, duration = 1) {
        const viewPoint = this._viewPoints.get(viewPointId);
        if (!viewPoint || !this._camera || !this._scene) {
            console.warn(`Ponto de vista com ID ${viewPointId} não encontrado ou camera/scene não inicializados.`);
            return false;
        }
        if (animate) {
            // Animação depende do tipo de câmera
            if (this._camera instanceof core_1.ArcRotateCamera && viewPoint.cameraRotation) {
                // Animar ArcRotateCamera
                this._scene.beginAnimation(this._camera, 0, 60 * duration, false, 1.0, () => {
                    this.onViewPointChangedObservable.notifyObservers(viewPoint);
                });
                // Definir valores alvo para a animação
                this._camera.setTarget(viewPoint.targetPosition);
                this._camera.setPosition(viewPoint.cameraPosition);
                this._camera.alpha = viewPoint.cameraRotation.alpha;
                this._camera.beta = viewPoint.cameraRotation.beta;
                this._camera.radius = viewPoint.cameraRotation.radius;
            }
            else {
                // Animar outros tipos de câmera (mais simples)
                this._camera.position = viewPoint.cameraPosition;
                if (this._camera instanceof core_1.TargetCamera) {
                    this._camera.setTarget(viewPoint.targetPosition);
                }
                this.onViewPointChangedObservable.notifyObservers(viewPoint);
            }
        }
        else {
            // Sem animação, apenas definir posição e alvo
            this._camera.position = viewPoint.cameraPosition;
            if (this._camera instanceof core_1.ArcRotateCamera && viewPoint.cameraRotation) {
                this._camera.setTarget(viewPoint.targetPosition);
                this._camera.alpha = viewPoint.cameraRotation.alpha;
                this._camera.beta = viewPoint.cameraRotation.beta;
                this._camera.radius = viewPoint.cameraRotation.radius;
            }
            else if (this._camera instanceof core_1.TargetCamera) {
                this._camera.setTarget(viewPoint.targetPosition);
            }
            this.onViewPointChangedObservable.notifyObservers(viewPoint);
        }
        // Destacar equipamento em foco, se houver
        if (viewPoint.equipmentFocus) {
            this._highlightEquipment(viewPoint.equipmentFocus);
        }
        console.log(`Navegado para ponto de vista '${viewPoint.name}' (ID: ${viewPointId}).`);
        return true;
    }
    /**
     * Destaca um equipamento na cena.
     * @param equipmentId - ID do equipamento.
     * @private
     */
    _highlightEquipment(equipmentId) {
        if (!this._scene)
            return;
        // Buscar o mesh do equipamento na cena
        const mesh = this._scene.getMeshById(equipmentId);
        if (mesh) {
            // Implementar lógica de destaque (ex: emissive, outline, etc.)
            // Exemplo simples: piscar o mesh
            let alpha = 0;
            const highlightInterval = setInterval(() => {
                if (!mesh.material)
                    return;
                alpha += 0.1;
                if (alpha > Math.PI * 2) {
                    clearInterval(highlightInterval);
                    return;
                }
                // Alterar emissive ou outra propriedade para destacar
                // mesh.material.emissiveColor = new Color3(0.5 + Math.sin(alpha) * 0.5, 0, 0);
            }, 50);
        }
    }
    /**
     * Remove um ponto de vista.
     * @param viewPointId - ID do ponto de vista.
     * @returns true se removido com sucesso, false caso contrário.
     */
    removeViewPoint(viewPointId) {
        if (!this._viewPoints.has(viewPointId)) {
            console.warn(`Ponto de vista com ID ${viewPointId} não encontrado.`);
            return false;
        }
        // Verificar se o ponto de vista está sendo usado em alguma sequência
        for (const sequence of this._sequences.values()) {
            if (sequence.steps.some(step => step.viewPointId === viewPointId)) {
                console.warn(`Não é possível remover o ponto de vista ${viewPointId} pois está sendo usado em uma sequência.`);
                return false;
            }
        }
        this._viewPoints.delete(viewPointId);
        console.log(`Ponto de vista ${viewPointId} removido.`);
        return true;
    }
    /**
     * Obtém um ponto de vista pelo ID.
     * @param viewPointId - ID do ponto de vista.
     * @returns O ponto de vista ou undefined se não encontrado.
     */
    getViewPointById(viewPointId) {
        return this._viewPoints.get(viewPointId);
    }
    /**
     * Obtém todos os pontos de vista.
     * @returns Array com todos os pontos de vista.
     */
    getAllViewPoints() {
        return Array.from(this._viewPoints.values());
    }
    /**
     * Obtém pontos de vista filtrados por tags.
     * @param tags - Tags para filtrar.
     * @returns Array com os pontos de vista que possuem pelo menos uma das tags.
     */
    getViewPointsByTags(tags) {
        if (!tags || tags.length === 0)
            return this.getAllViewPoints();
        return Array.from(this._viewPoints.values()).filter(vp => vp.tags && vp.tags.some(tag => tags.includes(tag)));
    }
    /**
     * Cria uma sequência de navegação guiada.
     * @param name - Nome da sequência.
     * @param description - Descrição opcional.
     * @param steps - Etapas da sequência (opcional, pode ser adicionado depois).
     * @returns A sequência criada ou null em caso de erro.
     */
    createNavigationSequence(name, description, steps) {
        const id = `seq_${Date.now()}`;
        if (this._sequences.has(id)) {
            console.error("Erro ao gerar ID de sequência único.");
            return null;
        }
        const sequence = {
            id,
            name,
            description,
            steps: steps || [],
            dateCreated: new Date()
        };
        this._sequences.set(id, sequence);
        console.log(`Sequência de navegação '${name}' (ID: ${id}) criada.`);
        return sequence;
    }
    /**
     * Adiciona uma etapa a uma sequência de navegação.
     * @param sequenceId - ID da sequência.
     * @param viewPointId - ID do ponto de vista.
     * @param name - Nome da etapa.
     * @param description - Descrição opcional.
     * @param duration - Duração em segundos.
     * @param equipmentHighlights - IDs dos equipamentos a destacar.
     * @returns A etapa criada ou null em caso de erro.
     */
    addStepToSequence(sequenceId, viewPointId, name, description, duration = 5, equipmentHighlights) {
        const sequence = this._sequences.get(sequenceId);
        if (!sequence) {
            console.warn(`Sequência com ID ${sequenceId} não encontrada.`);
            return null;
        }
        const viewPoint = this._viewPoints.get(viewPointId);
        if (!viewPoint) {
            console.warn(`Ponto de vista com ID ${viewPointId} não encontrado.`);
            return null;
        }
        const step = {
            id: `step_${Date.now()}_${sequence.steps.length}`,
            name,
            description,
            viewPointId,
            duration,
            order: sequence.steps.length,
            equipmentHighlights
        };
        sequence.steps.push(step);
        console.log(`Etapa '${name}' adicionada à sequência '${sequence.name}'.`);
        return step;
    }
    /**
     * Remove uma etapa de uma sequência.
     * @param sequenceId - ID da sequência.
     * @param stepId - ID da etapa.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeStepFromSequence(sequenceId, stepId) {
        const sequence = this._sequences.get(sequenceId);
        if (!sequence) {
            console.warn(`Sequência com ID ${sequenceId} não encontrada.`);
            return false;
        }
        const stepIndex = sequence.steps.findIndex(step => step.id === stepId);
        if (stepIndex === -1) {
            console.warn(`Etapa com ID ${stepId} não encontrada na sequência ${sequenceId}.`);
            return false;
        }
        sequence.steps.splice(stepIndex, 1);
        // Reordenar as etapas restantes
        sequence.steps.forEach((step, index) => {
            step.order = index;
        });
        console.log(`Etapa ${stepId} removida da sequência ${sequenceId}.`);
        return true;
    }
    /**
     * Inicia a reprodução de uma sequência de navegação.
     * @param sequenceId - ID da sequência.
     * @returns true se a reprodução foi iniciada, false caso contrário.
     */
    playNavigationSequence(sequenceId) {
        const sequence = this._sequences.get(sequenceId);
        if (!sequence || sequence.steps.length === 0) {
            console.warn(`Sequência com ID ${sequenceId} não encontrada ou vazia.`);
            return false;
        }
        // Parar qualquer sequência em andamento
        this.stopNavigationSequence();
        this._activeSequenceId = sequenceId;
        this._currentStepIndex = -1;
        // Iniciar a primeira etapa
        this._playNextStep();
        console.log(`Reprodução da sequência '${sequence.name}' iniciada.`);
        return true;
    }
    /**
     * Reproduz a próxima etapa da sequência ativa.
     * @private
     */
    _playNextStep() {
        if (!this._activeSequenceId)
            return;
        const sequence = this._sequences.get(this._activeSequenceId);
        if (!sequence)
            return;
        this._currentStepIndex++;
        if (this._currentStepIndex >= sequence.steps.length) {
            // Fim da sequência
            this.onSequenceCompletedObservable.notifyObservers(sequence);
            this.stopNavigationSequence();
            return;
        }
        const step = sequence.steps[this._currentStepIndex];
        // Navegar para o ponto de vista da etapa
        this.navigateToViewPoint(step.viewPointId, true, 1);
        // Destacar equipamentos, se houver
        if (step.equipmentHighlights && step.equipmentHighlights.length > 0) {
            step.equipmentHighlights.forEach(eqId => this._highlightEquipment(eqId));
        }
        // Notificar sobre a mudança de etapa
        this.onSequenceStepChangedObservable.notifyObservers(step);
        // Agendar a próxima etapa
        this._sequenceTimer = setTimeout(() => this._playNextStep(), step.duration * 1000);
    }
    /**
     * Para a reprodução da sequência ativa.
     */
    stopNavigationSequence() {
        if (this._sequenceTimer) {
            clearTimeout(this._sequenceTimer);
            this._sequenceTimer = null;
        }
        this._activeSequenceId = null;
        this._currentStepIndex = -1;
        console.log("Reprodução da sequência parada.");
    }
    /**
     * Obtém uma sequência pelo ID.
     * @param sequenceId - ID da sequência.
     * @returns A sequência ou undefined se não encontrada.
     */
    getSequenceById(sequenceId) {
        return this._sequences.get(sequenceId);
    }
    /**
     * Obtém todas as sequências.
     * @returns Array com todas as sequências.
     */
    getAllSequences() {
        return Array.from(this._sequences.values());
    }
    /**
     * Remove uma sequência.
     * @param sequenceId - ID da sequência.
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeSequence(sequenceId) {
        if (!this._sequences.has(sequenceId)) {
            console.warn(`Sequência com ID ${sequenceId} não encontrada.`);
            return false;
        }
        if (this._activeSequenceId === sequenceId) {
            this.stopNavigationSequence();
        }
        this._sequences.delete(sequenceId);
        console.log(`Sequência ${sequenceId} removida.`);
        return true;
    }
    /**
     * Cria um ponto de vista focado em um equipamento específico.
     * @param equipmentId - ID do equipamento.
     * @param name - Nome do ponto de vista.
     * @param description - Descrição opcional.
     * @param distance - Distância da câmera ao equipamento.
     * @returns O ponto de vista criado ou null em caso de erro.
     */
    createViewPointForEquipment(equipmentId, name, description, distance = 10) {
        if (!this._camera || !this._scene) {
            console.error("Camera ou Scene não inicializados.");
            return null;
        }
        const equipment = inMemoryDb_1.db.getEquipmentById(equipmentId);
        if (!equipment || !equipment.position) {
            console.warn(`Equipamento com ID ${equipmentId} não encontrado ou sem posição definida.`);
            return null;
        }
        // Converter posição para Vector3 se necessário
        const position = equipment.position instanceof core_1.Vector3
            ? equipment.position
            : new core_1.Vector3(equipment.position.x || 0, equipment.position.y || 0, equipment.position.z || 0);
        // Criar um ponto de vista olhando para o equipamento
        const id = `vp_eq_${equipmentId}_${Date.now()}`;
        // Calcular uma posição para a câmera (exemplo simples)
        const cameraPosition = position.add(new core_1.Vector3(distance, distance / 2, distance));
        let viewPoint;
        if (this._camera instanceof core_1.ArcRotateCamera) {
            // Para ArcRotateCamera, definir target e calcular alpha/beta/radius
            const direction = cameraPosition.subtract(position);
            const radius = direction.length();
            const alpha = Math.atan2(direction.z, direction.x);
            const beta = Math.acos(direction.y / radius);
            viewPoint = {
                id,
                name,
                description,
                targetPosition: position.clone(),
                cameraPosition: cameraPosition,
                cameraRotation: {
                    alpha,
                    beta,
                    radius
                },
                cameraType: "arc",
                tags: ["equipment", equipment.type],
                equipmentFocus: equipmentId,
                dateCreated: new Date()
            };
        }
        else {
            // Para outros tipos de câmera
            viewPoint = {
                id,
                name,
                description,
                targetPosition: position.clone(),
                cameraPosition: cameraPosition,
                cameraType: this._camera instanceof core_1.FreeCamera ? "free" : "target",
                tags: ["equipment", equipment.type],
                equipmentFocus: equipmentId,
                dateCreated: new Date()
            };
        }
        this._viewPoints.set(viewPoint.id, viewPoint);
        console.log(`Ponto de vista '${name}' para equipamento ${equipmentId} criado.`);
        return viewPoint;
    }
}
exports.NavigationManager = NavigationManager;
// Exportar instância singleton para fácil acesso
exports.navigationManager = NavigationManager.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.NavigationManager = exports.navigationManager;
//# sourceMappingURL=navigationManager.js.map
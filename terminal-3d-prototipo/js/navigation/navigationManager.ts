import { Scene, Vector3, Camera, ArcRotateCamera, TargetCamera, FreeCamera, TransformNode, Mesh, Observable, Observer } from "@babylonjs/core";
import { db, EquipmentDataUnion } from "../database/inMemoryDb";

/**
 * Interface para um ponto de vista salvo
 */
export interface ViewPoint {
    id: string;
    name: string;
    description?: string;
    targetPosition: Vector3;
    cameraPosition: Vector3;
    cameraRotation?: { alpha: number; beta: number; radius: number }; // Para ArcRotateCamera
    cameraType: "arc" | "free" | "target";
    tags?: string[];
    equipmentFocus?: string; // ID do equipamento em foco (opcional)
    dateCreated: Date;
}

/**
 * Interface para uma etapa de navegação guiada
 */
export interface NavigationStep {
    id: string;
    name: string;
    description?: string;
    viewPointId: string; // ID do ponto de vista associado
    duration: number; // Duração em segundos
    order: number; // Ordem na sequência
    equipmentHighlights?: string[]; // IDs dos equipamentos a destacar
}

/**
 * Interface para uma sequência de navegação guiada
 */
export interface NavigationSequence {
    id: string;
    name: string;
    description?: string;
    steps: NavigationStep[];
    dateCreated: Date;
}

/**
 * NavigationManager - Gerencia a navegação contextual e pontos de interesse.
 * 
 * Permite salvar, carregar e navegar entre pontos de vista predefinidos,
 * além de criar sequências de navegação guiada.
 */
export class NavigationManager {
    private static _instance: NavigationManager;
    private _viewPoints: Map<string, ViewPoint> = new Map();
    private _sequences: Map<string, NavigationSequence> = new Map();
    private _scene: Scene | null = null;
    private _camera: Camera | null = null;
    private _activeSequenceId: string | null = null;
    private _currentStepIndex: number = -1;
    private _sequenceTimer: any = null;

    // Observáveis para notificar sobre eventos de navegação
    public onViewPointChangedObservable: Observable<ViewPoint> = new Observable<ViewPoint>();
    public onSequenceStepChangedObservable: Observable<NavigationStep> = new Observable<NavigationStep>();
    public onSequenceCompletedObservable: Observable<NavigationSequence> = new Observable<NavigationSequence>();

    /**
     * Obtém a instância única do NavigationManager (Singleton)
     */
    public static getInstance(): NavigationManager {
        if (!NavigationManager._instance) {
            NavigationManager._instance = new NavigationManager();
        }
        return NavigationManager._instance;
    }

    /**
     * Construtor privado (Singleton)
     */
    private constructor() {}

    /**
     * Inicializa o gerenciador com a cena e câmera.
     * @param scene - A cena Babylon.js.
     * @param camera - A câmera principal.
     */
    public initialize(scene: Scene, camera: Camera): void {
        this._scene = scene;
        this._camera = camera;
        this._initializeDefaultViewPoints();
        console.log("NavigationManager inicializado.");
    }

    /**
     * Inicializa com pontos de vista padrão.
     */
    private _initializeDefaultViewPoints(): void {
        // Exemplo: Criar um ponto de vista para a visão geral do terminal
        if (this._camera && this._camera instanceof ArcRotateCamera) {
            const overviewPoint: ViewPoint = {
                id: "overview",
                name: "Visão Geral",
                description: "Visão panorâmica do terminal",
                targetPosition: new Vector3(0, 0, 0),
                cameraPosition: new Vector3(0, 50, -100),
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
    public saveCurrentViewPoint(
        name: string,
        description?: string,
        tags?: string[],
        equipmentFocus?: string
    ): ViewPoint | null {
        if (!this._camera || !this._scene) {
            console.error("Camera ou Scene não inicializados.");
            return null;
        }

        let viewPoint: ViewPoint;
        const id = `vp_${Date.now()}`;

        if (this._camera instanceof ArcRotateCamera) {
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
        } else if (this._camera instanceof FreeCamera) {
            viewPoint = {
                id,
                name,
                description,
                targetPosition: new Vector3(0, 0, 0), // Não há target explícito
                cameraPosition: this._camera.position.clone(),
                cameraType: "free",
                tags,
                equipmentFocus,
                dateCreated: new Date()
            };
        } else if (this._camera instanceof TargetCamera) {
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
        } else {
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
    public navigateToViewPoint(viewPointId: string, animate: boolean = true, duration: number = 1): boolean {
        const viewPoint = this._viewPoints.get(viewPointId);
        if (!viewPoint || !this._camera || !this._scene) {
            console.warn(`Ponto de vista com ID ${viewPointId} não encontrado ou camera/scene não inicializados.`);
            return false;
        }

        if (animate) {
            // Animação depende do tipo de câmera
            if (this._camera instanceof ArcRotateCamera && viewPoint.cameraRotation) {
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
            } else {
                // Animar outros tipos de câmera (mais simples)
                this._camera.position = viewPoint.cameraPosition;
                if (this._camera instanceof TargetCamera) {
                    this._camera.setTarget(viewPoint.targetPosition);
                }
                this.onViewPointChangedObservable.notifyObservers(viewPoint);
            }
        } else {
            // Sem animação, apenas definir posição e alvo
            this._camera.position = viewPoint.cameraPosition;
            
            if (this._camera instanceof ArcRotateCamera && viewPoint.cameraRotation) {
                this._camera.setTarget(viewPoint.targetPosition);
                this._camera.alpha = viewPoint.cameraRotation.alpha;
                this._camera.beta = viewPoint.cameraRotation.beta;
                this._camera.radius = viewPoint.cameraRotation.radius;
            } else if (this._camera instanceof TargetCamera) {
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
    private _highlightEquipment(equipmentId: string): void {
        if (!this._scene) return;

        // Buscar o mesh do equipamento na cena
        const mesh = this._scene.getMeshById(equipmentId);
        if (mesh) {
            // Implementar lógica de destaque (ex: emissive, outline, etc.)
            // Exemplo simples: piscar o mesh
            let alpha = 0;
            const highlightInterval = setInterval(() => {
                if (!mesh.material) return;
                
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
    public removeViewPoint(viewPointId: string): boolean {
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
    public getViewPointById(viewPointId: string): ViewPoint | undefined {
        return this._viewPoints.get(viewPointId);
    }

    /**
     * Obtém todos os pontos de vista.
     * @returns Array com todos os pontos de vista.
     */
    public getAllViewPoints(): ViewPoint[] {
        return Array.from(this._viewPoints.values());
    }

    /**
     * Obtém pontos de vista filtrados por tags.
     * @param tags - Tags para filtrar.
     * @returns Array com os pontos de vista que possuem pelo menos uma das tags.
     */
    public getViewPointsByTags(tags: string[]): ViewPoint[] {
        if (!tags || tags.length === 0) return this.getAllViewPoints();
        
        return Array.from(this._viewPoints.values()).filter(vp => 
            vp.tags && vp.tags.some(tag => tags.includes(tag))
        );
    }

    /**
     * Cria uma sequência de navegação guiada.
     * @param name - Nome da sequência.
     * @param description - Descrição opcional.
     * @param steps - Etapas da sequência (opcional, pode ser adicionado depois).
     * @returns A sequência criada ou null em caso de erro.
     */
    public createNavigationSequence(
        name: string,
        description?: string,
        steps?: NavigationStep[]
    ): NavigationSequence | null {
        const id = `seq_${Date.now()}`;
        if (this._sequences.has(id)) {
            console.error("Erro ao gerar ID de sequência único.");
            return null;
        }

        const sequence: NavigationSequence = {
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
    public addStepToSequence(
        sequenceId: string,
        viewPointId: string,
        name: string,
        description?: string,
        duration: number = 5,
        equipmentHighlights?: string[]
    ): NavigationStep | null {
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

        const step: NavigationStep = {
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
    public removeStepFromSequence(sequenceId: string, stepId: string): boolean {
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
    public playNavigationSequence(sequenceId: string): boolean {
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
    private _playNextStep(): void {
        if (!this._activeSequenceId) return;
        
        const sequence = this._sequences.get(this._activeSequenceId);
        if (!sequence) return;
        
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
    public stopNavigationSequence(): void {
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
    public getSequenceById(sequenceId: string): NavigationSequence | undefined {
        return this._sequences.get(sequenceId);
    }

    /**
     * Obtém todas as sequências.
     * @returns Array com todas as sequências.
     */
    public getAllSequences(): NavigationSequence[] {
        return Array.from(this._sequences.values());
    }

    /**
     * Remove uma sequência.
     * @param sequenceId - ID da sequência.
     * @returns true se removida com sucesso, false caso contrário.
     */
    public removeSequence(sequenceId: string): boolean {
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
    public createViewPointForEquipment(
        equipmentId: string,
        name: string,
        description?: string,
        distance: number = 10
    ): ViewPoint | null {
        if (!this._camera || !this._scene) {
            console.error("Camera ou Scene não inicializados.");
            return null;
        }

        const equipment = db.getEquipmentById(equipmentId);
        if (!equipment || !equipment.position) {
            console.warn(`Equipamento com ID ${equipmentId} não encontrado ou sem posição definida.`);
            return null;
        }

        // Converter posição para Vector3 se necessário
        const position = equipment.position instanceof Vector3 
            ? equipment.position 
            : new Vector3(
                equipment.position.x || 0,
                equipment.position.y || 0,
                equipment.position.z || 0
            );

        // Criar um ponto de vista olhando para o equipamento
        const id = `vp_eq_${equipmentId}_${Date.now()}`;
        
        // Calcular uma posição para a câmera (exemplo simples)
        const cameraPosition = position.add(new Vector3(distance, distance / 2, distance));
        
        let viewPoint: ViewPoint;
        
        if (this._camera instanceof ArcRotateCamera) {
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
        } else {
            // Para outros tipos de câmera
            viewPoint = {
                id,
                name,
                description,
                targetPosition: position.clone(),
                cameraPosition: cameraPosition,
                cameraType: this._camera instanceof FreeCamera ? "free" : "target",
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

// Exportar instância singleton para fácil acesso
export const navigationManager = NavigationManager.getInstance();

// Disponibilizar no escopo global para compatibilidade (opcional)
(window as any).NavigationManager = navigationManager;

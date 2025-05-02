import { Scene, Vector3, TransformNode, Mesh, MeshBuilder, PBRMaterial, StandardMaterial, Color3, Quaternion, Nullable, Vector4 } from "@babylonjs/core";

// Interface para metadados de equipamentos
interface EquipmentMetadata {
    id: string;
    type: string;
    areaType?: string;
    state?: string;
    data?: any;
    components?: {
        platform: Mesh;
        specificElements: TransformNode;
        stateIndicator: Mesh;
        loadingArms: TransformNode;
    };
    [key: string]: any;
}

// Interface para configuração de tipo de área de carregamento
interface LoadingAreaTypeConfig {
    name: string;
    color: Color3;
    size: { width: number; height: number; depth: number };
}

// Interface para configuração de estado de área de carregamento
interface LoadingAreaStateConfig {
    name: string;
    color: Color3;
}

// Interface para configuração geral de áreas de carregamento
interface LoadingAreaConfig {
    types: { [key: string]: LoadingAreaTypeConfig };
    states: { [key: string]: LoadingAreaStateConfig };
}

// Interface para dados de área de carregamento
interface LoadingAreaData {
    id: string;
    type?: string;
    position: Vector3 | { x: number; y: number; z: number };
    state?: string;
    rotation?: { x?: number; y?: number; z?: number };
    loadingArms?: number;
    [key: string]: any;
}

// Declaração para SceneManager (será importado posteriormente)
declare var SceneManager: {
    scene: Scene;
    getGroup(name: string): TransformNode;
};

// Declaração para EquipmentData (será importado posteriormente)
declare var EquipmentData: {
    loadingAreas?: LoadingAreaData[];
};

/**
 * LoadingAreasManager - Gerenciador de áreas de carregamento
 * 
 * Responsável por criar, modificar e gerenciar as áreas de carregamento
 * na cena 3D do terminal.
 */
export class LoadingAreasManager {
    private static _instance: LoadingAreasManager;
    private _loadingAreasGroup: Nullable<TransformNode> = null;
    private _loadingAreaMeshes: TransformNode[] = [];
    
    // Configurações para as áreas de carregamento
    private readonly _loadingAreaConfig: LoadingAreaConfig = {
        types: {
            truckBay: {
                name: 'Baia de Caminhões',
                color: new Color3(0.7, 0.5, 0.2),
                size: { width: 5, height: 0.2, depth: 12 }
            },
            railLoading: {
                name: 'Carregamento Ferroviário',
                color: new Color3(0.5, 0.5, 0.6),
                size: { width: 3, height: 0.2, depth: 15 }
            },
            marinePier: {
                name: 'Píer Marítimo',
                color: new Color3(0.3, 0.5, 0.7),
                size: { width: 8, height: 0.5, depth: 20 }
            },
            bargeDock: {
                name: 'Doca de Barcaças',
                color: new Color3(0.4, 0.6, 0.7),
                size: { width: 6, height: 0.3, depth: 15 }
            }
        },
        states: {
            available: {
                name: 'Disponível',
                color: new Color3(0.1, 0.7, 0.1)
            },
            loading: {
                name: 'Em Carregamento',
                color: new Color3(0.7, 0.7, 0.1)
            },
            maintenance: {
                name: 'Em Manutenção',
                color: new Color3(0.3, 0.3, 0.7)
            },
            unavailable: {
                name: 'Indisponível',
                color: new Color3(0.7, 0.1, 0.1)
            }
        }
    };
    
    /**
     * Obtém a instância única do LoadingAreasManager (Singleton)
     */
    public static getInstance(): LoadingAreasManager {
        if (!LoadingAreasManager._instance) {
            LoadingAreasManager._instance = new LoadingAreasManager();
        }
        return LoadingAreasManager._instance;
    }
    
    /**
     * Construtor privado (Singleton)
     */
    private constructor() {}
    
    /**
     * Inicializa o gerenciador de áreas de carregamento
     */
    public async initialize(): Promise<void> {
        this._loadingAreasGroup = SceneManager.getGroup('loadingAreas');
        if (!this._loadingAreasGroup) {
            console.error("Grupo de áreas de carregamento não encontrado na cena");
            throw new Error("Grupo de áreas de carregamento não encontrado");
        }
    }
    
    /**
     * Cria as áreas de carregamento na cena
     */
    public async createLoadingAreas(): Promise<void> {
        try {
            await this.initialize();
            
            // Criar áreas de carregamento a partir dos dados (simulados ou reais)
            if (typeof EquipmentData !== 'undefined' && EquipmentData.loadingAreas) {
                // Usar dados do arquivo equipment.js
                EquipmentData.loadingAreas.forEach(areaData => this.createLoadingAreaFromData(areaData));
            } else {
                // Criar áreas de carregamento de demonstração se não houver dados
                this.createDemoLoadingAreas();
            }
        } catch (error) {
            console.error("Erro ao criar áreas de carregamento:", error);
            throw error;
        }
    }
    
    /**
     * Cria uma área de carregamento a partir de dados
     * @param areaData - Dados da área de carregamento
     */
    public createLoadingAreaFromData(areaData: LoadingAreaData): Nullable<TransformNode> {
        // Determinar o tipo de área
        const areaType = areaData.type || 'truckBay';
        const typeConfig = this._loadingAreaConfig.types[areaType] || this._loadingAreaConfig.types.truckBay;
        
        // Determinar estado inicial
        const state = areaData.state || 'available';
        const stateConfig = this._loadingAreaConfig.states[state] || this._loadingAreaConfig.states.available;
        
        // Criar o nó principal para esta área
        const areaNode = new TransformNode(areaData.id, SceneManager.scene);
        areaNode.parent = this._loadingAreasGroup;
        
        // Posicionar a área
        const position = areaData.position instanceof Vector3 
            ? areaData.position 
            : new Vector3(areaData.position.x, areaData.position.y, areaData.position.z);
        
        areaNode.position = position;
        
        // Aplicar rotação se especificada
        if (areaData.rotation) {
            areaNode.rotation = new Vector3(
                areaData.rotation.x || 0,
                areaData.rotation.y || 0,
                areaData.rotation.z || 0
            );
        }
        
        // Criar a plataforma base
        const platform = this._createPlatform(areaData.id, areaType, typeConfig);
        platform.parent = areaNode;
        
        // Adicionar elementos específicos por tipo
        let specificElements: TransformNode;
        
        switch (areaType) {
            case 'truckBay':
                specificElements = this._createTruckBayElements(areaData.id, typeConfig);
                break;
            case 'railLoading':
                specificElements = this._createRailLoadingElements(areaData.id, typeConfig);
                break;
            case 'marinePier':
                specificElements = this._createMarinePierElements(areaData.id, typeConfig);
                break;
            case 'bargeDock':
                specificElements = this._createBargeDockElements(areaData.id, typeConfig);
                break;
            default:
                specificElements = new TransformNode(`${areaData.id}_elements`, SceneManager.scene);
        }
        
        specificElements.parent = areaNode;
        
        // Adicionar indicador de estado
        const stateIndicator = this._createStateIndicator(areaData.id, state, stateConfig);
        stateIndicator.parent = areaNode;
        stateIndicator.position.y = typeConfig.size.height + 0.3; // Acima da plataforma
        
        // Adicionar braços de carregamento
        const loadingArms = this._createLoadingArms(areaData.id, areaType, areaData.loadingArms || 1);
        loadingArms.parent = areaNode;
        
        // Configurar metadados para interação
        (areaNode as any).metadata = {
            id: areaData.id,
            type: 'loadingArea',
            areaType: areaType,
            state: state,
            data: areaData,
            components: {
                platform: platform,
                specificElements: specificElements,
                stateIndicator: stateIndicator,
                loadingArms: loadingArms
            }
        } as EquipmentMetadata;
        
        // Adicionar à lista de áreas de carregamento
        this._loadingAreaMeshes.push(areaNode);
        
        return areaNode;
    }
    
    /**
     * Cria áreas de carregamento de demonstração quando não há dados disponíveis
     */
    public createDemoLoadingAreas(): void {
        console.log("Criando áreas de carregamento de demonstração");
        
        // Baias de caminhões
        const truckBays: LoadingAreaData[] = [
            {
                id: 'TRUCK-BAY-01',
                type: 'truckBay',
                position: new Vector3(-20, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'available',
                loadingArms: 2
            },
            {
                id: 'TRUCK-BAY-02',
                type: 'truckBay',
                position: new Vector3(-10, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'loading',
                loadingArms: 2
            },
            {
                id: 'TRUCK-BAY-03',
                type: 'truckBay',
                position: new Vector3(0, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'maintenance',
                loadingArms: 2
            }
        ];
        // Carregamento ferroviário
        const railLoading: LoadingAreaData[] = [
            {
                id: 'RAIL-LOAD-01',
                type: 'railLoading',
                position: new Vector3(20, 0, -15),
                rotation: { y: Math.PI / 2 },
                state: 'available',
                loadingArms: 3
            }
        ];
        
        // Píer marítimo
        const marinePier: LoadingAreaData[] = [
            {
                id: 'MARINE-PIER-01',
                type: 'marinePier',
                position: new Vector3(-25, 0, -20),
                state: 'loading',
                loadingArms: 4
            }
        ];
        
        // Doca de barcaças
        const bargeDock: LoadingAreaData[] = [
            {
                id: 'BARGE-DOCK-01',
                type: 'bargeDock',
                position: new Vector3(25, 0, -20),
                rotation: { y: Math.PI / 6 },
                state: 'available',
                loadingArms: 2
            }
        ];
        
        // Criar todas as áreas
        truckBays.forEach(areaData => this.createLoadingAreaFromData(areaData));
        railLoading.forEach(areaData => this.createLoadingAreaFromData(areaData));
        marinePier.forEach(areaData => this.createLoadingAreaFromData(areaData));
        bargeDock.forEach(areaData => this.createLoadingAreaFromData(areaData));
    }
    
    /**
     * Cria a plataforma base para uma área de carregamento
     * @param id - ID da área
     * @param type - Tipo de área
     * @param config - Configuração do tipo de área
     * @returns Mesh da plataforma
     */
    private _createPlatform(id: string, type: string, config: LoadingAreaTypeConfig): Mesh {
        const scene = SceneManager.scene;
        
        // Criar plataforma base
        const platform = MeshBuilder.CreateBox(
            `${id}_platform`,
            {
                width: config.size.width,
                height: config.size.height,
                depth: config.size.depth
            },
            scene
        );
        
        // Posicionar a plataforma com o topo no nível do solo
        platform.position.y = config.size.height / 2;
        
        // Material para a plataforma
        const platformMaterial = new PBRMaterial(`${id}_platformMat`, scene);
        platformMaterial.albedoColor = config.color;
        platformMaterial.metallic = 0.3;
        platformMaterial.roughness = 0.7;
        
        platform.material = platformMaterial;
        platform.receiveShadows = true;
        platform.isPickable = true;
        
        return platform;
    }
    
    /**
     * Cria elementos específicos para baia de caminhões
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createTruckBayElements(id: string, config: LoadingAreaTypeConfig): TransformNode {
        const scene = SceneManager.scene;
        const elements = new TransformNode(`${id}_elements`, scene);
        
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        
        // Material para os elementos
        const elementsMaterial = new StandardMaterial(`${id}_elementsMat`, scene);
        elementsMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
        
        // Guias laterais
        const leftGuide = MeshBuilder.CreateBox(`${id}_leftGuide`, { width: 0.3, height: 1, depth: depth }, scene);
        leftGuide.parent = elements;
        leftGuide.position.x = width / 2 - 0.15;
        leftGuide.position.y = 0.5;
        leftGuide.material = elementsMaterial;
        
        const rightGuide = MeshBuilder.CreateBox(`${id}_rightGuide`, { width: 0.3, height: 1, depth: depth }, scene);
        rightGuide.parent = elements;
        rightGuide.position.x = -width / 2 + 0.15;
        rightGuide.position.y = 0.5;
        rightGuide.material = elementsMaterial;
        
        // Balizadores
        for (let i = 0; i < 4; i++) {
            const position = (i % 2 === 0) ? width / 2 : -width / 2;
            const zPos = (i < 2) ? depth / 3 : -depth / 3;
            
            const bollard = MeshBuilder.CreateCylinder(`${id}_bollard_${i}`, { height: 1.2, diameter: 0.4, tessellation: 12 }, scene);
            bollard.parent = elements;
            bollard.position.x = position;
            bollard.position.z = zPos;
            bollard.position.y = 0.6;
            
            // Material zebrado para os balizadores
            const bollardMaterial = new StandardMaterial(`${id}_bollardMat_${i}`, scene);
            bollardMaterial.diffuseColor = (i % 2 === 0) ? new Color3(0.9, 0.1, 0.1) : new Color3(0.9, 0.9, 0.1);
            bollard.material = bollardMaterial;
        }
        
        // Área de contenção de derramamentos (borda elevada)
        // Criação de borda em vez de caixa completa para melhor visualização
        const createBorder = (name: string, w: number, h: number, d: number, thickness: number) => {
            const border = new TransformNode(name, scene);
            const front = MeshBuilder.CreateBox(`${name}_front`, { width: w, height: h, depth: thickness }, scene);
            front.position.z = d / 2 - thickness / 2;
            front.parent = border;
            const back = MeshBuilder.CreateBox(`${name}_back`, { width: w, height: h, depth: thickness }, scene);
            back.position.z = -d / 2 + thickness / 2;
            back.parent = border;
            const left = MeshBuilder.CreateBox(`${name}_left`, { width: thickness, height: h, depth: d - 2 * thickness }, scene);
            left.position.x = -w / 2 + thickness / 2;
            left.parent = border;
            const right = MeshBuilder.CreateBox(`${name}_right`, { width: thickness, height: h, depth: d - 2 * thickness }, scene);
            right.position.x = w / 2 - thickness / 2;
            right.parent = border;
            return border;
        };

        const containment = createBorder(`${id}_containment`, width, 0.1, depth, 0.1);
        containment.parent = elements;
        containment.position.y = config.size.height + 0.05; // Acima da plataforma
        const containmentMaterial = new StandardMaterial(`${id}_containmentMat`, scene);
        containmentMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
        containment.getChildMeshes().forEach(m => m.material = containmentMaterial);
        
        return elements;
    }
    
    /**
     * Cria elementos específicos para carregamento ferroviário
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createRailLoadingElements(id: string, config: LoadingAreaTypeConfig): TransformNode {
        const scene = SceneManager.scene;
        const elements = new TransformNode(`${id}_elements`, scene);
        
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        
        // Material para os elementos
        const railMaterial = new StandardMaterial(`${id}_railMat`, scene);
        railMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
        railMaterial.specularColor = new Color3(0.7, 0.7, 0.7);
        const tieMaterial = new StandardMaterial(`${id}_tieMat`, scene);
        tieMaterial.diffuseColor = new Color3(0.4, 0.3, 0.2); // Marrom escuro
        
        // Trilhos
        const railSpacing = 1.5; // Distância entre trilhos
        
        for (let i = 0; i < 2; i++) {
            const railPos = (i === 0) ? -railSpacing/2 : railSpacing/2;
            
            // Trilho (barra longa)
            const rail = MeshBuilder.CreateBox(`${id}_rail_${i}`, { width: 0.2, height: 0.1, depth: depth * 1.2 }, scene); // Extender um pouco
            rail.parent = elements;
            rail.position.x = railPos;
            rail.position.y = config.size.height + 0.05; // Acima da plataforma
            rail.material = railMaterial;
            
            // Dormentes (travessas)
            for (let j = 0; j < 15; j++) {
                const tiePos = (j - 7) * (depth / 14); // Ajustar espaçamento
                
                const tie = MeshBuilder.CreateBox(`${id}_tie_${j}`, { width: railSpacing + 0.4, height: 0.08, depth: 0.3 }, scene);
                tie.parent = elements;
                tie.position.z = tiePos;
                tie.position.y = config.size.height + 0.04; // Ligeiramente abaixo do trilho
                tie.material = tieMaterial;
            }
        }
        
        return elements;
    }
    
    /**
     * Cria elementos específicos para píer marítimo
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createMarinePierElements(id: string, config: LoadingAreaTypeConfig): TransformNode {
        const scene = SceneManager.scene;
        const elements = new TransformNode(`${id}_elements`, scene);
        
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        
        // Material para os elementos
        const bollardMaterial = new StandardMaterial(`${id}_bollardMat`, scene);
        bollardMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
        
        // Balizadores (bollards) para amarração
        for (let i = 0; i < 6; i++) {
            const position = (i % 2 === 0) ? width / 2 - 0.5 : -width / 2 + 0.5;
            const zPos = (i / 2 - 1) * (depth / 3);
            
            const bollard = MeshBuilder.CreateCylinder(`${id}_bollard_${i}`, { height: 1.5, diameter: 0.6, tessellation: 12 }, scene);
            bollard.parent = elements;
            bollard.position.x = position;
            bollard.position.z = zPos;
            bollard.position.y = config.size.height + 0.75; // Metade da altura acima da plataforma
            bollard.material = bollardMaterial;
        }
        
        // Defensas (fenders)
        const fenderMaterial = new StandardMaterial(`${id}_fenderMat`, scene);
        fenderMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
        for (let i = 0; i < 4; i++) {
             const zPos = (i - 1.5) * (depth / 4);
             const fender = MeshBuilder.CreateBox(`${id}_fender_${i}`, { width: 0.5, height: 2.0, depth: 0.5 }, scene);
             fender.parent = elements;
             fender.position.x = width / 2 + 0.25; // Lado externo
             fender.position.z = zPos;
             fender.position.y = config.size.height; // Alinhado com topo da plataforma
             fender.material = fenderMaterial;
        }
        
        return elements;
    }
    
    /**
     * Cria elementos específicos para doca de barcaças
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    private _createBargeDockElements(id: string, config: LoadingAreaTypeConfig): TransformNode {
        // Similar ao píer, mas talvez menor escala
        return this._createMarinePierElements(id, config); // Reutilizar por enquanto
    }
    
    /**
     * Cria um indicador visual para o estado da área
     * @param id - ID da área
     * @param state - Estado atual
     * @param config - Configuração do estado
     * @returns Mesh do indicador
     */
    private _createStateIndicator(id: string, state: string, config: LoadingAreaStateConfig): Mesh {
        const scene = SceneManager.scene;
        const indicator = MeshBuilder.CreateSphere(`${id}_stateIndicator`, { diameter: 0.4, segments: 12 }, scene);
        indicator.material = this._createMaterial(`${id}_indicatorMat`, config.color);
        indicator.isPickable = false; // Geralmente não selecionável diretamente
        return indicator;
    }
    
    /**
     * Cria braços de carregamento (simplificado)
     * @param id - ID da área
     * @param type - Tipo de área
     * @param count - Número de braços
     * @returns Nó com os braços de carregamento
     */
    private _createLoadingArms(id: string, type: string, count: number): TransformNode {
        const scene = SceneManager.scene;
        const armsNode = new TransformNode(`${id}_loadingArms`, scene);
        const armMaterial = this._createMaterial(`${id}_armMat`, new Color3(0.6, 0.6, 0.6));
        
        const armLength = 5;
        const armDiameter = 0.2;
        
        for (let i = 0; i < count; i++) {
            const armGroup = new TransformNode(`${id}_arm_${i}`, scene);
            armGroup.parent = armsNode;
            
            // Posição inicial do braço (distribuído)
            const spacing = 3;
            armGroup.position.z = (i - (count - 1) / 2) * spacing;
            armGroup.position.y = 1.5; // Altura inicial
            
            // Base do braço
            const base = MeshBuilder.CreateCylinder(`${id}_armBase_${i}`, { height: 1.0, diameter: 0.4 }, scene);
            base.parent = armGroup;
            base.position.y = 0.5;
            base.material = armMaterial;
            
            // Segmento 1
            const seg1 = MeshBuilder.CreateCylinder(`${id}_armSeg1_${i}`, { height: armLength / 2, diameter: armDiameter }, scene);
            seg1.parent = armGroup;
            seg1.position.y = 1.0 + (armLength / 4);
            seg1.rotation.x = Math.PI / 4;
            seg1.material = armMaterial;
            
            // Articulação
            const joint = MeshBuilder.CreateSphere(`${id}_armJoint_${i}`, { diameter: armDiameter * 1.5 }, scene);
            joint.parent = armGroup;
            joint.position.y = 1.0 + (armLength / 2) * Math.sin(Math.PI / 4);
            joint.position.x = (armLength / 2) * Math.cos(Math.PI / 4);
            joint.material = armMaterial;
            
            // Segmento 2
            const seg2 = MeshBuilder.CreateCylinder(`${id}_armSeg2_${i}`, { height: armLength / 2, diameter: armDiameter }, scene);
            seg2.parent = armGroup;
            // Posicionar relativo à articulação
            seg2.position = joint.position.add(new Vector3(armLength / 4, -armLength / 4, 0)); 
            seg2.rotation.x = -Math.PI / 4;
            seg2.material = armMaterial;
        }
        
        return armsNode;
    }
    
    /**
     * Cria um material standard simples
     * @param name - Nome do material
     * @param color - Cor do material
     * @returns Material criado
     */
    private _createMaterial(name: string, color: Color3): StandardMaterial {
        const scene = SceneManager.scene;
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = color;
        return material;
    }
    
    /**
     * Obtém todos os meshes de áreas de carregamento
     * @returns Array de meshes de áreas de carregamento
     */
    public getLoadingAreaMeshes(): TransformNode[] {
        return this._loadingAreaMeshes;
    }
    
    /**
     * Obtém uma área de carregamento específica por ID
     * @param id - ID da área
     * @returns A área encontrada ou null
     */
    public getLoadingAreaById(id: string): Nullable<TransformNode> {
        return this._loadingAreaMeshes.find(area => (area as any).metadata?.id === id) || null;
    }
    
    /**
     * Atualiza o estado de uma área de carregamento
     * @param id - ID da área
     * @param newState - Novo estado ('available', 'loading', etc.)
     * @returns true se a área foi encontrada e atualizada
     */
    public updateLoadingAreaState(id: string, newState: string): boolean {
        const areaNode = this.getLoadingAreaById(id);
        if (!areaNode) return false;
        
        const metadata = (areaNode as any).metadata as EquipmentMetadata;
        if (!metadata || !metadata.components) return false;
        
        const stateConfig = this._loadingAreaConfig.states[newState];
        if (!stateConfig) {
            console.warn(`Estado de área de carregamento inválido: ${newState}`);
            return false;
        }
        
        // Atualizar metadados
        metadata.state = newState;
        
        // Atualizar indicador de estado
        const indicator = metadata.components.stateIndicator;
        if (indicator && indicator.material instanceof StandardMaterial) {
            indicator.material.diffuseColor = stateConfig.color;
        }
        
        // Adicionar lógica para animação ou mudança visual se necessário
        
        return true;
    }
    
    /**
     * Limpa todas as áreas de carregamento da cena
     */
    public clearLoadingAreas(): void {
        this._loadingAreaMeshes.forEach(area => {
            area.dispose();
        });
        this._loadingAreaMeshes = [];
    }
}

// Criar instância global para compatibilidade com código existente
// Isso será removido quando todo o código for migrado para importações ES6
(window as any).LoadingAreasManager = {
    initialize: () => LoadingAreasManager.getInstance().initialize(),
    createLoadingAreas: () => LoadingAreasManager.getInstance().createLoadingAreas(),
    getLoadingAreaMeshes: () => LoadingAreasManager.getInstance().getLoadingAreaMeshes(),
    getLoadingAreaById: (id: string) => LoadingAreasManager.getInstance().getLoadingAreaById(id),
    updateLoadingAreaState: (id: string, newState: string) => LoadingAreasManager.getInstance().updateLoadingAreaState(id, newState),
    clearLoadingAreas: () => LoadingAreasManager.getInstance().clearLoadingAreas()
};

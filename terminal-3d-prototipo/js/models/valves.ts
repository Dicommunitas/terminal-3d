import { Scene, Vector3, TransformNode, Mesh, MeshBuilder, StandardMaterial, Color3, Quaternion, Nullable, InstancedMesh } from "@babylonjs/core";
import { db, ValveData as DbValveData } from "../database/inMemoryDb"; // Importar o DB e a interface de dados

// Interface para metadados internos do mesh
interface EquipmentMetadata {
    id: string;
    type: string; // Sempre 'valve'
    valveType: string; // 'gate', 'ball', etc.
    state: string; // 'open', 'closed', etc.
    data: DbValveData; // Referência aos dados completos do DB
    components: {
        body: Mesh | TransformNode | InstancedMesh;
        wheel: Mesh | TransformNode | InstancedMesh;
        stateIndicator?: Mesh | InstancedMesh; // Opcional
        // Adicionar outros componentes específicos se necessário (ex: esfera interna, disco)
        ballSphere?: Mesh | InstancedMesh;
        butterflyDisk?: Mesh | InstancedMesh;
        checkCap?: Mesh | InstancedMesh;
        checkArrow?: Mesh | InstancedMesh;
        controlActuator?: Mesh | InstancedMesh;
    };
}

// Interface para configuração de tipo de válvula (mantida para geometria)
interface ValveTypeConfig {
    name: string;
    size: { width: number; height: number; depth: number };
    color: Color3;
    lodTessellation?: number; // Tessellation para LOD
}

// Interface para configuração de estado de válvula (mantida para visualização)
interface ValveStateConfig {
    name: string;
    color: Color3;
    wheelRotation: number; // Rotação para volante/alavanca
    diskRotation?: number; // Rotação para disco de borboleta
    sphereRotation?: number; // Rotação para esfera interna
}

// Interface para configuração geral de válvulas (mantida)
interface ValveConfig {
    types: { [key: string]: ValveTypeConfig };
    states: { [key: string]: ValveStateConfig };
    lodDistance: number; // Distância para ativar LOD
}

// Declaração para SceneManager (será importado posteriormente)
declare var SceneManager: {
    scene: Scene;
    getGroup(name: string): TransformNode;
    camera: any; // Referência à câmera para LOD
};

/**
 * ValvesManager - Gerenciador de válvulas
 * 
 * Responsável por criar, modificar e gerenciar as válvulas
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export class ValvesManager {
    private static _instance: ValvesManager;
    private _valvesGroup: Nullable<TransformNode> = null;
    private _valveMeshes: Map<string, TransformNode> = new Map(); // Usar Map para acesso rápido por ID
    
    // Meshes fonte para instancing
    private _sourceMeshes: { [key: string]: Mesh } = {};
    private _instanceMaterials: { [key: string]: StandardMaterial } = {};
    
    // Configurações para as válvulas (mantida)
    private readonly _valveConfig: ValveConfig = {
        types: {
            gate: {
                name: "Gaveta",
                size: { width: 0.6, height: 0.6, depth: 0.4 },
                color: new Color3(0.7, 0.1, 0.1),
                lodTessellation: 8
            },
            ball: {
                name: "Esfera",
                size: { width: 0.5, height: 0.5, depth: 0.5 },
                color: new Color3(0.7, 0.1, 0.1),
                lodTessellation: 8
            },
            check: {
                name: "Retenção",
                size: { width: 0.6, height: 0.5, depth: 0.4 },
                color: new Color3(0.7, 0.3, 0.1),
                lodTessellation: 8
            },
            butterfly: {
                name: "Borboleta",
                size: { width: 0.4, height: 0.6, depth: 0.3 },
                color: new Color3(0.1, 0.3, 0.7),
                lodTessellation: 8
            },
            control: {
                name: "Controle",
                size: { width: 0.7, height: 0.7, depth: 0.5 },
                color: new Color3(0.1, 0.7, 0.3),
                lodTessellation: 8
            }
        },
        states: {
            open: {
                name: "Aberta",
                color: new Color3(0.1, 0.7, 0.1),
                wheelRotation: Math.PI / 2, // Volante/Alavanca
                diskRotation: Math.PI / 2, // Disco borboleta
                sphereRotation: Math.PI / 2 // Esfera interna
            },
            closed: {
                name: "Fechada",
                color: new Color3(0.7, 0.1, 0.1),
                wheelRotation: 0,
                diskRotation: 0,
                sphereRotation: 0
            },
            partial: {
                name: "Parcial",
                color: new Color3(0.7, 0.7, 0.1),
                wheelRotation: Math.PI / 4,
                diskRotation: Math.PI / 4,
                sphereRotation: Math.PI / 4
            },
            maintenance: {
                name: "Manutenção",
                color: new Color3(0.3, 0.3, 0.7),
                wheelRotation: 0,
                diskRotation: 0,
                sphereRotation: 0
            },
            fault: {
                name: "Falha",
                color: new Color3(0.7, 0.3, 0.1),
                wheelRotation: 0,
                diskRotation: 0,
                sphereRotation: 0
            }
        },
        lodDistance: 50 // Distância em unidades da cena para ativar LOD
    };
    
    /**
     * Obtém a instância única do ValvesManager (Singleton)
     */
    public static getInstance(): ValvesManager {
        if (!ValvesManager._instance) {
            ValvesManager._instance = new ValvesManager();
        }
        return ValvesManager._instance;
    }
    
    /**
     * Construtor privado (Singleton)
     */
    private constructor() {}
    
    /**
     * Inicializa o gerenciador de válvulas e cria meshes fonte
     */
    public async initialize(): Promise<void> {
        this._valvesGroup = SceneManager.getGroup("valves");
        if (!this._valvesGroup) {
            console.error("Grupo de válvulas não encontrado na cena");
            throw new Error("Grupo de válvulas não encontrado");
        }
        
        // Criar materiais para instâncias
        this._createInstanceMaterials();
        
        // Criar meshes fonte para instancing
        this._createSourceMeshes();
    }
    
    /**
     * Cria materiais para instâncias
     */
    private _createInstanceMaterials(): void {
        const scene = SceneManager.scene;
        
        // Materiais para cada tipo de válvula
        for (const valveType in this._valveConfig.types) {
            const config = this._valveConfig.types[valveType];
            this._instanceMaterials[valveType] = this._createMaterial(`${valveType}ValveMat_instance`, config.color);
        }
        
        // Materiais para estados
        for (const state in this._valveConfig.states) {
            const config = this._valveConfig.states[state];
            this._instanceMaterials[`state_${state}`] = this._createMaterial(`state_${state}_instance`, config.color);
        }
        
        // Materiais adicionais
        this._instanceMaterials.wheel = this._createMaterial("wheelMat_instance", new Color3(0.1, 0.1, 0.1));
        this._instanceMaterials.actuator = this._createMaterial("actuatorMat_instance", new Color3(0.2, 0.2, 0.2));
        this._instanceMaterials.sphereInner = this._createMaterial("sphereInnerMat_instance", new Color3(0.8, 0.8, 0.8));
        this._instanceMaterials.disk = this._createMaterial("diskMat_instance", new Color3(0.7, 0.7, 0.7));
        this._instanceMaterials.cap = this._createMaterial("capMat_instance", new Color3(0.6, 0.6, 0.6));
        this._instanceMaterials.arrow = this._createMaterial("arrowMat_instance", new Color3(0.1, 0.6, 0.1));
    }
    
    /**
     * Cria meshes fonte para instancing
     */
    private _createSourceMeshes(): void {
        const scene = SceneManager.scene;
        
        // Corpo da válvula de gaveta (box)
        this._sourceMeshes.gateValveBody = MeshBuilder.CreateBox("gateValveBody_source", { width: 1, height: 1, depth: 1 }, scene);
        this._sourceMeshes.gateValveBody.setEnabled(false);
        
        // Corpo da válvula de esfera (cilindro)
        this._sourceMeshes.ballValveBody = MeshBuilder.CreateCylinder("ballValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.ballValveBody.setEnabled(false);
        
        // Esfera interna
        this._sourceMeshes.ballValveSphere = MeshBuilder.CreateSphere("ballValveSphere_source", { diameter: 1, segments: 16 }, scene);
        this._sourceMeshes.ballValveSphere.material = this._instanceMaterials.sphereInner;
        this._sourceMeshes.ballValveSphere.setEnabled(false);
        
        // Corpo da válvula borboleta (cilindro)
        this._sourceMeshes.butterflyValveBody = MeshBuilder.CreateCylinder("butterflyValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.butterflyValveBody.setEnabled(false);
        
        // Disco da válvula borboleta
        this._sourceMeshes.butterflyValveDisk = MeshBuilder.CreateDisc("butterflyValveDisk_source", { radius: 1, tessellation: 16 }, scene);
        this._sourceMeshes.butterflyValveDisk.material = this._instanceMaterials.disk;
        this._sourceMeshes.butterflyValveDisk.setEnabled(false);
        
        // Corpo da válvula de retenção (cilindro)
        this._sourceMeshes.checkValveBody = MeshBuilder.CreateCylinder("checkValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.checkValveBody.setEnabled(false);
        
        // Tampa da válvula de retenção
        this._sourceMeshes.checkValveCap = MeshBuilder.CreateBox("checkValveCap_source", { width: 1, height: 1, depth: 1 }, scene);
        this._sourceMeshes.checkValveCap.material = this._instanceMaterials.cap;
        this._sourceMeshes.checkValveCap.setEnabled(false);
        
        // Seta da válvula de retenção
        this._sourceMeshes.checkValveArrow = MeshBuilder.CreateCylinder("checkValveArrow_source", { diameterTop: 0, diameterBottom: 1, height: 1, tessellation: 4 }, scene);
        this._sourceMeshes.checkValveArrow.material = this._instanceMaterials.arrow;
        this._sourceMeshes.checkValveArrow.setEnabled(false);
        
        // Corpo da válvula de controle (cilindro)
        this._sourceMeshes.controlValveBody = MeshBuilder.CreateCylinder("controlValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.controlValveBody.setEnabled(false);
        
        // Atuador da válvula de controle
        this._sourceMeshes.controlValveActuator = MeshBuilder.CreateBox("controlValveActuator_source", { width: 1, height: 1, depth: 1 }, scene);
        this._sourceMeshes.controlValveActuator.material = this._instanceMaterials.actuator;
        this._sourceMeshes.controlValveActuator.setEnabled(false);
        
        // Volante circular
        this._sourceMeshes.wheel = MeshBuilder.CreateTorus("wheel_source", { diameter: 0.4, thickness: 0.05, tessellation: 16 }, scene);
        this._sourceMeshes.wheel.material = this._instanceMaterials.wheel;
        this._sourceMeshes.wheel.setEnabled(false);
        
        // Alavanca
        this._sourceMeshes.lever = MeshBuilder.CreateBox("lever_source", { width: 1, height: 0.1, depth: 0.1 }, scene);
        this._sourceMeshes.lever.material = this._instanceMaterials.wheel;
        this._sourceMeshes.lever.setEnabled(false);
        
        // Indicador de estado
        this._sourceMeshes.stateIndicator = MeshBuilder.CreateSphere("stateIndicator_source", { diameter: 0.4, segments: 12 }, scene);
        this._sourceMeshes.stateIndicator.setEnabled(false);
        
        // Criar versões LOD dos meshes
        this._createLODMeshes();
    }
    
    /**
     * Cria versões LOD dos meshes fonte
     */
    private _createLODMeshes(): void {
        const scene = SceneManager.scene;
        
        // LOD para válvula de esfera
        this._sourceMeshes.ballValveBodyLOD = MeshBuilder.CreateCylinder("ballValveBody_lod", { 
            height: 1, 
            diameter: 1, 
            tessellation: this._valveConfig.types.ball.lodTessellation || 8 
        }, scene);
        this._sourceMeshes.ballValveBodyLOD.setEnabled(false);
        
        this._sourceMeshes.ballValveSphereLOD = MeshBuilder.CreateSphere("ballValveSphere_lod", { 
            diameter: 1, 
            segments: this._valveConfig.types.ball.lodTessellation || 8 
        }, scene);
        this._sourceMeshes.ballValveSphereLOD.material = this._instanceMaterials.sphereInner;
        this._sourceMeshes.ballValveSphereLOD.setEnabled(false);
        
        // LOD para válvula borboleta
        this._sourceMeshes.butterflyValveBodyLOD = MeshBuilder.CreateCylinder("butterflyValveBody_lod", { 
            height: 1, 
            diameter: 1, 
            tessellation: this._valveConfig.types.butterfly.lodTessellation || 8 
        }, scene);
        this._sourceMeshes.butterflyValveBodyLOD.setEnabled(false);
        
        // LOD para válvula de retenção
        this._sourceMeshes.checkValveBodyLOD = MeshBuilder.CreateCylinder("checkValveBody_lod", { 
            height: 1, 
            diameter: 1, 
            tessellation: this._valveConfig.types.check.lodTessellation || 8 
        }, scene);
        this._sourceMeshes.checkValveBodyLOD.setEnabled(false);
        
        // LOD para válvula de controle
        this._sourceMeshes.controlValveBodyLOD = MeshBuilder.CreateCylinder("controlValveBody_lod", { 
            height: 1, 
            diameter: 1, 
            tessellation: this._valveConfig.types.control.lodTessellation || 8 
        }, scene);
        this._sourceMeshes.controlValveBodyLOD.setEnabled(false);
        
        // LOD para volante
        this._sourceMeshes.wheelLOD = MeshBuilder.CreateTorus("wheel_lod", { 
            diameter: 0.4, 
            thickness: 0.05, 
            tessellation: 8 
        }, scene);
        this._sourceMeshes.wheelLOD.material = this._instanceMaterials.wheel;
        this._sourceMeshes.wheelLOD.setEnabled(false);
        
        // LOD para indicador de estado
        this._sourceMeshes.stateIndicatorLOD = MeshBuilder.CreateSphere("stateIndicator_lod", { 
            diameter: 0.4, 
            segments: 6 
        }, scene);
        this._sourceMeshes.stateIndicatorLOD.setEnabled(false);
    }
    
    /**
     * Cria as válvulas na cena buscando dados do InMemoryDatabase.
     */
    public async createValves(): Promise<void> {
        try {
            await this.initialize();
            console.log("ValvesManager inicializado. Buscando dados de válvulas...");
            
            // Buscar dados das válvulas do banco de dados em memória
            const valveDataList = db.getEquipmentByType("valve") as DbValveData[];
            
            if (valveDataList.length === 0) {
                console.warn("Nenhum dado de válvula encontrado no InMemoryDatabase.");
                return;
            }
            
            // Criar válvulas a partir dos dados do DB
            valveDataList.forEach(valveData => this.createValveFromData(valveData));
            
            console.log(`Total de válvulas criadas: ${this._valveMeshes.size}`);
        } catch (error) {
            console.error("Erro ao criar válvulas:", error);
            throw error;
        }
    }
    
    /**
     * Cria uma válvula a partir de dados do InMemoryDatabase, com otimizações.
     * @param valveData - Dados da válvula (DbValveData).
     */
    public createValveFromData(valveData: DbValveData): Nullable<TransformNode> {
        // Usar valveType para configuração geométrica
        const valveType = valveData.valveType || "gate"; 
        const typeConfig = this._valveConfig.types[valveType] || this._valveConfig.types.gate;
        
        // Determinar estado inicial
        const state = valveData.state || "closed";
        
        // Criar o nó principal para esta válvula
        const valveNode = new TransformNode(valveData.id, SceneManager.scene);
        valveNode.parent = this._valvesGroup;
        
        // Posicionar a válvula
        const position = valveData.position instanceof Vector3 
            ? valveData.position 
            : new Vector3(valveData.position.x || 0, valveData.position.y || 0, valveData.position.z || 0);
        
        valveNode.position = position;
        
        // Aplicar rotação se especificada
        if (valveData.rotation) {
            valveNode.rotation = new Vector3(
                valveData.rotation.x || 0,
                valveData.rotation.y || 0,
                valveData.rotation.z || 0
            );
        }
        
        // Criar componentes da válvula (corpo, volante, etc.)
        const components = this._createValveComponentsOptimized(valveData.id, valveType, typeConfig);
        
        // Adicionar componentes ao nó principal
        Object.values(components).forEach(comp => {
            if (comp) comp.parent = valveNode;
        });
        
        // Configurar metadados para interação
        const metadata: EquipmentMetadata = {
            id: valveData.id,
            type: "valve",
            valveType: valveType,
            state: state,
            data: valveData, // Referência direta aos dados do DB
            components: components as any // Cast para tipo correto
        };
        (valveNode as any).metadata = metadata;
        
        // Adicionar à lista de malhas de válvulas
        this._valveMeshes.set(valveData.id, valveNode);
        
        // Aplicar estado inicial
        this.updateValveState(valveData.id, state, true); // true para forçar atualização inicial
        
        // Tornar o corpo principal selecionável
        if (components.body) {
            components.body.isPickable = true;
        }
        
        return valveNode;
    }
    
    // createDemoValves removido, pois os dados vêm do DB
    
    /**
     * Cria os componentes visuais de uma válvula usando instancing e LOD
     * @param id - ID da válvula
     * @param valveType - Tipo da válvula ("gate", "ball", etc.)
     * @param typeConfig - Configuração do tipo de válvula
     * @returns Um objeto contendo os meshes/instâncias dos componentes
     */
    private _createValveComponentsOptimized(id: string, valveType: string, typeConfig: ValveTypeConfig): Partial<EquipmentMetadata["components"]> {
        const components: Partial<EquipmentMetadata["components"]> = {};
        const size = typeConfig.size;
        const lodDistance = this._valveConfig.lodDistance;
        const lodTessellation = typeConfig.lodTessellation || 8;
        
        let bodySource: Mesh | undefined;
        let bodyLODSource: Mesh | undefined;
        let wheelSource: Mesh | undefined = this._sourceMeshes.wheel;
        let wheelLODSource: Mesh | undefined = this._sourceMeshes.wheelLOD;
        let wheelType: "wheel" | "lever" = "wheel";
        
        // Selecionar meshes fonte com base no tipo
        switch (valveType) {
            case "gate":
                bodySource = this._sourceMeshes.gateValveBody;
                // LOD para gate (usar box mesmo, LOD não crítico aqui)
                break;
            case "ball":
                bodySource = this._sourceMeshes.ballValveBody;
                bodyLODSource = this._sourceMeshes.ballValveBodyLOD;
                wheelSource = this._sourceMeshes.lever;
                wheelLODSource = undefined; // Alavanca não precisa de LOD complexo
                wheelType = "lever";
                break;
            case "butterfly":
                bodySource = this._sourceMeshes.butterflyValveBody;
                bodyLODSource = this._sourceMeshes.butterflyValveBodyLOD;
                wheelSource = this._sourceMeshes.lever;
                wheelLODSource = undefined;
                wheelType = "lever";
                break;
            case "check":
                bodySource = this._sourceMeshes.checkValveBody;
                bodyLODSource = this._sourceMeshes.checkValveBodyLOD;
                wheelSource = undefined; // Válvula de retenção não tem volante
                wheelLODSource = undefined;
                break;
            case "control":
                bodySource = this._sourceMeshes.controlValveBody;
                bodyLODSource = this._sourceMeshes.controlValveBodyLOD;
                wheelSource = undefined; // Válvula de controle tem atuador, não volante direto
                wheelLODSource = undefined;
                break;
            default:
                bodySource = this._sourceMeshes.gateValveBody;
        }
        
        // --- Criar Corpo --- 
        if (bodySource) {
            const bodyInstance = bodySource.createInstance(`${id}_body`);
            bodyInstance.scaling = new Vector3(size.width, size.height, size.depth);
            bodyInstance.material = this._instanceMaterials[valveType];
            components.body = bodyInstance;
            
            // Adicionar LOD ao corpo se disponível
            if (bodyLODSource) {
                const bodyLODInstance = bodyLODSource.createInstance(`${id}_body_lod`);
                bodyLODInstance.scaling = bodyInstance.scaling.clone();
                bodyLODInstance.material = bodyInstance.material;
                bodyLODInstance.setEnabled(false);
                bodyInstance.addLODLevel(lodDistance, bodyLODInstance);
            }
        }
        
        // --- Criar Volante/Alavanca/Atuador --- 
        if (wheelSource && components.body) {
            const wheelInstance = wheelSource.createInstance(`${id}_${wheelType}`);
            wheelInstance.material = this._instanceMaterials.wheel;
            components.wheel = wheelInstance;
            
            // Posicionar volante/alavanca
            if (wheelType === "wheel") {
                wheelInstance.position.y = size.height / 2 + 0.2; // Acima do corpo
                wheelInstance.rotation.x = Math.PI / 2;
            } else { // lever
                wheelInstance.position.y = size.height / 2 + 0.05;
                wheelInstance.scaling.x = 0.5; // Comprimento da alavanca
            }
            
            // Adicionar LOD ao volante se disponível
            if (wheelLODSource) {
                const wheelLODInstance = wheelLODSource.createInstance(`${id}_${wheelType}_lod`);
                wheelLODInstance.material = wheelInstance.material;
                wheelLODInstance.position = wheelInstance.position.clone();
                wheelLODInstance.rotationQuaternion = wheelInstance.rotationQuaternion?.clone() || null;
                wheelLODInstance.scaling = wheelInstance.scaling.clone();
                wheelLODInstance.setEnabled(false);
                wheelInstance.addLODLevel(lodDistance, wheelLODInstance);
            }
        }
        
        // --- Criar Componentes Específicos --- 
        if (valveType === "ball" && components.body) {
            const sphereSource = this._sourceMeshes.ballValveSphere;
            const sphereLODSource = this._sourceMeshes.ballValveSphereLOD;
            if (sphereSource) {
                const sphereInstance = sphereSource.createInstance(`${id}_sphere`);
                sphereInstance.scaling.scaleInPlace(size.width * 0.9); // Ligeiramente menor que o corpo
                sphereInstance.material = this._instanceMaterials.sphereInner;
                components.ballSphere = sphereInstance;
                
                if (sphereLODSource) {
                    const sphereLODInstance = sphereLODSource.createInstance(`${id}_sphere_lod`);
                    sphereLODInstance.scaling = sphereInstance.scaling.clone();
                    sphereLODInstance.material = sphereInstance.material;
                    sphereLODInstance.setEnabled(false);
                    sphereInstance.addLODLevel(lodDistance, sphereLODInstance);
                }
            }
        }
        
        if (valveType === "butterfly" && components.body) {
            const diskSource = this._sourceMeshes.butterflyValveDisk;
            if (diskSource) {
                const diskInstance = diskSource.createInstance(`${id}_disk`);
                diskInstance.scaling.scaleInPlace(size.width * 0.45); // Metade do diâmetro do corpo
                diskInstance.material = this._instanceMaterials.disk;
                components.butterflyDisk = diskInstance;
                // LOD para disco não é crucial
            }
        }
        
        if (valveType === "check" && components.body) {
            const capSource = this._sourceMeshes.checkValveCap;
            const arrowSource = this._sourceMeshes.checkValveArrow;
            if (capSource) {
                const capInstance = capSource.createInstance(`${id}_cap`);
                capInstance.scaling = new Vector3(size.width * 0.5, size.height * 0.3, size.depth * 0.5);
                capInstance.position.y = size.height / 2 + (size.height * 0.3) / 2;
                capInstance.material = this._instanceMaterials.cap;
                components.checkCap = capInstance;
            }
            if (arrowSource) {
                const arrowInstance = arrowSource.createInstance(`${id}_arrow`);
                arrowInstance.scaling = new Vector3(size.width * 0.2, size.height * 0.3, size.width * 0.2);
                arrowInstance.position.y = size.height / 2;
                arrowInstance.rotation.x = Math.PI / 2;
                arrowInstance.material = this._instanceMaterials.arrow;
                components.checkArrow = arrowInstance;
            }
        }
        
        if (valveType === "control" && components.body) {
            const actuatorSource = this._sourceMeshes.controlValveActuator;
            if (actuatorSource) {
                const actuatorInstance = actuatorSource.createInstance(`${id}_actuator`);
                actuatorInstance.scaling = new Vector3(size.width * 0.5, size.height * 0.6, size.width * 0.5);
                actuatorInstance.position.y = size.height / 2 + (size.height * 0.6) / 2;
                actuatorInstance.material = this._instanceMaterials.actuator;
                components.controlActuator = actuatorInstance;
            }
        }
        
        // --- Criar Indicador de Estado --- 
        const stateIndicatorSource = this._sourceMeshes.stateIndicator;
        const stateIndicatorLODSource = this._sourceMeshes.stateIndicatorLOD;
        if (stateIndicatorSource && components.body) {
            const stateIndicatorInstance = stateIndicatorSource.createInstance(`${id}_stateIndicator`);
            stateIndicatorInstance.scaling.scaleInPlace(0.3); // Pequeno indicador
            stateIndicatorInstance.position.y = size.height / 2 + 0.1; // Posição relativa
            stateIndicatorInstance.position.x = size.width / 2 + 0.1;
            components.stateIndicator = stateIndicatorInstance;
            
            if (stateIndicatorLODSource) {
                const stateIndicatorLODInstance = stateIndicatorLODSource.createInstance(`${id}_stateIndicator_lod`);
                stateIndicatorLODInstance.scaling = stateIndicatorInstance.scaling.clone();
                stateIndicatorLODInstance.position = stateIndicatorInstance.position.clone();
                stateIndicatorLODInstance.setEnabled(false);
                stateIndicatorInstance.addLODLevel(lodDistance, stateIndicatorLODInstance);
            }
        }
        
        return components;
    }
    
    /**
     * Atualiza o estado visual e no DB de uma válvula.
     * @param id - ID da válvula.
     * @param newState - Novo estado ("open", "closed", etc.).
     * @param forceUpdate - Força a atualização visual mesmo se o estado for o mesmo.
     * @returns true se a atualização foi bem-sucedida, false caso contrário.
     */
    public updateValveState(id: string, newState: string, forceUpdate: boolean = false): boolean {
        const valveNode = this.getValveNodeById(id);
        if (!valveNode) return false;
        
        const metadata = (valveNode as any).metadata as EquipmentMetadata;
        if (!metadata || !metadata.data || !metadata.components) return false;
        
        const currentState = metadata.state;
        if (currentState === newState && !forceUpdate) {
            return true; // Já está no estado desejado
        }
        
        const stateConfig = this._valveConfig.states[newState];
        if (!stateConfig) {
            console.warn(`Estado desconhecido: ${newState} para válvula ${id}`);
            return false;
        }
        
        // 1. Atualizar estado no DB
        metadata.data.state = newState;
        db.upsertEquipment(metadata.data); // Persiste a mudança no DB
        metadata.state = newState; // Atualiza metadados locais
        
        // 2. Atualizar visualização
        const { wheel, stateIndicator, ballSphere, butterflyDisk } = metadata.components;
        
        // Atualizar rotação do volante/alavanca
        if (wheel) {
            if (metadata.valveType === "ball" || metadata.valveType === "butterfly") {
                // Alavanca geralmente alinhada com o fluxo quando aberta
                wheel.rotation.y = stateConfig.wheelRotation;
            } else {
                // Volante gira em torno do eixo Y
                wheel.rotation.y = stateConfig.wheelRotation; // Ou outro eixo dependendo da modelagem
            }
        }
        
        // Atualizar cor do indicador de estado
        if (stateIndicator) {
            const stateMaterial = this._instanceMaterials[`state_${newState}`];
            if (stateMaterial) {
                stateIndicator.material = stateMaterial;
                // Atualizar material do LOD também
                const lodMesh = stateIndicator.lodMeshes?.[0]?.mesh as InstancedMesh;
                if (lodMesh) {
                    lodMesh.material = stateMaterial;
                }
            }
        }
        
        // Atualizar rotação de componentes internos (esfera, disco)
        if (ballSphere && stateConfig.sphereRotation !== undefined) {
            ballSphere.rotation.y = stateConfig.sphereRotation;
        }
        if (butterflyDisk && stateConfig.diskRotation !== undefined) {
            butterflyDisk.rotation.z = stateConfig.diskRotation; // Ou outro eixo dependendo da modelagem
        }
        
        console.log(`Estado da válvula ${id} atualizado para ${newState} (DB e Visual).`);
        return true;
    }
    
    /**
     * Cria um material standard simples
     */
    private _createMaterial(name: string, color: Color3): StandardMaterial {
        const scene = SceneManager.scene;
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = color;
        return material;
    }
    
    /**
     * Obtém todos os nós de válvulas
     */
    public getValveNodes(): TransformNode[] {
        return Array.from(this._valveMeshes.values());
    }
    
    /**
     * Obtém um nó de válvula específico por ID
     */
    public getValveNodeById(id: string): Nullable<TransformNode> {
        return this._valveMeshes.get(id) || null;
    }
    
    /**
     * Limpa todas as válvulas da cena e meshes fonte
     */
    public clearValves(): void {
        this._valveMeshes.forEach(valve => valve.dispose(false, true)); // Dispose nós e filhos
        this._valveMeshes.clear();
        
        // Limpar meshes fonte (opcional)
        Object.values(this._sourceMeshes).forEach(mesh => mesh.dispose());
        this._sourceMeshes = {};
        Object.values(this._instanceMaterials).forEach(mat => mat.dispose());
        this._instanceMaterials = {};
        console.log("Válvulas e meshes fonte limpos.");
    }
}

// Criar instância global para compatibilidade (se necessário)
// (window as any).ValvesManager = ValvesManager.getInstance();

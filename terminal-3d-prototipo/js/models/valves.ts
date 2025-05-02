import { Scene, Vector3, TransformNode, Mesh, MeshBuilder, StandardMaterial, Color3, Quaternion, Nullable, InstancedMesh, AbstractMesh } from "@babylonjs/core";
import { db, ValveData as DbValveData, EquipmentDataUnion } from "../database/inMemoryDb"; // Importar o DB e a interface de dados

// Import SceneManager properly if it's exported from scene.ts
// Assuming scene.ts exports a SceneManager instance or class
// import { SceneManager } from "./scene"; // Adjust path if necessary

// Temporary declaration until SceneManager is properly imported/structured
declare var SceneManager: {
    scene: Scene;
    getGroup(name: string): Nullable<TransformNode>;
    camera: any; // Referência à câmera para LOD
};

// Define the possible valve states as a type
type ValveState = "open" | "closed" | "partial" | "maintenance" | "fault";

// Interface para metadados internos do mesh
interface ValveMetadata {
    id: string;
    type: "valve"; // Always 'valve'
    valveType: string; // 'gate', 'ball', etc.
    state: ValveState;
    data: DbValveData; // Referência aos dados completos do DB
    components: {
        body: InstancedMesh;
        wheelOrLever: InstancedMesh;
        stateIndicator?: InstancedMesh; // Opcional
        // Adicionar outros componentes específicos se necessário
        ballSphere?: InstancedMesh;
        butterflyDisk?: InstancedMesh;
        checkCap?: InstancedMesh;
        checkArrow?: InstancedMesh;
        controlActuator?: InstancedMesh;
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
    states: { [key in ValveState]: ValveStateConfig }; // Use ValveState type
    lodDistance: number; // Distância para ativar LOD
}

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
    private _valveInstances: Map<string, ValveMetadata> = new Map(); // Store metadata with instance references
    
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
     * Cria um material padrão
     * @param name Nome do material
     * @param color Cor difusa
     * @returns O material criado
     */
    private _createMaterial(name: string, color: Color3): StandardMaterial {
        const material = new StandardMaterial(name, SceneManager.scene);
        material.diffuseColor = color;
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        return material;
    }
    
    /**
     * Cria materiais para instâncias
     */
    private _createInstanceMaterials(): void {
        // Materiais para cada tipo de válvula
        for (const valveType in this._valveConfig.types) {
            const config = this._valveConfig.types[valveType];
            this._instanceMaterials[valveType] = this._createMaterial(`${valveType}ValveMat_instance`, config.color);
        }
        
        // Materiais para estados
        for (const stateKey in this._valveConfig.states) {
            const state = stateKey as ValveState;
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
        const lodDistance = this._valveConfig.lodDistance;
        
        // --- Corpo das Válvulas --- 
        this._sourceMeshes.gateValveBody = MeshBuilder.CreateBox("gateValveBody_source", { width: 1, height: 1, depth: 1 }, scene);
        this._sourceMeshes.ballValveBody = MeshBuilder.CreateCylinder("ballValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.butterflyValveBody = MeshBuilder.CreateCylinder("butterflyValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.checkValveBody = MeshBuilder.CreateCylinder("checkValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.controlValveBody = MeshBuilder.CreateCylinder("controlValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);

        // --- Componentes Internos/Externos --- 
        this._sourceMeshes.ballValveSphere = MeshBuilder.CreateSphere("ballValveSphere_source", { diameter: 1, segments: 16 }, scene);
        this._sourceMeshes.butterflyValveDisk = MeshBuilder.CreateDisc("butterflyValveDisk_source", { radius: 0.5, tessellation: 16 }, scene); // Radius 0.5 to fit diameter 1
        this._sourceMeshes.checkValveCap = MeshBuilder.CreateBox("checkValveCap_source", { width: 1, height: 0.2, depth: 1 }, scene); // Adjusted size
        this._sourceMeshes.checkValveArrow = MeshBuilder.CreateCylinder("checkValveArrow_source", { diameterTop: 0, diameterBottom: 0.2, height: 0.3, tessellation: 4 }, scene); // Adjusted size
        this._sourceMeshes.controlValveActuator = MeshBuilder.CreateBox("controlValveActuator_source", { width: 0.5, height: 0.6, depth: 0.5 }, scene); // Adjusted size
        this._sourceMeshes.wheel = MeshBuilder.CreateTorus("wheel_source", { diameter: 0.4, thickness: 0.05, tessellation: 16 }, scene);
        this._sourceMeshes.lever = MeshBuilder.CreateBox("lever_source", { width: 0.5, height: 0.05, depth: 0.05 }, scene); // Adjusted size
        this._sourceMeshes.stateIndicator = MeshBuilder.CreateSphere("stateIndicator_source", { diameter: 0.15, segments: 12 }, scene); // Adjusted size

        // --- Meshes LOD --- 
        const ballLodTess = this._valveConfig.types.ball.lodTessellation || 8;
        this._sourceMeshes.ballValveBodyLOD = MeshBuilder.CreateCylinder("ballValveBody_lod", { height: 1, diameter: 1, tessellation: ballLodTess }, scene);
        this._sourceMeshes.ballValveSphereLOD = MeshBuilder.CreateSphere("ballValveSphere_lod", { diameter: 1, segments: ballLodTess }, scene);
        
        const butterflyLodTess = this._valveConfig.types.butterfly.lodTessellation || 8;
        this._sourceMeshes.butterflyValveBodyLOD = MeshBuilder.CreateCylinder("butterflyValveBody_lod", { height: 1, diameter: 1, tessellation: butterflyLodTess }, scene);
        this._sourceMeshes.butterflyValveDiskLOD = MeshBuilder.CreateDisc("butterflyValveDisk_lod", { radius: 0.5, tessellation: butterflyLodTess }, scene);

        const checkLodTess = this._valveConfig.types.check.lodTessellation || 8;
        this._sourceMeshes.checkValveBodyLOD = MeshBuilder.CreateCylinder("checkValveBody_lod", { height: 1, diameter: 1, tessellation: checkLodTess }, scene);

        const controlLodTess = this._valveConfig.types.control.lodTessellation || 8;
        this._sourceMeshes.controlValveBodyLOD = MeshBuilder.CreateCylinder("controlValveBody_lod", { height: 1, diameter: 1, tessellation: controlLodTess }, scene);

        this._sourceMeshes.wheelLOD = MeshBuilder.CreateTorus("wheel_lod", { diameter: 0.4, thickness: 0.05, tessellation: 8 }, scene);
        this._sourceMeshes.stateIndicatorLOD = MeshBuilder.CreateSphere("stateIndicator_lod", { diameter: 0.15, segments: 6 }, scene);

        // --- Configurar Materiais, LODs e Desabilitar --- 
        Object.keys(this._sourceMeshes).forEach(key => {
            const mesh = this._sourceMeshes[key];
            if (!mesh) return;

            // Assign materials (example)
            if (key.includes("Sphere")) mesh.material = this._instanceMaterials.sphereInner;
            else if (key.includes("Disk")) mesh.material = this._instanceMaterials.disk;
            else if (key.includes("Cap")) mesh.material = this._instanceMaterials.cap;
            else if (key.includes("Arrow")) mesh.material = this._instanceMaterials.arrow;
            else if (key.includes("Actuator")) mesh.material = this._instanceMaterials.actuator;
            else if (key.includes("wheel") || key.includes("lever")) mesh.material = this._instanceMaterials.wheel;
            // Body material will be set per instance based on type

            // Add LOD levels (example for ball valve body)
            // LOD must be added to the SOURCE mesh
            if (key === "ballValveBody" && this._sourceMeshes.ballValveBodyLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.ballValveBodyLOD);
            }
            if (key === "ballValveSphere" && this._sourceMeshes.ballValveSphereLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.ballValveSphereLOD);
            }
            if (key === "butterflyValveBody" && this._sourceMeshes.butterflyValveBodyLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.butterflyValveBodyLOD);
            }
             if (key === "butterflyValveDisk" && this._sourceMeshes.butterflyValveDiskLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.butterflyValveDiskLOD);
            }
            if (key === "checkValveBody" && this._sourceMeshes.checkValveBodyLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.checkValveBodyLOD);
            }
             if (key === "controlValveBody" && this._sourceMeshes.controlValveBodyLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.controlValveBodyLOD);
            }
            if (key === "wheel" && this._sourceMeshes.wheelLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.wheelLOD);
            }
            if (key === "stateIndicator" && this._sourceMeshes.stateIndicatorLOD) {
                mesh.addLODLevel(lodDistance, this._sourceMeshes.stateIndicatorLOD);
            }
            // Add LODs for other relevant source meshes...

            mesh.setEnabled(false); // Disable source mesh
        });
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
            valveDataList.forEach(valveData => this.createOrUpdateValve(valveData));
            
            console.log(`Total de válvulas criadas/atualizadas: ${this._valveInstances.size}`);
        } catch (error) {
            console.error("Erro ao criar válvulas:", error);
            throw error;
        }
    }
    
    /**
     * Cria ou atualiza uma válvula na cena com base nos dados.
     * @param valveData - Dados da válvula (DbValveData).
     */
    public createOrUpdateValve(valveData: DbValveData): void {
        if (!this._valvesGroup) return;

        const valveId = valveData.id;
        const existingMetadata = this._valveInstances.get(valveId);

        if (existingMetadata) {
            // Update existing valve
            this.updateValve(valveData);
        } else {
            // Create new valve
            this._createValveInstance(valveData);
        }
    }

    /**
     * Cria uma nova instância de válvula.
     * @param valveData - Dados da válvula.
     * @private
     */
    private _createValveInstance(valveData: DbValveData): void {
        if (!this._valvesGroup) return;

        const valveType = valveData.valveType || "gate";
        const typeConfig = this._valveConfig.types[valveType] || this._valveConfig.types.gate;
        const state = (valveData.state || "closed") as ValveState;
        const stateConfig = this._valveConfig.states[state];
        const position = new Vector3(valveData.position?.x || 0, valveData.position?.y || 0, valveData.position?.z || 0);
        const rotationY = valveData.rotation?.y || 0;

        // --- Create Instances --- 
        let bodySourceMesh: Nullable<Mesh> = null;
        let wheelOrLeverSourceMesh: Nullable<Mesh> = null;
        let ballSphereSourceMesh: Nullable<Mesh> = null;
        let butterflyDiskSourceMesh: Nullable<Mesh> = null;
        let checkCapSourceMesh: Nullable<Mesh> = null;
        let checkArrowSourceMesh: Nullable<Mesh> = null;
        let controlActuatorSourceMesh: Nullable<Mesh> = null;

        switch (valveType) {
            case "ball":
                bodySourceMesh = this._sourceMeshes.ballValveBody;
                wheelOrLeverSourceMesh = this._sourceMeshes.lever;
                ballSphereSourceMesh = this._sourceMeshes.ballValveSphere;
                break;
            case "butterfly":
                bodySourceMesh = this._sourceMeshes.butterflyValveBody;
                wheelOrLeverSourceMesh = this._sourceMeshes.lever;
                butterflyDiskSourceMesh = this._sourceMeshes.butterflyValveDisk;
                break;
            case "check":
                bodySourceMesh = this._sourceMeshes.checkValveBody;
                wheelOrLeverSourceMesh = null; // No wheel/lever
                checkCapSourceMesh = this._sourceMeshes.checkValveCap;
                checkArrowSourceMesh = this._sourceMeshes.checkValveArrow;
                break;
            case "control":
                bodySourceMesh = this._sourceMeshes.controlValveBody;
                wheelOrLeverSourceMesh = null; // Actuator instead
                controlActuatorSourceMesh = this._sourceMeshes.controlValveActuator;
                break;
            case "gate":
            default:
                bodySourceMesh = this._sourceMeshes.gateValveBody;
                wheelOrLeverSourceMesh = this._sourceMeshes.wheel;
                break;
        }

        if (!bodySourceMesh) {
            console.error(`Mesh fonte do corpo não encontrado para tipo ${valveType}`);
            return;
        }

        // Create Body Instance
        const bodyInstance = bodySourceMesh.createInstance(`${valveData.id}_body`);
        bodyInstance.position = position;
        bodyInstance.rotationQuaternion = Quaternion.RotationYawPitchRoll(rotationY, 0, 0);
        bodyInstance.scaling.set(typeConfig.size.width, typeConfig.size.height, typeConfig.size.depth);
        bodyInstance.material = this._instanceMaterials[valveType];
        bodyInstance.parent = this._valvesGroup;

        // Create Wheel/Lever Instance
        let wheelOrLeverInstance: Nullable<InstancedMesh> = null;
        if (wheelOrLeverSourceMesh) {
            wheelOrLeverInstance = wheelOrLeverSourceMesh.createInstance(`${valveData.id}_wheelLever`);
            wheelOrLeverInstance.parent = bodyInstance; // Attach to body
            // Adjust position/rotation relative to body based on valve type
            if (valveType === "gate") {
                wheelOrLeverInstance.position.y = typeConfig.size.height / 2 + 0.2; // Position wheel on top
                wheelOrLeverInstance.rotation.x = Math.PI / 2;
            } else if (valveType === "ball" || valveType === "butterfly") {
                wheelOrLeverInstance.position.y = typeConfig.size.height / 2 + 0.05; // Position lever on top
                wheelOrLeverInstance.rotation.z = stateConfig.wheelRotation; // Rotate lever based on state
            }
        }

        // Create State Indicator Instance
        const stateIndicatorSource = this._sourceMeshes.stateIndicator;
        const stateIndicatorInstance = stateIndicatorSource.createInstance(`${valveData.id}_state`);
        stateIndicatorInstance.parent = bodyInstance;
        stateIndicatorInstance.position.y = typeConfig.size.height / 2 + 0.1; // Position above body
        stateIndicatorInstance.material = this._instanceMaterials[`state_${state}`];

        // Create other component instances (sphere, disk, cap, arrow, actuator)
        let ballSphereInstance: Nullable<InstancedMesh> = null;
        if (ballSphereSourceMesh) {
            ballSphereInstance = ballSphereSourceMesh.createInstance(`${valveData.id}_sphere`);
            ballSphereInstance.parent = bodyInstance;
            ballSphereInstance.scaling.set(0.8, 0.8, 0.8); // Scale down slightly
            ballSphereInstance.rotation.y = stateConfig.sphereRotation || 0;
        }
        
        let butterflyDiskInstance: Nullable<InstancedMesh> = null;
        if (butterflyDiskSourceMesh) {
            butterflyDiskInstance = butterflyDiskSourceMesh.createInstance(`${valveData.id}_disk`);
            butterflyDiskInstance.parent = bodyInstance;
            butterflyDiskInstance.rotation.x = stateConfig.diskRotation || 0;
        }
        
        let checkCapInstance: Nullable<InstancedMesh> = null;
        if (checkCapSourceMesh) {
            checkCapInstance = checkCapSourceMesh.createInstance(`${valveData.id}_cap`);
            checkCapInstance.parent = bodyInstance;
            checkCapInstance.position.y = typeConfig.size.height / 2; // Position cap on top
        }
        
        let checkArrowInstance: Nullable<InstancedMesh> = null;
        if (checkArrowSourceMesh) {
            checkArrowInstance = checkArrowSourceMesh.createInstance(`${valveData.id}_arrow`);
            checkArrowInstance.parent = bodyInstance;
            checkArrowInstance.position.y = typeConfig.size.height / 2 + 0.15; // Position arrow above cap
            checkArrowInstance.rotation.x = Math.PI / 2;
        }
        
        let controlActuatorInstance: Nullable<InstancedMesh> = null;
        if (controlActuatorSourceMesh) {
            controlActuatorInstance = controlActuatorSourceMesh.createInstance(`${valveData.id}_actuator`);
            controlActuatorInstance.parent = bodyInstance;
            controlActuatorInstance.position.y = typeConfig.size.height / 2 + 0.3; // Position actuator on top
        }

        // Store metadata
        const metadata: ValveMetadata = {
            id: valveData.id,
            type: "valve",
            valveType: valveType,
            state: state,
            data: valveData,
            components: {
                body: bodyInstance,
                wheelOrLever: wheelOrLeverInstance!,
                stateIndicator: stateIndicatorInstance,
                ballSphere: ballSphereInstance || undefined,
                butterflyDisk: butterflyDiskInstance || undefined,
                checkCap: checkCapInstance || undefined,
                checkArrow: checkArrowInstance || undefined,
                controlActuator: controlActuatorInstance || undefined,
            }
        };
        bodyInstance.metadata = metadata; // Attach metadata to the main body instance
        this._valveInstances.set(valveData.id, metadata);
    }

    /**
     * Atualiza uma válvula existente com base nos novos dados.
     * @param valveData - Novos dados da válvula.
     */
    public updateValve(valveData: DbValveData): void {
        const metadata = this._valveInstances.get(valveData.id);
        if (!metadata) {
            console.warn(`Tentativa de atualizar válvula inexistente: ${valveData.id}`);
            // Optionally create it if it doesn't exist
            // this._createValveInstance(valveData);
            return;
        }

        // Update data reference
        metadata.data = valveData;

        // Update state if changed
        const newState = (valveData.state || "closed") as ValveState;
        if (newState !== metadata.state) {
            this.setValveState(valveData.id, newState);
        }

        // Update position/rotation if changed (optional, might be complex)
        const newPosition = new Vector3(valveData.position?.x || 0, valveData.position?.y || 0, valveData.position?.z || 0);
        if (!metadata.components.body.position.equals(newPosition)) {
            metadata.components.body.position = newPosition;
        }
        // Add rotation update if needed
    }

    /**
     * Define o estado visual de uma válvula.
     * @param valveId - ID da válvula.
     * @param newState - Novo estado ('open', 'closed', 'partial', etc.).
     */
    public setValveState(valveId: string, newState: ValveState): void {
        const metadata = this._valveInstances.get(valveId);
        if (!metadata) {
            console.warn(`Válvula com ID ${valveId} não encontrada para definir estado.`);
            return;
        }

        const stateConfig = this._valveConfig.states[newState];
        if (!stateConfig) {
            console.warn(`Configuração de estado inválida: ${newState}`);
            return;
        }

        // Update metadata state
        metadata.state = newState;
        // Update state in DB data reference as well
        metadata.data.state = newState; 

        // Update state indicator material
        if (metadata.components.stateIndicator) {
            metadata.components.stateIndicator.material = this._instanceMaterials[`state_${newState}`];
        }

        // Update wheel/lever rotation
        if (metadata.components.wheelOrLever && (metadata.valveType === "ball" || metadata.valveType === "butterfly")) {
             metadata.components.wheelOrLever.rotation.z = stateConfig.wheelRotation;
        }
        // Add rotation update for gate valve wheel if needed

        // Update internal components rotation (sphere, disk)
        if (metadata.components.ballSphere && stateConfig.sphereRotation !== undefined) {
            metadata.components.ballSphere.rotation.y = stateConfig.sphereRotation;
        }
        if (metadata.components.butterflyDisk && stateConfig.diskRotation !== undefined) {
            metadata.components.butterflyDisk.rotation.x = stateConfig.diskRotation;
        }

        // console.log(`Estado da válvula ${valveId} definido para ${newState}`);
    }

    /**
     * Obtém os metadados de uma válvula pelo ID.
     * @param valveId - ID da válvula.
     * @returns Os metadados da válvula ou undefined.
     */
    public getValveMetadata(valveId: string): ValveMetadata | undefined {
        return this._valveInstances.get(valveId);
    }

    /**
     * Remove uma válvula da cena.
     * @param valveId - ID da válvula a ser removida.
     */
    public removeValve(valveId: string): void {
        const metadata = this._valveInstances.get(valveId);
        if (metadata) {
            // Dispose all component instances
            Object.values(metadata.components).forEach((component: InstancedMesh | undefined) => {
                component?.dispose();
            });
            this._valveInstances.delete(valveId);
            console.log(`Válvula ${valveId} removida.`);
        } else {
            console.warn(`Válvula com ID ${valveId} não encontrada para remoção.`);
        }
    }

    /**
     * Limpa todas as válvulas e recursos relacionados.
     */
    public dispose(): void {
        // Dispose all instances
        this._valveInstances.forEach(metadata => {
            Object.values(metadata.components).forEach((component: InstancedMesh | undefined) => {
                component?.dispose();
            });
        });
        this._valveInstances.clear();

        // Dispose source meshes
        Object.values(this._sourceMeshes).forEach((mesh: Mesh) => mesh.dispose());
        this._sourceMeshes = {};

        // Dispose instance materials
        Object.values(this._instanceMaterials).forEach((mat: StandardMaterial) => mat.dispose());
        this._instanceMaterials = {};

        this._valvesGroup = null;
        console.log("ValvesManager disposed.");
    }
}

// Exportar instância singleton para fácil acesso
export const valvesManager = ValvesManager.getInstance();


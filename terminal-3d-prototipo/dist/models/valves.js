"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.valvesManager = exports.ValvesManager = void 0;
const core_1 = require("@babylonjs/core");
const inMemoryDb_1 = require("../database/inMemoryDb"); // Importar o DB e a interface de dados
/**
 * ValvesManager - Gerenciador de válvulas
 *
 * Responsável por criar, modificar e gerenciar as válvulas
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
class ValvesManager {
    /**
     * Obtém a instância única do ValvesManager (Singleton)
     */
    static getInstance() {
        if (!ValvesManager._instance) {
            ValvesManager._instance = new ValvesManager();
        }
        return ValvesManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._valvesGroup = null;
        this._valveInstances = new Map(); // Store metadata with instance references
        // Meshes fonte para instancing
        this._sourceMeshes = {};
        this._instanceMaterials = {};
        // Configurações para as válvulas (mantida)
        this._valveConfig = {
            types: {
                gate: {
                    name: "Gaveta",
                    size: { width: 0.6, height: 0.6, depth: 0.4 },
                    color: new core_1.Color3(0.7, 0.1, 0.1),
                    lodTessellation: 8
                },
                ball: {
                    name: "Esfera",
                    size: { width: 0.5, height: 0.5, depth: 0.5 },
                    color: new core_1.Color3(0.7, 0.1, 0.1),
                    lodTessellation: 8
                },
                check: {
                    name: "Retenção",
                    size: { width: 0.6, height: 0.5, depth: 0.4 },
                    color: new core_1.Color3(0.7, 0.3, 0.1),
                    lodTessellation: 8
                },
                butterfly: {
                    name: "Borboleta",
                    size: { width: 0.4, height: 0.6, depth: 0.3 },
                    color: new core_1.Color3(0.1, 0.3, 0.7),
                    lodTessellation: 8
                },
                control: {
                    name: "Controle",
                    size: { width: 0.7, height: 0.7, depth: 0.5 },
                    color: new core_1.Color3(0.1, 0.7, 0.3),
                    lodTessellation: 8
                }
            },
            states: {
                open: {
                    name: "Aberta",
                    color: new core_1.Color3(0.1, 0.7, 0.1),
                    wheelRotation: Math.PI / 2, // Volante/Alavanca
                    diskRotation: Math.PI / 2, // Disco borboleta
                    sphereRotation: Math.PI / 2 // Esfera interna
                },
                closed: {
                    name: "Fechada",
                    color: new core_1.Color3(0.7, 0.1, 0.1),
                    wheelRotation: 0,
                    diskRotation: 0,
                    sphereRotation: 0
                },
                partial: {
                    name: "Parcial",
                    color: new core_1.Color3(0.7, 0.7, 0.1),
                    wheelRotation: Math.PI / 4,
                    diskRotation: Math.PI / 4,
                    sphereRotation: Math.PI / 4
                },
                maintenance: {
                    name: "Manutenção",
                    color: new core_1.Color3(0.3, 0.3, 0.7),
                    wheelRotation: 0,
                    diskRotation: 0,
                    sphereRotation: 0
                },
                fault: {
                    name: "Falha",
                    color: new core_1.Color3(0.7, 0.3, 0.1),
                    wheelRotation: 0,
                    diskRotation: 0,
                    sphereRotation: 0
                }
            },
            lodDistance: 50 // Distância em unidades da cena para ativar LOD
        };
    }
    /**
     * Inicializa o gerenciador de válvulas e cria meshes fonte
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._valvesGroup = SceneManager.getGroup("valves");
            if (!this._valvesGroup) {
                console.error("Grupo de válvulas não encontrado na cena");
                throw new Error("Grupo de válvulas não encontrado");
            }
            // Criar materiais para instâncias
            this._createInstanceMaterials();
            // Criar meshes fonte para instancing
            this._createSourceMeshes();
        });
    }
    /**
     * Cria um material padrão
     * @param name Nome do material
     * @param color Cor difusa
     * @returns O material criado
     */
    _createMaterial(name, color) {
        const material = new core_1.StandardMaterial(name, SceneManager.scene);
        material.diffuseColor = color;
        material.specularColor = new core_1.Color3(0.2, 0.2, 0.2);
        return material;
    }
    /**
     * Cria materiais para instâncias
     */
    _createInstanceMaterials() {
        // Materiais para cada tipo de válvula
        for (const valveType in this._valveConfig.types) {
            const config = this._valveConfig.types[valveType];
            this._instanceMaterials[valveType] = this._createMaterial(`${valveType}ValveMat_instance`, config.color);
        }
        // Materiais para estados
        for (const stateKey in this._valveConfig.states) {
            const state = stateKey;
            const config = this._valveConfig.states[state];
            this._instanceMaterials[`state_${state}`] = this._createMaterial(`state_${state}_instance`, config.color);
        }
        // Materiais adicionais
        this._instanceMaterials.wheel = this._createMaterial("wheelMat_instance", new core_1.Color3(0.1, 0.1, 0.1));
        this._instanceMaterials.actuator = this._createMaterial("actuatorMat_instance", new core_1.Color3(0.2, 0.2, 0.2));
        this._instanceMaterials.sphereInner = this._createMaterial("sphereInnerMat_instance", new core_1.Color3(0.8, 0.8, 0.8));
        this._instanceMaterials.disk = this._createMaterial("diskMat_instance", new core_1.Color3(0.7, 0.7, 0.7));
        this._instanceMaterials.cap = this._createMaterial("capMat_instance", new core_1.Color3(0.6, 0.6, 0.6));
        this._instanceMaterials.arrow = this._createMaterial("arrowMat_instance", new core_1.Color3(0.1, 0.6, 0.1));
    }
    /**
     * Cria meshes fonte para instancing
     */
    _createSourceMeshes() {
        const scene = SceneManager.scene;
        const lodDistance = this._valveConfig.lodDistance;
        // --- Corpo das Válvulas --- 
        this._sourceMeshes.gateValveBody = core_1.MeshBuilder.CreateBox("gateValveBody_source", { width: 1, height: 1, depth: 1 }, scene);
        this._sourceMeshes.ballValveBody = core_1.MeshBuilder.CreateCylinder("ballValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.butterflyValveBody = core_1.MeshBuilder.CreateCylinder("butterflyValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.checkValveBody = core_1.MeshBuilder.CreateCylinder("checkValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        this._sourceMeshes.controlValveBody = core_1.MeshBuilder.CreateCylinder("controlValveBody_source", { height: 1, diameter: 1, tessellation: 16 }, scene);
        // --- Componentes Internos/Externos --- 
        this._sourceMeshes.ballValveSphere = core_1.MeshBuilder.CreateSphere("ballValveSphere_source", { diameter: 1, segments: 16 }, scene);
        this._sourceMeshes.butterflyValveDisk = core_1.MeshBuilder.CreateDisc("butterflyValveDisk_source", { radius: 0.5, tessellation: 16 }, scene); // Radius 0.5 to fit diameter 1
        this._sourceMeshes.checkValveCap = core_1.MeshBuilder.CreateBox("checkValveCap_source", { width: 1, height: 0.2, depth: 1 }, scene); // Adjusted size
        this._sourceMeshes.checkValveArrow = core_1.MeshBuilder.CreateCylinder("checkValveArrow_source", { diameterTop: 0, diameterBottom: 0.2, height: 0.3, tessellation: 4 }, scene); // Adjusted size
        this._sourceMeshes.controlValveActuator = core_1.MeshBuilder.CreateBox("controlValveActuator_source", { width: 0.5, height: 0.6, depth: 0.5 }, scene); // Adjusted size
        this._sourceMeshes.wheel = core_1.MeshBuilder.CreateTorus("wheel_source", { diameter: 0.4, thickness: 0.05, tessellation: 16 }, scene);
        this._sourceMeshes.lever = core_1.MeshBuilder.CreateBox("lever_source", { width: 0.5, height: 0.05, depth: 0.05 }, scene); // Adjusted size
        this._sourceMeshes.stateIndicator = core_1.MeshBuilder.CreateSphere("stateIndicator_source", { diameter: 0.15, segments: 12 }, scene); // Adjusted size
        // --- Meshes LOD --- 
        const ballLodTess = this._valveConfig.types.ball.lodTessellation || 8;
        this._sourceMeshes.ballValveBodyLOD = core_1.MeshBuilder.CreateCylinder("ballValveBody_lod", { height: 1, diameter: 1, tessellation: ballLodTess }, scene);
        this._sourceMeshes.ballValveSphereLOD = core_1.MeshBuilder.CreateSphere("ballValveSphere_lod", { diameter: 1, segments: ballLodTess }, scene);
        const butterflyLodTess = this._valveConfig.types.butterfly.lodTessellation || 8;
        this._sourceMeshes.butterflyValveBodyLOD = core_1.MeshBuilder.CreateCylinder("butterflyValveBody_lod", { height: 1, diameter: 1, tessellation: butterflyLodTess }, scene);
        this._sourceMeshes.butterflyValveDiskLOD = core_1.MeshBuilder.CreateDisc("butterflyValveDisk_lod", { radius: 0.5, tessellation: butterflyLodTess }, scene);
        const checkLodTess = this._valveConfig.types.check.lodTessellation || 8;
        this._sourceMeshes.checkValveBodyLOD = core_1.MeshBuilder.CreateCylinder("checkValveBody_lod", { height: 1, diameter: 1, tessellation: checkLodTess }, scene);
        const controlLodTess = this._valveConfig.types.control.lodTessellation || 8;
        this._sourceMeshes.controlValveBodyLOD = core_1.MeshBuilder.CreateCylinder("controlValveBody_lod", { height: 1, diameter: 1, tessellation: controlLodTess }, scene);
        this._sourceMeshes.wheelLOD = core_1.MeshBuilder.CreateTorus("wheel_lod", { diameter: 0.4, thickness: 0.05, tessellation: 8 }, scene);
        this._sourceMeshes.stateIndicatorLOD = core_1.MeshBuilder.CreateSphere("stateIndicator_lod", { diameter: 0.15, segments: 6 }, scene);
        // --- Configurar Materiais, LODs e Desabilitar --- 
        Object.keys(this._sourceMeshes).forEach(key => {
            const mesh = this._sourceMeshes[key];
            if (!mesh)
                return;
            // Assign materials (example)
            if (key.includes("Sphere"))
                mesh.material = this._instanceMaterials.sphereInner;
            else if (key.includes("Disk"))
                mesh.material = this._instanceMaterials.disk;
            else if (key.includes("Cap"))
                mesh.material = this._instanceMaterials.cap;
            else if (key.includes("Arrow"))
                mesh.material = this._instanceMaterials.arrow;
            else if (key.includes("Actuator"))
                mesh.material = this._instanceMaterials.actuator;
            else if (key.includes("wheel") || key.includes("lever"))
                mesh.material = this._instanceMaterials.wheel;
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
    createValves() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                console.log("ValvesManager inicializado. Buscando dados de válvulas...");
                // Buscar dados das válvulas do banco de dados em memória
                const valveDataList = inMemoryDb_1.db.getEquipmentByType("valve");
                if (valveDataList.length === 0) {
                    console.warn("Nenhum dado de válvula encontrado no InMemoryDatabase.");
                    return;
                }
                // Criar válvulas a partir dos dados do DB
                valveDataList.forEach(valveData => this.createOrUpdateValve(valveData));
                console.log(`Total de válvulas criadas/atualizadas: ${this._valveInstances.size}`);
            }
            catch (error) {
                console.error("Erro ao criar válvulas:", error);
                throw error;
            }
        });
    }
    /**
     * Cria ou atualiza uma válvula na cena com base nos dados.
     * @param valveData - Dados da válvula (DbValveData).
     */
    createOrUpdateValve(valveData) {
        if (!this._valvesGroup)
            return;
        const valveId = valveData.id;
        const existingMetadata = this._valveInstances.get(valveId);
        if (existingMetadata) {
            // Update existing valve
            this.updateValve(valveData);
        }
        else {
            // Create new valve
            this._createValveInstance(valveData);
        }
    }
    /**
     * Cria uma nova instância de válvula.
     * @param valveData - Dados da válvula.
     * @private
     */
    _createValveInstance(valveData) {
        var _a, _b, _c, _d;
        if (!this._valvesGroup)
            return;
        const valveType = valveData.valveType || "gate";
        const typeConfig = this._valveConfig.types[valveType] || this._valveConfig.types.gate;
        const state = (valveData.state || "closed");
        const stateConfig = this._valveConfig.states[state];
        const position = new core_1.Vector3(((_a = valveData.position) === null || _a === void 0 ? void 0 : _a.x) || 0, ((_b = valveData.position) === null || _b === void 0 ? void 0 : _b.y) || 0, ((_c = valveData.position) === null || _c === void 0 ? void 0 : _c.z) || 0);
        const rotationY = ((_d = valveData.rotation) === null || _d === void 0 ? void 0 : _d.y) || 0;
        // --- Create Instances --- 
        let bodySourceMesh = null;
        let wheelOrLeverSourceMesh = null;
        let ballSphereSourceMesh = null;
        let butterflyDiskSourceMesh = null;
        let checkCapSourceMesh = null;
        let checkArrowSourceMesh = null;
        let controlActuatorSourceMesh = null;
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
        bodyInstance.rotationQuaternion = core_1.Quaternion.RotationYawPitchRoll(rotationY, 0, 0);
        bodyInstance.scaling.set(typeConfig.size.width, typeConfig.size.height, typeConfig.size.depth);
        bodyInstance.material = this._instanceMaterials[valveType];
        bodyInstance.parent = this._valvesGroup;
        // Create Wheel/Lever Instance
        let wheelOrLeverInstance = null;
        if (wheelOrLeverSourceMesh) {
            wheelOrLeverInstance = wheelOrLeverSourceMesh.createInstance(`${valveData.id}_wheelLever`);
            wheelOrLeverInstance.parent = bodyInstance; // Attach to body
            // Adjust position/rotation relative to body based on valve type
            if (valveType === "gate") {
                wheelOrLeverInstance.position.y = typeConfig.size.height / 2 + 0.2; // Position wheel on top
                wheelOrLeverInstance.rotation.x = Math.PI / 2;
            }
            else if (valveType === "ball" || valveType === "butterfly") {
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
        let ballSphereInstance = null;
        if (ballSphereSourceMesh) {
            ballSphereInstance = ballSphereSourceMesh.createInstance(`${valveData.id}_sphere`);
            ballSphereInstance.parent = bodyInstance;
            ballSphereInstance.scaling.set(0.8, 0.8, 0.8); // Scale down slightly
            ballSphereInstance.rotation.y = stateConfig.sphereRotation || 0;
        }
        let butterflyDiskInstance = null;
        if (butterflyDiskSourceMesh) {
            butterflyDiskInstance = butterflyDiskSourceMesh.createInstance(`${valveData.id}_disk`);
            butterflyDiskInstance.parent = bodyInstance;
            butterflyDiskInstance.rotation.x = stateConfig.diskRotation || 0;
        }
        let checkCapInstance = null;
        if (checkCapSourceMesh) {
            checkCapInstance = checkCapSourceMesh.createInstance(`${valveData.id}_cap`);
            checkCapInstance.parent = bodyInstance;
            checkCapInstance.position.y = typeConfig.size.height / 2; // Position cap on top
        }
        let checkArrowInstance = null;
        if (checkArrowSourceMesh) {
            checkArrowInstance = checkArrowSourceMesh.createInstance(`${valveData.id}_arrow`);
            checkArrowInstance.parent = bodyInstance;
            checkArrowInstance.position.y = typeConfig.size.height / 2 + 0.15; // Position arrow above cap
            checkArrowInstance.rotation.x = Math.PI / 2;
        }
        let controlActuatorInstance = null;
        if (controlActuatorSourceMesh) {
            controlActuatorInstance = controlActuatorSourceMesh.createInstance(`${valveData.id}_actuator`);
            controlActuatorInstance.parent = bodyInstance;
            controlActuatorInstance.position.y = typeConfig.size.height / 2 + 0.3; // Position actuator on top
        }
        // Store metadata
        const metadata = {
            id: valveData.id,
            type: "valve",
            valveType: valveType,
            state: state,
            data: valveData,
            components: {
                body: bodyInstance,
                wheelOrLever: wheelOrLeverInstance,
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
    updateValve(valveData) {
        var _a, _b, _c;
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
        const newState = (valveData.state || "closed");
        if (newState !== metadata.state) {
            this.setValveState(valveData.id, newState);
        }
        // Update position/rotation if changed (optional, might be complex)
        const newPosition = new core_1.Vector3(((_a = valveData.position) === null || _a === void 0 ? void 0 : _a.x) || 0, ((_b = valveData.position) === null || _b === void 0 ? void 0 : _b.y) || 0, ((_c = valveData.position) === null || _c === void 0 ? void 0 : _c.z) || 0);
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
    setValveState(valveId, newState) {
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
    getValveMetadata(valveId) {
        return this._valveInstances.get(valveId);
    }
    /**
     * Remove uma válvula da cena.
     * @param valveId - ID da válvula a ser removida.
     */
    removeValve(valveId) {
        const metadata = this._valveInstances.get(valveId);
        if (metadata) {
            // Dispose all component instances
            Object.values(metadata.components).forEach((component) => {
                component === null || component === void 0 ? void 0 : component.dispose();
            });
            this._valveInstances.delete(valveId);
            console.log(`Válvula ${valveId} removida.`);
        }
        else {
            console.warn(`Válvula com ID ${valveId} não encontrada para remoção.`);
        }
    }
    /**
     * Limpa todas as válvulas e recursos relacionados.
     */
    dispose() {
        // Dispose all instances
        this._valveInstances.forEach(metadata => {
            Object.values(metadata.components).forEach((component) => {
                component === null || component === void 0 ? void 0 : component.dispose();
            });
        });
        this._valveInstances.clear();
        // Dispose source meshes
        Object.values(this._sourceMeshes).forEach((mesh) => mesh.dispose());
        this._sourceMeshes = {};
        // Dispose instance materials
        Object.values(this._instanceMaterials).forEach((mat) => mat.dispose());
        this._instanceMaterials = {};
        this._valvesGroup = null;
        console.log("ValvesManager disposed.");
    }
}
exports.ValvesManager = ValvesManager;
// Exportar instância singleton para fácil acesso
exports.valvesManager = ValvesManager.getInstance();
//# sourceMappingURL=valves.js.map
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Vector3, MeshBuilder, StandardMaterial, Color3, Quaternion } from "@babylonjs/core";
import { db } from "../database/inMemoryDb"; // Importar o DB e a interface de dados
/**
 * ValvesManager - Gerenciador de válvulas
 *
 * Responsável por criar, modificar e gerenciar as válvulas
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export class ValvesManager {
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
        const material = new StandardMaterial(name, SceneManager.scene);
        material.diffuseColor = color;
        material.specularColor = new Color3(0.2, 0.2, 0.2);
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
    _createSourceMeshes() {
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
                const valveDataList = db.getEquipmentByType("valve");
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
     * @param valveData - Dados da válvula do DB.
     * @returns A instância do mesh principal da válvula ou null em caso de erro.
     */
    createOrUpdateValve(valveData) {
        if (!this._valvesGroup) {
            console.error("ValvesManager não inicializado.");
            return null;
        }
        const valveType = valveData.valveType;
        const typeConfig = this._valveConfig.types[valveType];
        if (!typeConfig) {
            console.warn(`Tipo de válvula desconhecido: ${valveType}`);
            return null;
        }
        let existingMetadata = this._valveInstances.get(valveData.id);
        let valveBodyInstance;
        let wheelOrLeverInstance;
        let stateIndicatorInstance = null;
        let ballSphereInstance = null;
        let butterflyDiskInstance = null;
        let checkCapInstance = null;
        let checkArrowInstance = null;
        let controlActuatorInstance = null;
        // Determinar qual mesh fonte usar para o corpo
        let bodySourceMeshKey = `${valveType}ValveBody`;
        if (!this._sourceMeshes[bodySourceMeshKey]) {
            console.warn(`Mesh fonte não encontrado para o corpo da válvula: ${bodySourceMeshKey}. Usando gate.`);
            bodySourceMeshKey = "gateValveBody"; // Fallback
        }
        const bodySourceMesh = this._sourceMeshes[bodySourceMeshKey];
        if (!bodySourceMesh) {
            console.error(`Mesh fonte ${bodySourceMeshKey} não encontrado!`);
            return null;
        }
        // Determinar qual mesh fonte usar para volante/alavanca
        let wheelLeverSourceMeshKey = (valveType === "ball" || valveType === "butterfly") ? "lever" : "wheel";
        const wheelLeverSourceMesh = this._sourceMeshes[wheelLeverSourceMeshKey];
        if (!wheelLeverSourceMesh) {
            console.error(`Mesh fonte ${wheelLeverSourceMeshKey} não encontrado!`);
            return null;
        }
        // Mesh fonte para indicador de estado
        const stateIndicatorSourceMesh = this._sourceMeshes.stateIndicator;
        // Meshes fonte específicos
        const ballSphereSource = this._sourceMeshes.ballValveSphere;
        const butterflyDiskSource = this._sourceMeshes.butterflyValveDisk;
        const checkCapSource = this._sourceMeshes.checkValveCap;
        const checkArrowSource = this._sourceMeshes.checkValveArrow;
        const controlActuatorSource = this._sourceMeshes.controlValveActuator;
        if (existingMetadata) {
            // Atualizar instância existente
            valveBodyInstance = existingMetadata.components.body;
            wheelOrLeverInstance = existingMetadata.components.wheelOrLever;
            stateIndicatorInstance = existingMetadata.components.stateIndicator || null;
            ballSphereInstance = existingMetadata.components.ballSphere || null;
            butterflyDiskInstance = existingMetadata.components.butterflyDisk || null;
            checkCapInstance = existingMetadata.components.checkCap || null;
            checkArrowInstance = existingMetadata.components.checkArrow || null;
            controlActuatorInstance = existingMetadata.components.controlActuator || null;
            // Atualizar metadados
            existingMetadata.data = valveData;
            existingMetadata.state = valveData.state;
            existingMetadata.valveType = valveType;
            valveBodyInstance.metadata = existingMetadata; // Atualizar metadados na instância principal
            console.log(`Atualizando válvula existente: ${valveData.id}`);
        }
        else {
            // Criar nova instância
            valveBodyInstance = bodySourceMesh.createInstance(`valve_${valveData.id}_body`);
            wheelOrLeverInstance = wheelLeverSourceMesh.createInstance(`valve_${valveData.id}_${wheelLeverSourceMeshKey}`);
            // Criar indicador de estado se o mesh fonte existir
            if (stateIndicatorSourceMesh) {
                stateIndicatorInstance = stateIndicatorSourceMesh.createInstance(`valve_${valveData.id}_indicator`);
                stateIndicatorInstance.parent = valveBodyInstance; // Anexar ao corpo
            }
            // Criar componentes específicos
            if (valveType === "ball" && ballSphereSource) {
                ballSphereInstance = ballSphereSource.createInstance(`valve_${valveData.id}_sphere`);
                ballSphereInstance.parent = valveBodyInstance;
            }
            if (valveType === "butterfly" && butterflyDiskSource) {
                butterflyDiskInstance = butterflyDiskSource.createInstance(`valve_${valveData.id}_disk`);
                butterflyDiskInstance.parent = valveBodyInstance;
            }
            if (valveType === "check" && checkCapSource && checkArrowSource) {
                checkCapInstance = checkCapSource.createInstance(`valve_${valveData.id}_cap`);
                checkArrowInstance = checkArrowSource.createInstance(`valve_${valveData.id}_arrow`);
                checkCapInstance.parent = valveBodyInstance;
                checkArrowInstance.parent = valveBodyInstance;
            }
            if (valveType === "control" && controlActuatorSource) {
                controlActuatorInstance = controlActuatorSource.createInstance(`valve_${valveData.id}_actuator`);
                controlActuatorInstance.parent = valveBodyInstance;
            }
            valveBodyInstance.parent = this._valvesGroup;
            wheelOrLeverInstance.parent = valveBodyInstance; // Anexar ao corpo
            // Criar metadados
            const metadata = {
                id: valveData.id,
                type: "valve",
                valveType: valveType,
                state: valveData.state,
                data: valveData,
                components: {
                    body: valveBodyInstance,
                    wheelOrLever: wheelOrLeverInstance,
                    stateIndicator: stateIndicatorInstance || undefined,
                    ballSphere: ballSphereInstance || undefined,
                    butterflyDisk: butterflyDiskInstance || undefined,
                    checkCap: checkCapInstance || undefined,
                    checkArrow: checkArrowInstance || undefined,
                    controlActuator: controlActuatorInstance || undefined,
                }
            };
            valveBodyInstance.metadata = metadata; // Associar metadados à instância principal
            this._valveInstances.set(valveData.id, metadata);
            valveBodyInstance.isPickable = true; // Tornar pickable
            console.log(`Criando nova válvula: ${valveData.id}`);
        }
        // Configurar posição e rotação
        if (valveData.position) {
            valveBodyInstance.position = valveData.position instanceof Vector3 ? valveData.position : new Vector3(valveData.position.x, valveData.position.y, valveData.position.z);
        }
        else {
            valveBodyInstance.position = Vector3.Zero();
            console.warn(`Válvula ${valveData.id} sem posição definida.`);
        }
        if (valveData.rotation) {
            valveBodyInstance.rotationQuaternion = Quaternion.FromEulerAngles(valveData.rotation.x || 0, valveData.rotation.y || 0, valveData.rotation.z || 0);
        }
        else {
            valveBodyInstance.rotationQuaternion = Quaternion.Identity();
        }
        // Configurar escala do corpo
        valveBodyInstance.scaling.set(typeConfig.size.width, typeConfig.size.height, typeConfig.size.depth);
        // Configurar material do corpo
        valveBodyInstance.material = this._instanceMaterials[valveType] || this._instanceMaterials.gate; // Fallback
        // Configurar posição e rotação do volante/alavanca
        // Ajustar posição para ficar em cima do corpo
        wheelOrLeverInstance.position.y = typeConfig.size.height / 2 + (wheelLeverSourceMeshKey === "lever" ? 0.025 : 0); // Ajuste fino para alavanca
        // Rotação inicial (eixo X para volante, eixo Y para alavanca?)
        if (wheelLeverSourceMeshKey === "wheel") {
            wheelOrLeverInstance.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
        }
        else {
            wheelOrLeverInstance.rotationQuaternion = Quaternion.Identity();
        }
        // Configurar posições de componentes específicos
        if (ballSphereInstance) {
            ballSphereInstance.scaling.set(0.8, 0.8, 0.8); // Esfera um pouco menor que o corpo
        }
        if (butterflyDiskInstance) {
            butterflyDiskInstance.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0); // Disco na vertical inicialmente
        }
        if (checkCapInstance) {
            checkCapInstance.position.y = typeConfig.size.height / 2; // Tampa em cima
            checkCapInstance.scaling.x = typeConfig.size.width * 0.8; // Ajustar tamanho da tampa
            checkCapInstance.scaling.z = typeConfig.size.depth * 0.8;
        }
        if (checkArrowInstance) {
            checkArrowInstance.position.y = typeConfig.size.height / 2 + 0.15; // Seta em cima da tampa
            checkArrowInstance.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
        }
        if (controlActuatorInstance) {
            controlActuatorInstance.position.y = typeConfig.size.height / 2 + 0.3; // Atuador em cima
        }
        // Aplicar estado visual
        this.setValveStateVisual(valveData.id, valveData.state);
        return valveBodyInstance;
    }
    /**
     * Atualiza o estado visual de uma válvula.
     * @param valveId - ID da válvula.
     * @param state - Novo estado.
     */
    setValveStateVisual(valveId, state) {
        const metadata = this._valveInstances.get(valveId);
        if (!metadata) {
            console.warn(`Válvula com ID ${valveId} não encontrada para atualização visual.`);
            return;
        }
        const stateConfig = this._valveConfig.states[state];
        if (!stateConfig) {
            console.warn(`Configuração de estado desconhecida: ${state}`);
            return;
        }
        // Atualizar metadados
        metadata.state = state;
        metadata.data.state = state; // Atualizar dados no DB também?
        // Atualizar rotação do volante/alavanca
        const wheelLever = metadata.components.wheelOrLever;
        const originalRotation = wheelLever.rotationQuaternion ? wheelLever.rotationQuaternion.toEulerAngles() : Vector3.Zero();
        if (metadata.valveType === "ball" || metadata.valveType === "butterfly") {
            // Rotação da alavanca (eixo Y)
            wheelLever.rotationQuaternion = Quaternion.FromEulerAngles(originalRotation.x, stateConfig.wheelRotation, originalRotation.z);
        }
        else {
            // Rotação do volante (eixo Z local? ou Y global?)
            // Assumindo rotação em torno do eixo Y global para simplicidade
            wheelLever.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, stateConfig.wheelRotation, 0);
        }
        // Atualizar rotação de componentes internos
        if (metadata.components.ballSphere && stateConfig.sphereRotation !== undefined) {
            metadata.components.ballSphere.rotationQuaternion = Quaternion.FromEulerAngles(0, stateConfig.sphereRotation, 0);
        }
        if (metadata.components.butterflyDisk && stateConfig.diskRotation !== undefined) {
            // Rotação do disco em torno do eixo Z local (após rotação inicial)
            const initialDiskRotation = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
            const stateRotation = Quaternion.FromEulerAngles(0, 0, stateConfig.diskRotation);
            metadata.components.butterflyDisk.rotationQuaternion = initialDiskRotation.multiply(stateRotation);
        }
        // Atualizar cor do indicador de estado
        if (metadata.components.stateIndicator) {
            const indicatorMaterial = this._instanceMaterials[`state_${state}`];
            if (indicatorMaterial) {
                // Clonar material para a instância específica
                const instanceMat = indicatorMaterial.clone(`${metadata.components.stateIndicator.name}_mat`);
                metadata.components.stateIndicator.material = instanceMat;
            }
            else {
                metadata.components.stateIndicator.material = this._instanceMaterials.state_closed; // Fallback
            }
        }
    }
    /**
     * Remove uma válvula da cena.
     * @param valveId - ID da válvula a ser removida.
     */
    removeValve(valveId) {
        const metadata = this._valveInstances.get(valveId);
        if (metadata) {
            // Dispose de todos os componentes
            Object.values(metadata.components).forEach(instance => {
                if (instance) {
                    // Dispose do material clonado se houver
                    if (instance.material && instance.material !== this._instanceMaterials[metadata.valveType] && !Object.values(this._instanceMaterials).includes(instance.material)) {
                        instance.material.dispose();
                    }
                    instance.dispose();
                }
            });
            this._valveInstances.delete(valveId);
            console.log(`Válvula ${valveId} removida da cena.`);
        }
        else {
            console.warn(`Tentativa de remover válvula inexistente: ${valveId}`);
        }
    }
    /**
     * Obtém os metadados de uma válvula pelo ID.
     * @param valveId - ID da válvula.
     * @returns Os metadados ou undefined.
     */
    getValveMetadata(valveId) {
        return this._valveInstances.get(valveId);
    }
    /**
     * Obtém a instância principal (corpo) de uma válvula pelo ID.
     * @param valveId - ID da válvula.
     * @returns A instância do corpo ou null.
     */
    getValveInstance(valveId) {
        var _a;
        return ((_a = this._valveInstances.get(valveId)) === null || _a === void 0 ? void 0 : _a.components.body) || null;
    }
}
// Exportar a instância Singleton para fácil acesso
export const valvesManager = ValvesManager.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.ValvesManager = valvesManager;
//# sourceMappingURL=valves.js.map
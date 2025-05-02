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
exports.TanksManager = void 0;
const core_1 = require("@babylonjs/core");
const inMemoryDb_1 = require("../database/inMemoryDb"); // Importar o DB e a interface de dados
/**
 * TanksManager - Gerenciador de tanques
 *
 * Responsável por criar, modificar e gerenciar os tanques
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
class TanksManager {
    /**
     * Obtém a instância única do TanksManager (Singleton)
     */
    static getInstance() {
        if (!TanksManager._instance) {
            TanksManager._instance = new TanksManager();
        }
        return TanksManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._tanksGroup = null;
        this._tankMeshes = new Map(); // Usar Map para acesso rápido por ID
        // Meshes fonte para instancing
        this._sourceMeshes = {};
        this._instanceMaterials = {};
        // Configurações para os tanques (mantida para geometria)
        this._tankConfig = {
            defaultMaterial: {
                color: new core_1.Color3(0, 0.47, 0.75), // Azul petróleo
                metallic: 0.3,
                roughness: 0.4
            },
            types: {
                standard: {
                    height: 8,
                    diameter: 5,
                    segments: 24,
                    lodSegments: 12
                },
                large: {
                    height: 12,
                    diameter: 8,
                    segments: 32,
                    lodSegments: 16
                },
                small: {
                    height: 5,
                    diameter: 3,
                    segments: 20,
                    lodSegments: 10
                },
                spherical: {
                    diameter: 6,
                    segments: 32,
                    lodSegments: 16
                }
            },
            lodDistance: 50 // Distância em unidades da cena para ativar LOD
        };
    }
    /**
     * Inicializa o gerenciador de tanques e cria meshes fonte
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._tanksGroup = SceneManager.getGroup("tanks");
            console.log("Grupo de tanques obtido:", this._tanksGroup);
            if (!this._tanksGroup) {
                console.error("Grupo de tanques não encontrado na cena");
                throw new Error("Grupo de tanques não encontrado");
            }
            // Garantir que o grupo de tanques tenha transformação adequada
            this._tanksGroup.position = core_1.Vector3.Zero();
            this._tanksGroup.scaling = core_1.Vector3.One();
            this._tanksGroup.rotation = core_1.Vector3.Zero();
            this._tanksGroup.rotationQuaternion = null;
            // Criar materiais para instâncias
            this._instanceMaterials.stairs = this._createMaterial("stairsMatInstance", new core_1.Color3(0.2, 0.2, 0.2));
            this._instanceMaterials.sphericalSupport = this._createMaterial("sphericalSupportMatInstance", new core_1.Color3(0.3, 0.3, 0.3));
            this._instanceMaterials.platform = this._createMaterial("platformMatInstance", new core_1.Color3(0.3, 0.3, 0.3));
            this._instanceMaterials.connection = this._createMaterial("connectionMatInstance", new core_1.Color3(0.4, 0.4, 0.4));
            this._instanceMaterials.valve = this._createMaterial("valveMatInstance", new core_1.Color3(0.7, 0.1, 0.1));
            // Criar meshes fonte para instancing
            this._createSourceMeshes();
        });
    }
    /**
     * Cria os meshes que serão usados como fonte para instâncias
     */
    _createSourceMeshes() {
        const scene = SceneManager.scene;
        // Fonte para montante da escada
        this._sourceMeshes.stairRail = core_1.MeshBuilder.CreateCylinder("stairRailSource", { height: 1, diameter: 0.1 }, scene);
        this._sourceMeshes.stairRail.material = this._instanceMaterials.stairs;
        this._sourceMeshes.stairRail.setEnabled(false); // Desabilitar mesh fonte
        // Fonte para degrau da escada
        this._sourceMeshes.stairStep = core_1.MeshBuilder.CreateBox("stairStepSource", { width: 0.8, height: 0.05, depth: 0.2 }, scene);
        this._sourceMeshes.stairStep.material = this._instanceMaterials.stairs;
        this._sourceMeshes.stairStep.setEnabled(false);
        // Fonte para suporte esférico
        this._sourceMeshes.sphericalSupport = core_1.MeshBuilder.CreateCylinder("sphericalSupportSource", { height: 1, diameter: 0.1, tessellation: 8 }, scene);
        this._sourceMeshes.sphericalSupport.material = this._instanceMaterials.sphericalSupport;
        this._sourceMeshes.sphericalSupport.setEnabled(false);
        // Fonte para plataforma (torus)
        this._sourceMeshes.platformTorus = core_1.MeshBuilder.CreateTorus("platformTorusSource", { diameter: 1, thickness: 0.3, tessellation: 24 }, scene);
        this._sourceMeshes.platformTorus.material = this._instanceMaterials.platform;
        this._sourceMeshes.platformTorus.setEnabled(false);
        // Fonte para conexão inferior
        this._sourceMeshes.bottomConnection = core_1.MeshBuilder.CreateCylinder("bottomConnSource", { height: 0.5, diameter: 0.4 }, scene);
        this._sourceMeshes.bottomConnection.material = this._instanceMaterials.connection;
        this._sourceMeshes.bottomConnection.setEnabled(false);
        // Fonte para válvula (simplificada)
        this._sourceMeshes.valveBox = core_1.MeshBuilder.CreateBox("valveBoxSource", { width: 0.6, height: 0.6, depth: 0.3 }, scene);
        this._sourceMeshes.valveBox.material = this._instanceMaterials.valve;
        this._sourceMeshes.valveBox.setEnabled(false);
    }
    /**
     * Cria os tanques na cena buscando dados do InMemoryDatabase.
     */
    createTanks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                console.log("TanksManager inicializado. Buscando dados de tanques...");
                // Buscar dados dos tanques do banco de dados em memória
                const tankDataList = inMemoryDb_1.db.getEquipmentByType("tank");
                if (tankDataList.length === 0) {
                    console.warn("Nenhum dado de tanque encontrado no InMemoryDatabase.");
                    return;
                }
                // Criar tanques a partir dos dados do DB
                tankDataList.forEach(tankData => this.createTankFromData(tankData));
                console.log(`Total de tanques criados: ${this._tankMeshes.size}`);
            }
            catch (error) {
                console.error("Erro ao criar tanques:", error);
                throw error;
            }
        });
    }
    /**
     * Cria um tanque a partir de dados do InMemoryDatabase.
     * @param tankData - Dados do tanque (DbTankData).
     */
    createTankFromData(tankData) {
        // Usar equipmentType para configuração geométrica
        const equipmentType = tankData.equipmentType || "standard";
        const typeConfig = this._tankConfig.types[equipmentType] || this._tankConfig.types.standard;
        let position;
        if (tankData.position instanceof core_1.Vector3) {
            position = tankData.position;
        }
        else if (tankData.position) {
            position = new core_1.Vector3(tankData.position.x || 0, tankData.position.y || 0, tankData.position.z || 0);
        }
        else {
            position = core_1.Vector3.Zero();
        }
        let tankNode;
        if (equipmentType === "spherical") {
            tankNode = this._createSphericalTank(tankData.id, typeConfig, position);
        }
        else {
            tankNode = this._createCylindricalTank(tankData.id, typeConfig, position);
        }
        tankNode.rotationQuaternion = null;
        // Armazenar metadados com referência aos dados completos do DB
        tankNode.metadata = {
            id: tankData.id,
            type: "tank",
            equipmentType: equipmentType,
            data: tankData // Referência direta aos dados do DB
        };
        this._tankMeshes.set(tankData.id, tankNode);
        return tankNode;
    }
    // createDemoTanks removido, pois os dados vêm do DB
    /**
     * Cria um tanque cilíndrico com LOD
     */
    _createCylindricalTank(id, config, position) {
        const scene = SceneManager.scene;
        const tankNode = new core_1.TransformNode(id, scene);
        tankNode.position = position || core_1.Vector3.Zero();
        tankNode.parent = this._tanksGroup;
        // console.log(`Tanque ${id} - Posição:`, tankNode.position);
        // --- Corpo do Tanque com LOD ---
        const body = core_1.MeshBuilder.CreateCylinder(`${id}_body`, { height: config.height, diameter: config.diameter, tessellation: config.segments }, scene);
        body.parent = tankNode;
        body.position.y = config.height / 2;
        const bodyLOD = core_1.MeshBuilder.CreateCylinder(`${id}_body_lod`, { height: config.height, diameter: config.diameter, tessellation: config.lodSegments }, scene);
        bodyLOD.setEnabled(false);
        body.addLODLevel(this._tankConfig.lodDistance, bodyLOD);
        // console.log(`Tanque ${id} - Corpo criado:`, body, `Dimensões: altura=${config.height}, diâmetro=${config.diameter}`);
        // --- Teto do Tanque com LOD ---
        const roofHeight = config.diameter * 0.15;
        const roof = core_1.MeshBuilder.CreateCylinder(`${id}_roof`, { height: roofHeight, diameterTop: 0, diameterBottom: config.diameter, tessellation: config.segments }, scene);
        roof.parent = tankNode;
        roof.position.y = config.height + (roofHeight / 2);
        const roofLOD = core_1.MeshBuilder.CreateCylinder(`${id}_roof_lod`, { height: roofHeight, diameterTop: 0, diameterBottom: config.diameter, tessellation: config.lodSegments }, scene);
        roofLOD.setEnabled(false);
        roof.addLODLevel(this._tankConfig.lodDistance, roofLOD);
        // --- Plataforma (Instanciada) ---
        if (config.height > 6 && this._sourceMeshes.platformTorus) {
            const platformInstance = this._sourceMeshes.platformTorus.createInstance(`${id}_platform`);
            platformInstance.parent = tankNode;
            platformInstance.scaling.x = config.diameter * 0.9;
            platformInstance.scaling.z = config.diameter * 0.9;
            platformInstance.position.y = config.height - 0.1;
        }
        // --- Escada (Instanciada) ---
        if (config.height > 5) {
            this._addTankStairsInstanced(tankNode, id, config);
        }
        // --- Conexões (Instanciadas) ---
        this._addTankConnectionsInstanced(tankNode, id, config);
        // --- Material e Seleção ---
        const tankMaterial = this._createPBRMaterial(`${id}_material`);
        body.material = tankMaterial;
        roof.material = tankMaterial;
        bodyLOD.material = tankMaterial; // Aplicar material ao LOD também
        roofLOD.material = tankMaterial;
        body.isPickable = true;
        return tankNode;
    }
    /**
     * Cria um tanque esférico com LOD e suportes instanciados
     */
    _createSphericalTank(id, config, position) {
        const scene = SceneManager.scene;
        const tankNode = new core_1.TransformNode(id, scene);
        tankNode.position = position || core_1.Vector3.Zero();
        tankNode.parent = this._tanksGroup;
        // --- Corpo do Tanque (Esfera) com LOD ---
        const body = core_1.MeshBuilder.CreateSphere(`${id}_body`, { diameter: config.diameter, segments: config.segments }, scene);
        body.parent = tankNode;
        body.position.y = config.diameter / 2;
        const bodyLOD = core_1.MeshBuilder.CreateSphere(`${id}_body_lod`, { diameter: config.diameter, segments: config.lodSegments }, scene);
        bodyLOD.setEnabled(false);
        body.addLODLevel(this._tankConfig.lodDistance, bodyLOD);
        // --- Suportes (Instanciados) ---
        if (this._sourceMeshes.sphericalSupport) {
            const supportHeight = config.diameter * 0.3;
            for (let i = 0; i < 4; i++) {
                const supportInstance = this._sourceMeshes.sphericalSupport.createInstance(`${id}_support_${i}`);
                supportInstance.parent = tankNode;
                const angle = (Math.PI / 2) * i;
                supportInstance.position.x = Math.cos(angle) * (config.diameter * 0.4);
                supportInstance.position.z = Math.sin(angle) * (config.diameter * 0.4);
                supportInstance.position.y = supportHeight / 2;
                supportInstance.scaling.y = supportHeight;
                supportInstance.scaling.x = config.diameter * 0.1;
                supportInstance.scaling.z = config.diameter * 0.1;
            }
        }
        // --- Conexões (Simplificado, pode ser instanciado se houver mais) ---
        const connection = core_1.MeshBuilder.CreateCylinder(`${id}_connection`, { height: config.diameter * 0.4, diameter: config.diameter * 0.15, tessellation: 12 }, scene);
        connection.parent = tankNode;
        connection.position.x = config.diameter * 0.7;
        connection.position.y = config.diameter / 2;
        connection.rotation.z = Math.PI / 2;
        connection.material = this._createMaterial(`${id}_connectionMat`, new core_1.Color3(0.4, 0.4, 0.4));
        // --- Material e Seleção ---
        const tankMaterial = this._createPBRMaterial(`${id}_material`);
        body.material = tankMaterial;
        bodyLOD.material = tankMaterial;
        body.isPickable = true;
        return tankNode;
    }
    /**
     * Adiciona escadas instanciadas ao tanque
     */
    _addTankStairsInstanced(tankNode, id, config) {
        if (!this._sourceMeshes.stairRail || !this._sourceMeshes.stairStep)
            return;
        const stairsNode = new core_1.TransformNode(`${id}_stairs`, SceneManager.scene);
        stairsNode.parent = tankNode;
        stairsNode.position = new core_1.Vector3(0, 0, config.diameter / 2);
        const stairHeight = config.height;
        const stairWidth = 0.8;
        // Montantes (Instanciados)
        const rail1Instance = this._sourceMeshes.stairRail.createInstance(`${id}_rail1`);
        rail1Instance.parent = stairsNode;
        rail1Instance.position.x = stairWidth / 2;
        rail1Instance.position.y = stairHeight / 2;
        rail1Instance.scaling.y = stairHeight;
        const rail2Instance = this._sourceMeshes.stairRail.createInstance(`${id}_rail2`);
        rail2Instance.parent = stairsNode;
        rail2Instance.position.x = -stairWidth / 2;
        rail2Instance.position.y = stairHeight / 2;
        rail2Instance.scaling.y = stairHeight;
        // Degraus (Instanciados)
        const stepCount = Math.floor(stairHeight / 0.4);
        for (let i = 0; i < stepCount; i++) {
            const stepInstance = this._sourceMeshes.stairStep.createInstance(`${id}_step_${i}`);
            stepInstance.parent = stairsNode;
            stepInstance.position.y = (i + 0.5) * (stairHeight / stepCount);
        }
    }
    /**
     * Adiciona conexões de tubulação instanciadas ao tanque
     */
    _addTankConnectionsInstanced(tankNode, id, config) {
        if (!this._sourceMeshes.bottomConnection || !this._sourceMeshes.valveBox)
            return;
        // Conexão inferior (Instanciada)
        const bottomConnInstance = this._sourceMeshes.bottomConnection.createInstance(`${id}_bottomConn`);
        bottomConnInstance.parent = tankNode;
        bottomConnInstance.position.z = config.diameter / 2;
        bottomConnInstance.position.y = 0.25;
        bottomConnInstance.rotation.x = Math.PI / 2;
        // Válvula na conexão (Instanciada)
        const valveInstance = this._sourceMeshes.valveBox.createInstance(`${id}_valve`);
        valveInstance.parent = tankNode;
        valveInstance.position.z = config.diameter / 2 + 0.6;
        valveInstance.position.y = 0.25;
    }
    /**
     * Cria um material PBR para o tanque
     */
    _createPBRMaterial(name) {
        const scene = SceneManager.scene;
        const material = new core_1.PBRMaterial(name, scene);
        material.albedoColor = this._tankConfig.defaultMaterial.color;
        material.metallic = this._tankConfig.defaultMaterial.metallic;
        material.roughness = this._tankConfig.defaultMaterial.roughness;
        material.useAmbientOcclusionFromMetallicTextureRed = true;
        material.useRoughnessFromMetallicTextureGreen = true;
        material.useMetallnessFromMetallicTextureBlue = true;
        return material;
    }
    /**
     * Cria um material standard simples
     */
    _createMaterial(name, color) {
        const scene = SceneManager.scene;
        const material = new core_1.StandardMaterial(name, scene);
        material.diffuseColor = color;
        return material;
    }
    /**
     * Obtém todos os meshes de tanques
     */
    getTankMeshes() {
        return Array.from(this._tankMeshes.values());
    }
    /**
     * Obtém um tanque específico por ID
     */
    getTankById(id) {
        return this._tankMeshes.get(id) || null;
    }
    /**
     * Atualiza o nível de produto em um tanque (no DB e visualmente se necessário)
     */
    updateTankLevel(id, level) {
        const tankNode = this.getTankById(id);
        if (!tankNode)
            return false;
        const metadata = tankNode.metadata;
        if (!metadata || !metadata.data)
            return false;
        // Atualizar no DB
        const tankData = metadata.data;
        tankData.level = Math.max(0, Math.min(1, level));
        inMemoryDb_1.db.upsertEquipment(tankData); // Atualiza o registro no DB
        // TODO: Implementar visualização do nível (pode ser adicionado posteriormente)
        console.log(`Nível do tanque ${id} atualizado para ${level} no DB.`);
        return true;
    }
    /**
     * Atualiza o status de um tanque (no DB e visualmente se necessário)
     */
    updateTankStatus(id, status) {
        const tankNode = this.getTankById(id);
        if (!tankNode)
            return false;
        const metadata = tankNode.metadata;
        if (!metadata || !metadata.data)
            return false;
        // Atualizar no DB
        const tankData = metadata.data;
        tankData.status = status;
        inMemoryDb_1.db.upsertEquipment(tankData); // Atualiza o registro no DB
        // TODO: Implementar mudança visual baseada no status (ex: cor)
        console.log(`Status do tanque ${id} atualizado para ${status} no DB.`);
        return true;
    }
    /**
     * Limpa todos os tanques da cena e meshes fonte
     */
    clearTanks() {
        this._tankMeshes.forEach(tank => tank.dispose(false, true)); // Dispose nós e filhos
        this._tankMeshes.clear();
        // Limpar meshes fonte (opcional, mas bom para recarregar)
        Object.values(this._sourceMeshes).forEach(mesh => mesh.dispose());
        this._sourceMeshes = {};
        Object.values(this._instanceMaterials).forEach(mat => mat.dispose());
        this._instanceMaterials = {};
        console.log("Tanques e meshes fonte limpos.");
    }
}
exports.TanksManager = TanksManager;
// Criar instância global para compatibilidade (se necessário)
// (window as any).TanksManager = TanksManager.getInstance();
//# sourceMappingURL=tanks.js.map
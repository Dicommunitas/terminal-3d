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
exports.LoadingAreasManager = void 0;
const core_1 = require("@babylonjs/core");
/**
 * LoadingAreasManager - Gerenciador de áreas de carregamento
 *
 * Responsável por criar, modificar e gerenciar as áreas de carregamento
 * na cena 3D do terminal.
 */
class LoadingAreasManager {
    /**
     * Obtém a instância única do LoadingAreasManager (Singleton)
     */
    static getInstance() {
        if (!LoadingAreasManager._instance) {
            LoadingAreasManager._instance = new LoadingAreasManager();
        }
        return LoadingAreasManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._loadingAreasGroup = null;
        this._loadingAreaMeshes = [];
        // Configurações para as áreas de carregamento
        this._loadingAreaConfig = {
            types: {
                truckBay: {
                    name: 'Baia de Caminhões',
                    color: new core_1.Color3(0.7, 0.5, 0.2),
                    size: { width: 5, height: 0.2, depth: 12 }
                },
                railLoading: {
                    name: 'Carregamento Ferroviário',
                    color: new core_1.Color3(0.5, 0.5, 0.6),
                    size: { width: 3, height: 0.2, depth: 15 }
                },
                marinePier: {
                    name: 'Píer Marítimo',
                    color: new core_1.Color3(0.3, 0.5, 0.7),
                    size: { width: 8, height: 0.5, depth: 20 }
                },
                bargeDock: {
                    name: 'Doca de Barcaças',
                    color: new core_1.Color3(0.4, 0.6, 0.7),
                    size: { width: 6, height: 0.3, depth: 15 }
                }
            },
            states: {
                available: {
                    name: 'Disponível',
                    color: new core_1.Color3(0.1, 0.7, 0.1)
                },
                loading: {
                    name: 'Em Carregamento',
                    color: new core_1.Color3(0.7, 0.7, 0.1)
                },
                maintenance: {
                    name: 'Em Manutenção',
                    color: new core_1.Color3(0.3, 0.3, 0.7)
                },
                unavailable: {
                    name: 'Indisponível',
                    color: new core_1.Color3(0.7, 0.1, 0.1)
                }
            }
        };
    }
    /**
     * Inicializa o gerenciador de áreas de carregamento
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._loadingAreasGroup = SceneManager.getGroup('loadingAreas');
            if (!this._loadingAreasGroup) {
                console.error("Grupo de áreas de carregamento não encontrado na cena");
                throw new Error("Grupo de áreas de carregamento não encontrado");
            }
        });
    }
    /**
     * Cria as áreas de carregamento na cena
     */
    createLoadingAreas() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                // Criar áreas de carregamento a partir dos dados (simulados ou reais)
                if (typeof EquipmentData !== 'undefined' && EquipmentData.loadingAreas) {
                    // Usar dados do arquivo equipment.js
                    EquipmentData.loadingAreas.forEach(areaData => this.createLoadingAreaFromData(areaData));
                }
                else {
                    // Criar áreas de carregamento de demonstração se não houver dados
                    this.createDemoLoadingAreas();
                }
            }
            catch (error) {
                console.error("Erro ao criar áreas de carregamento:", error);
                throw error;
            }
        });
    }
    /**
     * Cria uma área de carregamento a partir de dados
     * @param areaData - Dados da área de carregamento
     */
    createLoadingAreaFromData(areaData) {
        // Determinar o tipo de área
        const areaType = areaData.type || 'truckBay';
        const typeConfig = this._loadingAreaConfig.types[areaType] || this._loadingAreaConfig.types.truckBay;
        // Determinar estado inicial
        const state = areaData.state || 'available';
        const stateConfig = this._loadingAreaConfig.states[state] || this._loadingAreaConfig.states.available;
        // Criar o nó principal para esta área
        const areaNode = new core_1.TransformNode(areaData.id, SceneManager.scene);
        areaNode.parent = this._loadingAreasGroup;
        // Posicionar a área
        const position = areaData.position instanceof core_1.Vector3
            ? areaData.position
            : new core_1.Vector3(areaData.position.x, areaData.position.y, areaData.position.z);
        areaNode.position = position;
        // Aplicar rotação se especificada
        if (areaData.rotation) {
            areaNode.rotation = new core_1.Vector3(areaData.rotation.x || 0, areaData.rotation.y || 0, areaData.rotation.z || 0);
        }
        // Criar a plataforma base
        const platform = this._createPlatform(areaData.id, areaType, typeConfig);
        platform.parent = areaNode;
        // Adicionar elementos específicos por tipo
        let specificElements;
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
                specificElements = new core_1.TransformNode(`${areaData.id}_elements`, SceneManager.scene);
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
        areaNode.metadata = {
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
        };
        // Adicionar à lista de áreas de carregamento
        this._loadingAreaMeshes.push(areaNode);
        return areaNode;
    }
    /**
     * Cria áreas de carregamento de demonstração quando não há dados disponíveis
     */
    createDemoLoadingAreas() {
        console.log("Criando áreas de carregamento de demonstração");
        // Baias de caminhões
        const truckBays = [
            {
                id: 'TRUCK-BAY-01',
                type: 'truckBay',
                position: new core_1.Vector3(-20, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'available',
                loadingArms: 2
            },
            {
                id: 'TRUCK-BAY-02',
                type: 'truckBay',
                position: new core_1.Vector3(-10, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'loading',
                loadingArms: 2
            },
            {
                id: 'TRUCK-BAY-03',
                type: 'truckBay',
                position: new core_1.Vector3(0, 0, 15),
                rotation: { y: Math.PI / 4 },
                state: 'maintenance',
                loadingArms: 2
            }
        ];
        // Carregamento ferroviário
        const railLoading = [
            {
                id: 'RAIL-LOAD-01',
                type: 'railLoading',
                position: new core_1.Vector3(20, 0, -15),
                rotation: { y: Math.PI / 2 },
                state: 'available',
                loadingArms: 3
            }
        ];
        // Píer marítimo
        const marinePier = [
            {
                id: 'MARINE-PIER-01',
                type: 'marinePier',
                position: new core_1.Vector3(-25, 0, -20),
                state: 'loading',
                loadingArms: 4
            }
        ];
        // Doca de barcaças
        const bargeDock = [
            {
                id: 'BARGE-DOCK-01',
                type: 'bargeDock',
                position: new core_1.Vector3(25, 0, -20),
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
    _createPlatform(id, type, config) {
        const scene = SceneManager.scene;
        // Criar plataforma base
        const platform = core_1.MeshBuilder.CreateBox(`${id}_platform`, {
            width: config.size.width,
            height: config.size.height,
            depth: config.size.depth
        }, scene);
        // Posicionar a plataforma com o topo no nível do solo
        platform.position.y = config.size.height / 2;
        // Material para a plataforma
        const platformMaterial = new core_1.PBRMaterial(`${id}_platformMat`, scene);
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
    _createTruckBayElements(id, config) {
        const scene = SceneManager.scene;
        const elements = new core_1.TransformNode(`${id}_elements`, scene);
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        // Material para os elementos
        const elementsMaterial = new core_1.StandardMaterial(`${id}_elementsMat`, scene);
        elementsMaterial.diffuseColor = new core_1.Color3(0.3, 0.3, 0.3);
        // Guias laterais
        const leftGuide = core_1.MeshBuilder.CreateBox(`${id}_leftGuide`, { width: 0.3, height: 1, depth: depth }, scene);
        leftGuide.parent = elements;
        leftGuide.position.x = width / 2 - 0.15;
        leftGuide.position.y = 0.5;
        leftGuide.material = elementsMaterial;
        const rightGuide = core_1.MeshBuilder.CreateBox(`${id}_rightGuide`, { width: 0.3, height: 1, depth: depth }, scene);
        rightGuide.parent = elements;
        rightGuide.position.x = -width / 2 + 0.15;
        rightGuide.position.y = 0.5;
        rightGuide.material = elementsMaterial;
        // Balizadores
        for (let i = 0; i < 4; i++) {
            const position = (i % 2 === 0) ? width / 2 : -width / 2;
            const zPos = (i < 2) ? depth / 3 : -depth / 3;
            const bollard = core_1.MeshBuilder.CreateCylinder(`${id}_bollard_${i}`, { height: 1.2, diameter: 0.4, tessellation: 12 }, scene);
            bollard.parent = elements;
            bollard.position.x = position;
            bollard.position.z = zPos;
            bollard.position.y = 0.6;
            // Material zebrado para os balizadores
            const bollardMaterial = new core_1.StandardMaterial(`${id}_bollardMat_${i}`, scene);
            bollardMaterial.diffuseColor = (i % 2 === 0) ? new core_1.Color3(0.9, 0.1, 0.1) : new core_1.Color3(0.9, 0.9, 0.1);
            bollard.material = bollardMaterial;
        }
        // Área de contenção de derramamentos (borda elevada)
        // Criação de borda em vez de caixa completa para melhor visualização
        const createBorder = (name, w, h, d, thickness) => {
            const border = new core_1.TransformNode(name, scene);
            const front = core_1.MeshBuilder.CreateBox(`${name}_front`, { width: w, height: h, depth: thickness }, scene);
            front.position.z = d / 2 - thickness / 2;
            front.parent = border;
            const back = core_1.MeshBuilder.CreateBox(`${name}_back`, { width: w, height: h, depth: thickness }, scene);
            back.position.z = -d / 2 + thickness / 2;
            back.parent = border;
            const left = core_1.MeshBuilder.CreateBox(`${name}_left`, { width: thickness, height: h, depth: d - 2 * thickness }, scene);
            left.position.x = -w / 2 + thickness / 2;
            left.parent = border;
            const right = core_1.MeshBuilder.CreateBox(`${name}_right`, { width: thickness, height: h, depth: d - 2 * thickness }, scene);
            right.position.x = w / 2 - thickness / 2;
            right.parent = border;
            return border;
        };
        const containment = createBorder(`${id}_containment`, width, 0.1, depth, 0.1);
        containment.parent = elements;
        containment.position.y = config.size.height + 0.05; // Acima da plataforma
        const containmentMaterial = new core_1.StandardMaterial(`${id}_containmentMat`, scene);
        containmentMaterial.diffuseColor = new core_1.Color3(0.6, 0.6, 0.6);
        containment.getChildMeshes().forEach(m => m.material = containmentMaterial);
        return elements;
    }
    /**
     * Cria elementos específicos para carregamento ferroviário
     * @param id - ID da área
     * @param config - Configuração do tipo de área
     * @returns Nó com os elementos específicos
     */
    _createRailLoadingElements(id, config) {
        const scene = SceneManager.scene;
        const elements = new core_1.TransformNode(`${id}_elements`, scene);
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        // Material para os elementos
        const railMaterial = new core_1.StandardMaterial(`${id}_railMat`, scene);
        railMaterial.diffuseColor = new core_1.Color3(0.5, 0.5, 0.5);
        railMaterial.specularColor = new core_1.Color3(0.7, 0.7, 0.7);
        const tieMaterial = new core_1.StandardMaterial(`${id}_tieMat`, scene);
        tieMaterial.diffuseColor = new core_1.Color3(0.4, 0.3, 0.2); // Marrom escuro
        // Trilhos
        const railSpacing = 1.5; // Distância entre trilhos
        for (let i = 0; i < 2; i++) {
            const railPos = (i === 0) ? -railSpacing / 2 : railSpacing / 2;
            // Trilho (barra longa)
            const rail = core_1.MeshBuilder.CreateBox(`${id}_rail_${i}`, { width: 0.2, height: 0.1, depth: depth * 1.2 }, scene); // Extender um pouco
            rail.parent = elements;
            rail.position.x = railPos;
            rail.position.y = config.size.height + 0.05; // Acima da plataforma
            rail.material = railMaterial;
            // Dormentes (travessas)
            for (let j = 0; j < 15; j++) {
                const tiePos = (j - 7) * (depth / 14); // Ajustar espaçamento
                const tie = core_1.MeshBuilder.CreateBox(`${id}_tie_${j}`, { width: railSpacing + 0.4, height: 0.08, depth: 0.3 }, scene);
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
    _createMarinePierElements(id, config) {
        const scene = SceneManager.scene;
        const elements = new core_1.TransformNode(`${id}_elements`, scene);
        // Dimensões da plataforma
        const width = config.size.width;
        const depth = config.size.depth;
        // Material para os elementos
        const bollardMaterial = new core_1.StandardMaterial(`${id}_bollardMat`, scene);
        bollardMaterial.diffuseColor = new core_1.Color3(0.2, 0.2, 0.2);
        // Balizadores (bollards) para amarração
        for (let i = 0; i < 6; i++) {
            const position = (i % 2 === 0) ? width / 2 - 0.5 : -width / 2 + 0.5;
            const zPos = (i / 2 - 1) * (depth / 3);
            const bollard = core_1.MeshBuilder.CreateCylinder(`${id}_bollard_${i}`, { height: 1.5, diameter: 0.6, tessellation: 12 }, scene);
            bollard.parent = elements;
            bollard.position.x = position;
            bollard.position.z = zPos;
            bollard.position.y = config.size.height + 0.75; // Metade da altura acima da plataforma
            bollard.material = bollardMaterial;
        }
        // Defensas (fenders)
        const fenderMaterial = new core_1.StandardMaterial(`${id}_fenderMat`, scene);
        fenderMaterial.diffuseColor = new core_1.Color3(0.1, 0.1, 0.1);
        for (let i = 0; i < 4; i++) {
            const zPos = (i - 1.5) * (depth / 4);
            const fender = core_1.MeshBuilder.CreateBox(`${id}_fender_${i}`, { width: 0.5, height: 2.0, depth: 0.5 }, scene);
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
    _createBargeDockElements(id, config) {
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
    _createStateIndicator(id, state, config) {
        const scene = SceneManager.scene;
        const indicator = core_1.MeshBuilder.CreateSphere(`${id}_stateIndicator`, { diameter: 0.4, segments: 12 }, scene);
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
    _createLoadingArms(id, type, count) {
        const scene = SceneManager.scene;
        const armsNode = new core_1.TransformNode(`${id}_loadingArms`, scene);
        const armMaterial = this._createMaterial(`${id}_armMat`, new core_1.Color3(0.6, 0.6, 0.6));
        const armLength = 5;
        const armDiameter = 0.2;
        for (let i = 0; i < count; i++) {
            const armGroup = new core_1.TransformNode(`${id}_arm_${i}`, scene);
            armGroup.parent = armsNode;
            // Posição inicial do braço (distribuído)
            const spacing = 3;
            armGroup.position.z = (i - (count - 1) / 2) * spacing;
            armGroup.position.y = 1.5; // Altura inicial
            // Base do braço
            const base = core_1.MeshBuilder.CreateCylinder(`${id}_armBase_${i}`, { height: 1.0, diameter: 0.4 }, scene);
            base.parent = armGroup;
            base.position.y = 0.5;
            base.material = armMaterial;
            // Segmento 1
            const seg1 = core_1.MeshBuilder.CreateCylinder(`${id}_armSeg1_${i}`, { height: armLength / 2, diameter: armDiameter }, scene);
            seg1.parent = armGroup;
            seg1.position.y = 1.0 + (armLength / 4);
            seg1.rotation.x = Math.PI / 4;
            seg1.material = armMaterial;
            // Articulação
            const joint = core_1.MeshBuilder.CreateSphere(`${id}_armJoint_${i}`, { diameter: armDiameter * 1.5 }, scene);
            joint.parent = armGroup;
            joint.position.y = 1.0 + (armLength / 2) * Math.sin(Math.PI / 4);
            joint.position.x = (armLength / 2) * Math.cos(Math.PI / 4);
            joint.material = armMaterial;
            // Segmento 2
            const seg2 = core_1.MeshBuilder.CreateCylinder(`${id}_armSeg2_${i}`, { height: armLength / 2, diameter: armDiameter }, scene);
            seg2.parent = armGroup;
            // Posicionar relativo à articulação
            seg2.position = joint.position.add(new core_1.Vector3(armLength / 4, -armLength / 4, 0));
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
    _createMaterial(name, color) {
        const scene = SceneManager.scene;
        const material = new core_1.StandardMaterial(name, scene);
        material.diffuseColor = color;
        return material;
    }
    /**
     * Obtém todos os meshes de áreas de carregamento
     * @returns Array de meshes de áreas de carregamento
     */
    getLoadingAreaMeshes() {
        return this._loadingAreaMeshes;
    }
    /**
     * Obtém uma área de carregamento específica por ID
     * @param id - ID da área
     * @returns A área encontrada ou null
     */
    getLoadingAreaById(id) {
        return this._loadingAreaMeshes.find(area => { var _a; return ((_a = area.metadata) === null || _a === void 0 ? void 0 : _a.id) === id; }) || null;
    }
    /**
     * Atualiza o estado de uma área de carregamento
     * @param id - ID da área
     * @param newState - Novo estado ('available', 'loading', etc.)
     * @returns true se a área foi encontrada e atualizada
     */
    updateLoadingAreaState(id, newState) {
        const areaNode = this.getLoadingAreaById(id);
        if (!areaNode)
            return false;
        const metadata = areaNode.metadata;
        if (!metadata || !metadata.components)
            return false;
        const stateConfig = this._loadingAreaConfig.states[newState];
        if (!stateConfig) {
            console.warn(`Estado de área de carregamento inválido: ${newState}`);
            return false;
        }
        // Atualizar metadados
        metadata.state = newState;
        // Atualizar indicador de estado
        const indicator = metadata.components.stateIndicator;
        if (indicator && indicator.material instanceof core_1.StandardMaterial) {
            indicator.material.diffuseColor = stateConfig.color;
        }
        // Adicionar lógica para animação ou mudança visual se necessário
        return true;
    }
    /**
     * Limpa todas as áreas de carregamento da cena
     */
    clearLoadingAreas() {
        this._loadingAreaMeshes.forEach(area => {
            area.dispose();
        });
        this._loadingAreaMeshes = [];
    }
}
exports.LoadingAreasManager = LoadingAreasManager;
// Criar instância global para compatibilidade com código existente
// Isso será removido quando todo o código for migrado para importações ES6
window.LoadingAreasManager = {
    initialize: () => LoadingAreasManager.getInstance().initialize(),
    createLoadingAreas: () => LoadingAreasManager.getInstance().createLoadingAreas(),
    getLoadingAreaMeshes: () => LoadingAreasManager.getInstance().getLoadingAreaMeshes(),
    getLoadingAreaById: (id) => LoadingAreasManager.getInstance().getLoadingAreaById(id),
    updateLoadingAreaState: (id, newState) => LoadingAreasManager.getInstance().updateLoadingAreaState(id, newState),
    clearLoadingAreas: () => LoadingAreasManager.getInstance().clearLoadingAreas()
};
//# sourceMappingURL=loadingAreas.js.map
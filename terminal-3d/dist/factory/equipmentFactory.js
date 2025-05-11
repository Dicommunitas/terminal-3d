import { Color3 } from "@babylonjs/core";
import { db } from "../database/inMemoryDb";
import { TanksManager } from "../models/tanks";
import { PipesManager } from "../models/pipes";
import { ValvesManager } from "../models/valves";
/**
 * EquipmentFactory - Fábrica para criação e catalogação de equipamentos 3D
 *
 * Implementa o padrão Factory para centralizar a lógica de criação de diferentes
 * tipos de equipamentos (Tanques, Tubulações, Válvulas) na cena 3D.
 * Também gerencia o catálogo de equipamentos disponíveis.
 */
export class EquipmentFactory {
    /**
     * Obtém a instância única do EquipmentFactory (Singleton)
     */
    static getInstance() {
        if (!EquipmentFactory._instance) {
            EquipmentFactory._instance = new EquipmentFactory();
        }
        return EquipmentFactory._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._scene = null;
        this._groups = null;
        this._catalog = new Map();
        this._catalogByType = new Map(); // Tipo -> [id1, id2, ...]
        this._catalogByTag = new Map(); // Tag -> [id1, id2, ...]
        // Configurações para os equipamentos
        this._config = {
            tanks: {
                defaultMaterial: {
                    color: new Color3(0, 0.47, 0.75), // Azul petróleo
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
                }
            },
            pipes: {
                materials: {
                    standard: {
                        color: new Color3(0.5, 0.5, 0.5), // Cinza
                        roughness: 0.6,
                        metallic: 0.7
                    },
                    insulated: {
                        color: new Color3(0.8, 0.8, 0.8), // Cinza claro
                        roughness: 0.8,
                        metallic: 0.2
                    },
                    highTemp: {
                        color: new Color3(0.6, 0.3, 0.3), // Vermelho escuro
                        roughness: 0.5,
                        metallic: 0.6
                    }
                },
                diameters: {
                    small: 0.15, // 2-4 polegadas
                    medium: 0.3, // 6-8 polegadas
                    large: 0.5, // 10-12 polegadas
                    extraLarge: 0.8 // 16+ polegadas
                },
                tessellation: {
                    small: 8,
                    medium: 12,
                    large: 16,
                    extraLarge: 20,
                    lodSmall: 6,
                    lodMedium: 8,
                    lodLarge: 10,
                    lodExtraLarge: 12
                }
            },
            valves: {
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
                        wheelRotation: Math.PI / 2,
                        diskRotation: Math.PI / 2,
                        sphereRotation: Math.PI / 2
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
                }
            }
        };
        this._initializeCatalog();
    }
    /**
     * Inicializa a fábrica com a cena e os grupos
     * @param scene - A cena Babylon.js
     * @param groups - Objeto contendo referências aos grupos (tanks, pipes, valves)
     */
    initialize(scene, groups) {
        this._scene = scene;
        this._groups = groups;
        console.log("EquipmentFactory inicializada com cena e grupos.");
    }
    /**
     * Inicializa o catálogo de equipamentos com itens padrão
     */
    _initializeCatalog() {
        // Tanques
        this._addCatalogItem({
            id: "catalog_tank_standard",
            type: "tank",
            subtype: "standard",
            name: "Tanque Padrão",
            description: "Tanque cilíndrico de tamanho padrão para armazenamento de produtos",
            tags: ["tanque", "cilíndrico", "armazenamento", "padrão"],
            defaultProperties: {
                equipmentType: "standard",
                capacity: 3000,
                level: 0.5,
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_tank_large",
            type: "tank",
            subtype: "large",
            name: "Tanque Grande",
            description: "Tanque cilíndrico de grande capacidade para armazenamento de produtos",
            tags: ["tanque", "cilíndrico", "armazenamento", "grande"],
            defaultProperties: {
                equipmentType: "large",
                capacity: 5000,
                level: 0.5,
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_tank_small",
            type: "tank",
            subtype: "small",
            name: "Tanque Pequeno",
            description: "Tanque cilíndrico de pequena capacidade para armazenamento de produtos",
            tags: ["tanque", "cilíndrico", "armazenamento", "pequeno"],
            defaultProperties: {
                equipmentType: "small",
                capacity: 1000,
                level: 0.5,
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_tank_spherical",
            type: "tank",
            subtype: "spherical",
            name: "Tanque Esférico",
            description: "Tanque esférico para armazenamento de produtos pressurizados",
            tags: ["tanque", "esférico", "armazenamento", "pressurizado", "GLP"],
            defaultProperties: {
                equipmentType: "spherical",
                capacity: 2000,
                level: 0.5,
                product: "GLP",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        // Tubulações
        this._addCatalogItem({
            id: "catalog_pipe_small",
            type: "pipe",
            subtype: "small",
            name: "Tubulação Pequena",
            description: "Tubulação de pequeno diâmetro (2-4 polegadas)",
            tags: ["tubulação", "pequena", "transferência"],
            defaultProperties: {
                size: "small",
                materialType: "standard",
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_pipe_medium",
            type: "pipe",
            subtype: "medium",
            name: "Tubulação Média",
            description: "Tubulação de médio diâmetro (6-8 polegadas)",
            tags: ["tubulação", "média", "transferência"],
            defaultProperties: {
                size: "medium",
                materialType: "standard",
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_pipe_large",
            type: "pipe",
            subtype: "large",
            name: "Tubulação Grande",
            description: "Tubulação de grande diâmetro (10-12 polegadas)",
            tags: ["tubulação", "grande", "transferência"],
            defaultProperties: {
                size: "large",
                materialType: "standard",
                product: "Produto",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_pipe_hightemp",
            type: "pipe",
            subtype: "highTemp",
            name: "Tubulação de Alta Temperatura",
            description: "Tubulação para fluidos de alta temperatura como vapor",
            tags: ["tubulação", "alta temperatura", "vapor", "transferência"],
            defaultProperties: {
                size: "medium",
                materialType: "highTemp",
                product: "Vapor",
                status: "operational"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        // Válvulas
        this._addCatalogItem({
            id: "catalog_valve_gate",
            type: "valve",
            subtype: "gate",
            name: "Válvula de Gaveta",
            description: "Válvula de gaveta para bloqueio de fluxo",
            tags: ["válvula", "gaveta", "bloqueio", "manual"],
            defaultProperties: {
                valveType: "gate",
                state: "closed",
                product: "Produto"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_valve_ball",
            type: "valve",
            subtype: "ball",
            name: "Válvula de Esfera",
            description: "Válvula de esfera para bloqueio rápido de fluxo",
            tags: ["válvula", "esfera", "bloqueio", "manual"],
            defaultProperties: {
                valveType: "ball",
                state: "closed",
                product: "Produto"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_valve_check",
            type: "valve",
            subtype: "check",
            name: "Válvula de Retenção",
            description: "Válvula de retenção para prevenir fluxo reverso",
            tags: ["válvula", "retenção", "unidirecional"],
            defaultProperties: {
                valveType: "check",
                state: "open",
                product: "Produto"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        this._addCatalogItem({
            id: "catalog_valve_control",
            type: "valve",
            subtype: "control",
            name: "Válvula de Controle",
            description: "Válvula de controle para regulagem de fluxo",
            tags: ["válvula", "controle", "regulagem", "automática"],
            defaultProperties: {
                valveType: "control",
                state: "partial",
                product: "Produto"
            },
            dateAdded: new Date(),
            dateModified: new Date(),
            usageCount: 0
        });
        console.log(`Catálogo inicializado com ${this._catalog.size} itens.`);
    }
    /**
     * Adiciona um item ao catálogo
     * @param item - Item a ser adicionado ao catálogo
     */
    _addCatalogItem(item) {
        this._catalog.set(item.id, item);
        // Adicionar aos índices
        this._addToIndex(this._catalogByType, item.type, item.id);
        // Adicionar cada tag ao índice de tags
        item.tags.forEach(tag => {
            this._addToIndex(this._catalogByTag, tag.toLowerCase(), item.id);
        });
    }
    /**
     * Adiciona um ID a um índice
     * @param index - Índice a ser atualizado
     * @param key - Chave do índice
     * @param id - ID a ser adicionado
     */
    _addToIndex(index, key, id) {
        const list = index.get(key) || [];
        if (!list.includes(id)) {
            list.push(id);
            index.set(key, list);
        }
    }
    /**
     * Remove um ID de um índice
     * @param index - Índice a ser atualizado
     * @param key - Chave do índice
     * @param id - ID a ser removido
     */
    _removeFromIndex(index, key, id) {
        const list = index.get(key);
        if (list) {
            const itemIndex = list.indexOf(id);
            if (itemIndex > -1) {
                list.splice(itemIndex, 1);
                if (list.length === 0) {
                    index.delete(key);
                }
                else {
                    index.set(key, list);
                }
            }
        }
    }
    /**
     * Cria um equipamento com base nos dados fornecidos.
     * Função principal da Factory.
     * @param equipmentData - Dados do equipamento
     * @returns O nó do equipamento criado ou null em caso de erro.
     */
    createEquipment(equipmentData) {
        if (!this._scene || !this._groups) {
            console.error("EquipmentFactory não inicializada.");
            return null;
        }
        try {
            // Incrementar contador de uso se o equipamento for baseado em um item do catálogo
            if (equipmentData.catalogId) {
                const catalogItem = this._catalog.get(equipmentData.catalogId);
                if (catalogItem) {
                    catalogItem.usageCount++;
                    catalogItem.dateModified = new Date();
                }
            }
            // Criar o equipamento com base no tipo
            switch (equipmentData.type) {
                case "tank":
                    return this._createTank(equipmentData);
                case "pipe":
                    return this._createPipe(equipmentData);
                case "valve":
                    return this._createValve(equipmentData);
                case "loadingArea":
                    // return this._createLoadingArea(equipmentData as LoadingAreaData);
                    console.warn("Criação de LoadingArea ainda não implementada na Factory.");
                    return null;
                default:
                    console.warn(`Tipo de equipamento desconhecido: ${equipmentData.type}`);
                    return null;
            }
        }
        catch (error) {
            console.error(`Erro ao criar equipamento ${equipmentData.id} (${equipmentData.type}):`, error);
            return null;
        }
    }
    /**
     * Cria um equipamento a partir de um item do catálogo
     * @param catalogId - ID do item no catálogo
     * @param position - Posição do equipamento
     * @param customProperties - Propriedades personalizadas para sobrescrever as padrão
     * @returns O nó do equipamento criado ou null em caso de erro
     */
    createFromCatalog(catalogId, position, customProperties = {}) {
        const catalogItem = this._catalog.get(catalogId);
        if (!catalogItem) {
            console.error(`Item de catálogo não encontrado: ${catalogId}`);
            return null;
        }
        // Gerar ID único para o novo equipamento
        const uniqueId = `${catalogItem.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        // Mesclar propriedades padrão com personalizadas
        const equipmentData = Object.assign(Object.assign(Object.assign({}, catalogItem.defaultProperties), customProperties), { id: uniqueId, type: catalogItem.type, position: position, catalogId: catalogId // Referência ao item do catálogo
         });
        // Definir propriedades específicas por tipo
        if (catalogItem.type === "tank") {
            equipmentData.equipmentType = catalogItem.subtype;
        }
        else if (catalogItem.type === "pipe") {
            equipmentData.size = catalogItem.subtype;
        }
        else if (catalogItem.type === "valve") {
            equipmentData.valveType = catalogItem.subtype;
        }
        // Criar o equipamento
        const equipmentNode = this.createEquipment(equipmentData);
        // Salvar no banco de dados
        if (equipmentNode) {
            db.upsertEquipment(equipmentData);
            console.log(`Equipamento ${uniqueId} criado a partir do catálogo ${catalogId}`);
        }
        return equipmentNode;
    }
    /**
     * Cria um tanque (delegando para TanksManager)
     * @param tankData - Dados do tanque
     * @returns O nó do tanque criado
     */
    _createTank(tankData) {
        var _a;
        if (!((_a = this._groups) === null || _a === void 0 ? void 0 : _a.tanks)) {
            console.error("Grupo 'tanks' não encontrado para adicionar o tanque.");
            return null;
        }
        // Usar o TanksManager para criar o tanque
        const tanksManager = TanksManager.getInstance();
        return tanksManager.createTankFromData(tankData);
    }
    /**
     * Cria uma tubulação (delegando para PipesManager)
     * @param pipeData - Dados da tubulação
     * @returns O nó da tubulação criada
     */
    _createPipe(pipeData) {
        var _a;
        if (!((_a = this._groups) === null || _a === void 0 ? void 0 : _a.pipes)) {
            console.error("Grupo 'pipes' não encontrado para adicionar a tubulação.");
            return null;
        }
        // Usar o PipesManager para criar a tubulação
        const pipesManager = PipesManager.getInstance();
        return pipesManager.createPipeFromData(pipeData);
    }
    /**
     * Cria uma válvula (delegando para ValvesManager)
     * @param valveData - Dados da válvula
     * @returns O nó da válvula criada
     */
    _createValve(valveData) {
        var _a;
        if (!((_a = this._groups) === null || _a === void 0 ? void 0 : _a.valves)) {
            console.error("Grupo 'valves' não encontrado para adicionar a válvula.");
            return null;
        }
        // Usar o ValvesManager para criar a válvula
        const valvesManager = ValvesManager.getInstance();
        return valvesManager.createOrUpdateValve(valveData);
    }
    /**
     * Obtém todos os itens do catálogo
     * @returns Array com todos os itens do catálogo
     */
    getAllCatalogItems() {
        return Array.from(this._catalog.values());
    }
    /**
     * Obtém itens do catálogo por tipo
     * @param type - Tipo de equipamento ('tank', 'pipe', 'valve', 'loadingArea')
     * @returns Array com os itens do catálogo do tipo especificado
     */
    getCatalogItemsByType(type) {
        const ids = this._catalogByType.get(type) || [];
        return ids.map(id => this._catalog.get(id)).filter(Boolean);
    }
    /**
     * Obtém itens do catálogo por tag
     * @param tag - Tag para busca
     * @returns Array com os itens do catálogo que possuem a tag especificada
     */
    getCatalogItemsByTag(tag) {
        const ids = this._catalogByTag.get(tag.toLowerCase()) || [];
        return ids.map(id => this._catalog.get(id)).filter(Boolean);
    }
    /**
     * Busca itens no catálogo por texto
     * @param searchText - Texto para busca
     * @returns Array com os itens do catálogo que correspondem à busca
     */
    searchCatalog(searchText) {
        const searchLower = searchText.toLowerCase();
        return Array.from(this._catalog.values()).filter(item => item.name.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
    }
    /**
     * Adiciona um novo item ao catálogo
     * @param item - Item a ser adicionado
     * @returns true se adicionado com sucesso, false caso contrário
     */
    addCatalogItem(item) {
        if (this._catalog.has(item.id)) {
            console.warn(`Item com ID ${item.id} já existe no catálogo.`);
            return false;
        }
        this._addCatalogItem(item);
        console.log(`Item ${item.id} adicionado ao catálogo.`);
        return true;
    }
    /**
     * Atualiza um item existente no catálogo
     * @param id - ID do item a ser atualizado
     * @param updates - Atualizações a serem aplicadas
     * @returns true se atualizado com sucesso, false caso contrário
     */
    updateCatalogItem(id, updates) {
        const item = this._catalog.get(id);
        if (!item) {
            console.warn(`Item com ID ${id} não encontrado no catálogo.`);
            return false;
        }
        // Remover dos índices atuais
        this._removeFromIndex(this._catalogByType, item.type, id);
        item.tags.forEach(tag => {
            this._removeFromIndex(this._catalogByTag, tag.toLowerCase(), id);
        });
        // Aplicar atualizações
        const updatedItem = Object.assign(Object.assign(Object.assign({}, item), updates), { dateModified: new Date() });
        this._catalog.set(id, updatedItem);
        // Adicionar aos novos índices
        this._addToIndex(this._catalogByType, updatedItem.type, id);
        updatedItem.tags.forEach(tag => {
            this._addToIndex(this._catalogByTag, tag.toLowerCase(), id);
        });
        console.log(`Item ${id} atualizado no catálogo.`);
        return true;
    }
    /**
     * Remove um item do catálogo
     * @param id - ID do item a ser removido
     * @returns true se removido com sucesso, false caso contrário
     */
    removeCatalogItem(id) {
        const item = this._catalog.get(id);
        if (!item) {
            console.warn(`Item com ID ${id} não encontrado no catálogo.`);
            return false;
        }
        // Remover dos índices
        this._removeFromIndex(this._catalogByType, item.type, id);
        item.tags.forEach(tag => {
            this._removeFromIndex(this._catalogByTag, tag.toLowerCase(), id);
        });
        // Remover do catálogo
        this._catalog.delete(id);
        console.log(`Item ${id} removido do catálogo.`);
        return true;
    }
    /**
     * Obtém as configurações de equipamentos
     * @returns Configurações de equipamentos
     */
    getConfig() {
        return this._config;
    }
}
// Exportar instância singleton para fácil acesso
export const equipmentFactory = EquipmentFactory.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.EquipmentFactory = equipmentFactory;
//# sourceMappingURL=equipmentFactory.js.map
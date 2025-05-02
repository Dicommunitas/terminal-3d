"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryManager = exports.CategoryManager = void 0;
const inMemoryDb_1 = require("../database/inMemoryDb");
/**
 * CategoryManager - Gerencia a estrutura hierárquica de categorias para equipamentos.
 *
 * Permite criar, modificar, remover categorias e associar equipamentos a elas.
 * Facilita a navegação e filtragem por categorias.
 */
class CategoryManager {
    /**
     * Obtém a instância única do CategoryManager (Singleton)
     */
    static getInstance() {
        if (!CategoryManager._instance) {
            CategoryManager._instance = new CategoryManager();
        }
        return CategoryManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._categories = new Map();
        this._rootCategoryId = "root";
        this._initializeDefaultCategories();
    }
    /**
     * Inicializa com categorias padrão (ex: Terminal > Área > Sistema)
     */
    _initializeDefaultCategories() {
        // Categoria raiz
        this.addCategory(this._rootCategoryId, "Terminal", null);
        // Exemplo de estrutura hierárquica
        const areaAId = this.addCategory("area_a", "Área A", this._rootCategoryId);
        const areaBId = this.addCategory("area_b", "Área B", this._rootCategoryId);
        if (areaAId) {
            const systemA1Id = this.addCategory("system_a1", "Sistema A1 (Armazenamento)", areaAId);
            const systemA2Id = this.addCategory("system_a2", "Sistema A2 (Transferência)", areaAId);
            // Associar equipamentos existentes a estas categorias (exemplo)
            // this.assignEquipmentToCategory("TANK-01", systemA1Id);
            // this.assignEquipmentToCategory("PIPE-01", systemA2Id);
        }
        if (areaBId) {
            const systemB1Id = this.addCategory("system_b1", "Sistema B1 (Carregamento)", areaBId);
            // this.assignEquipmentToCategory("LA-01", systemB1Id);
        }
        console.log("Categorias padrão inicializadas.");
    }
    /**
     * Adiciona uma nova categoria.
     * @param id - ID único da categoria.
     * @param name - Nome da categoria.
     * @param parentId - ID da categoria pai (null para raiz).
     * @returns O ID da categoria criada ou null em caso de erro.
     */
    addCategory(id, name, parentId) {
        if (this._categories.has(id)) {
            console.warn(`Categoria com ID ${id} já existe.`);
            return null;
        }
        const parentNode = parentId ? this._categories.get(parentId) : null;
        if (parentId && !parentNode) {
            console.error(`Categoria pai com ID ${parentId} não encontrada.`);
            return null;
        }
        const newNode = {
            id,
            name,
            parentId,
            childrenIds: [],
            equipmentIds: []
        };
        this._categories.set(id, newNode);
        // Adicionar como filho do pai
        if (parentNode) {
            parentNode.childrenIds.push(id);
        }
        console.log(`Categoria '${name}' (ID: ${id}) adicionada.`);
        return id;
    }
    /**
     * Remove uma categoria e seus descendentes.
     * @param id - ID da categoria a ser removida.
     * @param removeChildren - Se true, remove também todas as categorias filhas (padrão: true).
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeCategory(id, removeChildren = true) {
        const nodeToRemove = this._categories.get(id);
        if (!nodeToRemove) {
            console.warn(`Categoria com ID ${id} não encontrada.`);
            return false;
        }
        if (id === this._rootCategoryId) {
            console.error("Não é possível remover a categoria raiz.");
            return false;
        }
        // Remover recursivamente os filhos, se solicitado
        if (removeChildren) {
            // Copiar array de filhos para evitar problemas de modificação durante iteração
            const childrenIdsCopy = [...nodeToRemove.childrenIds];
            childrenIdsCopy.forEach(childId => this.removeCategory(childId, true));
        }
        // Desassociar equipamentos desta categoria
        nodeToRemove.equipmentIds.forEach(eqId => {
            const equipment = inMemoryDb_1.db.getEquipmentById(eqId);
            if (equipment) {
                equipment.categoryId = undefined; // Ou mover para o pai?
                inMemoryDb_1.db.upsertEquipment(equipment);
            }
        });
        // Remover da lista de filhos do pai
        if (nodeToRemove.parentId) {
            const parentNode = this._categories.get(nodeToRemove.parentId);
            if (parentNode) {
                const index = parentNode.childrenIds.indexOf(id);
                if (index > -1) {
                    parentNode.childrenIds.splice(index, 1);
                }
            }
        }
        // Remover a categoria do mapa
        this._categories.delete(id);
        console.log(`Categoria ${id} removida.`);
        return true;
    }
    /**
     * Move uma categoria para um novo pai.
     * @param id - ID da categoria a ser movida.
     * @param newParentId - ID da nova categoria pai (null para mover para a raiz).
     * @returns true se movida com sucesso, false caso contrário.
     */
    moveCategory(id, newParentId) {
        const nodeToMove = this._categories.get(id);
        if (!nodeToMove) {
            console.warn(`Categoria com ID ${id} não encontrada.`);
            return false;
        }
        if (id === this._rootCategoryId) {
            console.error("Não é possível mover a categoria raiz.");
            return false;
        }
        const newParentNode = newParentId ? this._categories.get(newParentId) : null;
        if (newParentId && !newParentNode) {
            console.error(`Nova categoria pai com ID ${newParentId} não encontrada.`);
            return false;
        }
        // Verificar se o novo pai não é um descendente da categoria a ser movida
        if (newParentId && this.isDescendant(newParentId, id)) {
            console.error(`Não é possível mover a categoria ${id} para um de seus descendentes (${newParentId}).`);
            return false;
        }
        // Remover da lista de filhos do pai antigo
        if (nodeToMove.parentId) {
            const oldParentNode = this._categories.get(nodeToMove.parentId);
            if (oldParentNode) {
                const index = oldParentNode.childrenIds.indexOf(id);
                if (index > -1) {
                    oldParentNode.childrenIds.splice(index, 1);
                }
            }
        }
        // Atualizar o parentId do nó movido
        nodeToMove.parentId = newParentId;
        // Adicionar à lista de filhos do novo pai
        if (newParentNode) {
            newParentNode.childrenIds.push(id);
        }
        console.log(`Categoria ${id} movida para ${newParentId || 'raiz'}.`);
        return true;
    }
    /**
     * Renomeia uma categoria.
     * @param id - ID da categoria a ser renomeada.
     * @param newName - Novo nome da categoria.
     * @returns true se renomeada com sucesso, false caso contrário.
     */
    renameCategory(id, newName) {
        const node = this._categories.get(id);
        if (!node) {
            console.warn(`Categoria com ID ${id} não encontrada.`);
            return false;
        }
        node.name = newName;
        console.log(`Categoria ${id} renomeada para '${newName}'.`);
        return true;
    }
    /**
     * Associa um equipamento a uma categoria.
     * Remove a associação anterior se houver.
     * @param equipmentId - ID do equipamento.
     * @param categoryId - ID da categoria.
     * @returns true se associado com sucesso, false caso contrário.
     */
    assignEquipmentToCategory(equipmentId, categoryId) {
        const categoryNode = this._categories.get(categoryId);
        if (!categoryNode) {
            console.warn(`Categoria com ID ${categoryId} não encontrada.`);
            return false;
        }
        const equipment = inMemoryDb_1.db.getEquipmentById(equipmentId);
        if (!equipment) {
            console.warn(`Equipamento com ID ${equipmentId} não encontrado no DB.`);
            return false;
        }
        // Remover da categoria antiga, se existir
        if (equipment.categoryId) {
            const oldCategoryNode = this._categories.get(equipment.categoryId);
            if (oldCategoryNode) {
                const index = oldCategoryNode.equipmentIds.indexOf(equipmentId);
                if (index > -1) {
                    oldCategoryNode.equipmentIds.splice(index, 1);
                }
            }
        }
        // Adicionar à nova categoria
        if (!categoryNode.equipmentIds.includes(equipmentId)) {
            categoryNode.equipmentIds.push(equipmentId);
        }
        // Atualizar equipamento no DB
        equipment.categoryId = categoryId;
        inMemoryDb_1.db.upsertEquipment(equipment);
        console.log(`Equipamento ${equipmentId} associado à categoria ${categoryId}.`);
        return true;
    }
    /**
     * Desassocia um equipamento de sua categoria atual.
     * @param equipmentId - ID do equipamento.
     * @returns true se desassociado com sucesso, false caso contrário.
     */
    unassignEquipmentFromCategory(equipmentId) {
        const equipment = inMemoryDb_1.db.getEquipmentById(equipmentId);
        if (!equipment || !equipment.categoryId) {
            // Equipamento não encontrado ou já não está associado
            return true;
        }
        const categoryNode = this._categories.get(equipment.categoryId);
        if (categoryNode) {
            const index = categoryNode.equipmentIds.indexOf(equipmentId);
            if (index > -1) {
                categoryNode.equipmentIds.splice(index, 1);
            }
        }
        // Remover categoryId do equipamento no DB
        equipment.categoryId = undefined;
        inMemoryDb_1.db.upsertEquipment(equipment);
        console.log(`Equipamento ${equipmentId} desassociado de sua categoria.`);
        return true;
    }
    /**
     * Obtém uma categoria pelo ID.
     * @param id - ID da categoria.
     * @returns O nó da categoria ou undefined se não encontrado.
     */
    getCategoryById(id) {
        return this._categories.get(id);
    }
    /**
     * Obtém a categoria raiz.
     * @returns O nó da categoria raiz.
     */
    getRootCategory() {
        return this._categories.get(this._rootCategoryId);
    }
    /**
     * Obtém os filhos diretos de uma categoria.
     * @param parentId - ID da categoria pai.
     * @returns Array com os nós das categorias filhas.
     */
    getChildren(parentId) {
        const parentNode = this._categories.get(parentId);
        if (!parentNode)
            return [];
        return parentNode.childrenIds
            .map(childId => this._categories.get(childId))
            .filter(Boolean);
    }
    /**
     * Obtém todos os equipamentos associados a uma categoria (diretamente).
     * @param categoryId - ID da categoria.
     * @returns Array com os dados dos equipamentos.
     */
    getEquipmentInCategory(categoryId) {
        const categoryNode = this._categories.get(categoryId);
        if (!categoryNode)
            return [];
        return categoryNode.equipmentIds
            .map(eqId => inMemoryDb_1.db.getEquipmentById(eqId))
            .filter(Boolean);
    }
    /**
     * Obtém todos os equipamentos associados a uma categoria e suas subcategorias (recursivamente).
     * @param categoryId - ID da categoria.
     * @returns Array com os dados dos equipamentos.
     */
    getEquipmentInSubtree(categoryId) {
        const categoryNode = this._categories.get(categoryId);
        if (!categoryNode)
            return [];
        let equipment = this.getEquipmentInCategory(categoryId);
        categoryNode.childrenIds.forEach(childId => {
            equipment = equipment.concat(this.getEquipmentInSubtree(childId));
        });
        // Remover duplicatas (caso um equipamento seja movido entre categorias durante a recursão)
        const uniqueEquipment = Array.from(new Map(equipment.map(eq => [eq.id, eq])).values());
        return uniqueEquipment;
    }
    /**
     * Obtém a árvore de categorias completa.
     * @returns O nó raiz da árvore de categorias.
     */
    getCategoryTree() {
        // Poderia retornar uma cópia profunda para evitar modificações externas
        return this.getRootCategory();
    }
    /**
     * Verifica se uma categoria é descendente de outra.
     * @param potentialDescendantId - ID da categoria potencialmente descendente.
     * @param ancestorId - ID da categoria ancestral.
     * @returns true se for descendente, false caso contrário.
     */
    isDescendant(potentialDescendantId, ancestorId) {
        const node = this._categories.get(potentialDescendantId);
        if (!node || !node.parentId) {
            return false;
        }
        if (node.parentId === ancestorId) {
            return true;
        }
        return this.isDescendant(node.parentId, ancestorId);
    }
    /**
     * Obtém o caminho (ancestrais) de uma categoria até a raiz.
     * @param categoryId - ID da categoria.
     * @returns Array com os nós das categorias ancestrais, da mais próxima à raiz.
     */
    getCategoryPath(categoryId) {
        const path = [];
        let currentNode = this._categories.get(categoryId);
        while (currentNode && currentNode.parentId) {
            const parentNode = this._categories.get(currentNode.parentId);
            if (parentNode) {
                path.unshift(parentNode); // Adiciona no início para manter a ordem raiz -> filho
                currentNode = parentNode;
            }
            else {
                break; // Pai não encontrado, interrompe
            }
        }
        return path;
    }
}
exports.CategoryManager = CategoryManager;
// Exportar instância singleton para fácil acesso
exports.categoryManager = CategoryManager.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.CategoryManager = exports.categoryManager;
//# sourceMappingURL=categoryManager.js.map
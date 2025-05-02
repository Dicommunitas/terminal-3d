import { EquipmentDataUnion } from "../database/inMemoryDb";
/**
 * Interface para um nó na árvore de categorias
 */
export interface CategoryNode {
    id: string;
    name: string;
    parentId: string | null;
    childrenIds: string[];
    equipmentIds: string[];
}
/**
 * CategoryManager - Gerencia a estrutura hierárquica de categorias para equipamentos.
 *
 * Permite criar, modificar, remover categorias e associar equipamentos a elas.
 * Facilita a navegação e filtragem por categorias.
 */
export declare class CategoryManager {
    private static _instance;
    private _categories;
    private _rootCategoryId;
    /**
     * Obtém a instância única do CategoryManager (Singleton)
     */
    static getInstance(): CategoryManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa com categorias padrão (ex: Terminal > Área > Sistema)
     */
    private _initializeDefaultCategories;
    /**
     * Adiciona uma nova categoria.
     * @param id - ID único da categoria.
     * @param name - Nome da categoria.
     * @param parentId - ID da categoria pai (null para raiz).
     * @returns O ID da categoria criada ou null em caso de erro.
     */
    addCategory(id: string, name: string, parentId: string | null): string | null;
    /**
     * Remove uma categoria e seus descendentes.
     * @param id - ID da categoria a ser removida.
     * @param removeChildren - Se true, remove também todas as categorias filhas (padrão: true).
     * @returns true se removida com sucesso, false caso contrário.
     */
    removeCategory(id: string, removeChildren?: boolean): boolean;
    /**
     * Move uma categoria para um novo pai.
     * @param id - ID da categoria a ser movida.
     * @param newParentId - ID da nova categoria pai (null para mover para a raiz).
     * @returns true se movida com sucesso, false caso contrário.
     */
    moveCategory(id: string, newParentId: string | null): boolean;
    /**
     * Renomeia uma categoria.
     * @param id - ID da categoria a ser renomeada.
     * @param newName - Novo nome da categoria.
     * @returns true se renomeada com sucesso, false caso contrário.
     */
    renameCategory(id: string, newName: string): boolean;
    /**
     * Associa um equipamento a uma categoria.
     * Remove a associação anterior se houver.
     * @param equipmentId - ID do equipamento.
     * @param categoryId - ID da categoria.
     * @returns true se associado com sucesso, false caso contrário.
     */
    assignEquipmentToCategory(equipmentId: string, categoryId: string): boolean;
    /**
     * Desassocia um equipamento de sua categoria atual.
     * @param equipmentId - ID do equipamento.
     * @returns true se desassociado com sucesso, false caso contrário.
     */
    unassignEquipmentFromCategory(equipmentId: string): boolean;
    /**
     * Obtém uma categoria pelo ID.
     * @param id - ID da categoria.
     * @returns O nó da categoria ou undefined se não encontrado.
     */
    getCategoryById(id: string): CategoryNode | undefined;
    /**
     * Obtém a categoria raiz.
     * @returns O nó da categoria raiz.
     */
    getRootCategory(): CategoryNode | undefined;
    /**
     * Obtém os filhos diretos de uma categoria.
     * @param parentId - ID da categoria pai.
     * @returns Array com os nós das categorias filhas.
     */
    getChildren(parentId: string): CategoryNode[];
    /**
     * Obtém todos os equipamentos associados a uma categoria (diretamente).
     * @param categoryId - ID da categoria.
     * @returns Array com os dados dos equipamentos.
     */
    getEquipmentInCategory(categoryId: string): EquipmentDataUnion[];
    /**
     * Obtém todos os equipamentos associados a uma categoria e suas subcategorias (recursivamente).
     * @param categoryId - ID da categoria.
     * @returns Array com os dados dos equipamentos.
     */
    getEquipmentInSubtree(categoryId: string): EquipmentDataUnion[];
    /**
     * Obtém a árvore de categorias completa.
     * @returns O nó raiz da árvore de categorias.
     */
    getCategoryTree(): CategoryNode | undefined;
    /**
     * Verifica se uma categoria é descendente de outra.
     * @param potentialDescendantId - ID da categoria potencialmente descendente.
     * @param ancestorId - ID da categoria ancestral.
     * @returns true se for descendente, false caso contrário.
     */
    isDescendant(potentialDescendantId: string, ancestorId: string): boolean;
    /**
     * Obtém o caminho (ancestrais) de uma categoria até a raiz.
     * @param categoryId - ID da categoria.
     * @returns Array com os nós das categorias ancestrais, da mais próxima à raiz.
     */
    getCategoryPath(categoryId: string): CategoryNode[];
}
export declare const categoryManager: CategoryManager;

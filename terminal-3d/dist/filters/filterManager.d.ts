import { Vector3 } from "@babylonjs/core";
import { EquipmentDataUnion } from "../database/inMemoryDb";
/**
 * Interface para um filtro de equipamentos
 */
export interface EquipmentFilter {
    id: string;
    name: string;
    description?: string;
    filter: (equipment: EquipmentDataUnion) => boolean;
    isActive: boolean;
}
/**
 * Interface para um filtro espacial
 */
export interface SpatialFilter {
    center: Vector3;
    radius: number;
    isActive: boolean;
}
/**
 * Interface para um filtro de texto
 */
export interface TextFilter {
    searchText: string;
    fields: string[];
    isActive: boolean;
}
/**
 * Interface para um filtro de propriedade
 */
export interface PropertyFilter {
    property: string;
    operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "between";
    value: any;
    value2?: any;
    isActive: boolean;
}
/**
 * Interface para um filtro de categoria
 */
export interface CategoryFilter {
    categoryId: string;
    includeSubcategories: boolean;
    isActive: boolean;
}
/**
 * Interface para um filtro de estado
 */
export interface StateFilter {
    states: string[];
    isActive: boolean;
}
/**
 * Interface para um filtro de produto
 */
export interface ProductFilter {
    products: string[];
    isActive: boolean;
}
/**
 * Interface para um conjunto de filtros
 */
export interface FilterSet {
    id: string;
    name: string;
    description?: string;
    filters: EquipmentFilter[];
    spatialFilter?: SpatialFilter;
    textFilter?: TextFilter;
    propertyFilters: PropertyFilter[];
    categoryFilter?: CategoryFilter;
    stateFilter?: StateFilter;
    productFilter?: ProductFilter;
    isActive: boolean;
    dateCreated: Date;
    dateModified: Date;
}
/**
 * FilterManager - Gerencia filtros para equipamentos.
 *
 * Permite criar, modificar, remover e aplicar filtros para encontrar
 * equipamentos com base em diversos critérios.
 */
export declare class FilterManager {
    private static _instance;
    private _filterSets;
    private _activeFilterSetId;
    /**
     * Obtém a instância única do FilterManager (Singleton)
     */
    static getInstance(): FilterManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa com filtros padrão
     */
    private _initializeDefaultFilters;
    /**
     * Cria um novo conjunto de filtros.
     * @param filterSet - Conjunto de filtros a ser criado.
     * @returns O ID do conjunto de filtros criado ou null em caso de erro.
     */
    createFilterSet(filterSet: FilterSet): string | null;
    /**
     * Remove um conjunto de filtros.
     * @param id - ID do conjunto de filtros a ser removido.
     * @returns true se removido com sucesso, false caso contrário.
     */
    removeFilterSet(id: string): boolean;
    /**
     * Atualiza um conjunto de filtros existente.
     * @param id - ID do conjunto de filtros a ser atualizado.
     * @param updates - Atualizações a serem aplicadas.
     * @returns true se atualizado com sucesso, false caso contrário.
     */
    updateFilterSet(id: string, updates: Partial<FilterSet>): boolean;
    /**
     * Ativa um conjunto de filtros.
     * @param id - ID do conjunto de filtros a ser ativado.
     * @returns true se ativado com sucesso, false caso contrário.
     */
    activateFilterSet(id: string): boolean;
    /**
     * Desativa todos os conjuntos de filtros.
     */
    deactivateAllFilterSets(): void;
    /**
     * Obtém um conjunto de filtros pelo ID.
     * @param id - ID do conjunto de filtros.
     * @returns O conjunto de filtros ou undefined se não encontrado.
     */
    getFilterSetById(id: string): FilterSet | undefined;
    /**
     * Obtém o conjunto de filtros ativo.
     * @returns O conjunto de filtros ativo ou undefined se nenhum estiver ativo.
     */
    getActiveFilterSet(): FilterSet | undefined;
    /**
     * Obtém todos os conjuntos de filtros.
     * @returns Array com todos os conjuntos de filtros.
     */
    getAllFilterSets(): FilterSet[];
    /**
     * Aplica o conjunto de filtros ativo aos equipamentos.
     * @returns Array com os equipamentos que passam pelos filtros.
     */
    applyActiveFilters(): EquipmentDataUnion[];
    /**
     * Aplica um conjunto de filtros específico aos equipamentos.
     * @param filterSet - Conjunto de filtros a ser aplicado.
     * @returns Array com os equipamentos que passam pelos filtros.
     */
    applyFilters(filterSet: FilterSet): EquipmentDataUnion[];
    /**
     * Cria um filtro de texto.
     * @param searchText - Texto para busca.
     * @param fields - Campos a serem pesquisados.
     * @returns Um filtro de texto.
     */
    createTextFilter(searchText: string, fields?: string[]): TextFilter;
    /**
     * Cria um filtro espacial.
     * @param center - Centro da área de busca.
     * @param radius - Raio da área de busca.
     * @returns Um filtro espacial.
     */
    createSpatialFilter(center: Vector3, radius: number): SpatialFilter;
    /**
     * Cria um filtro de propriedade.
     * @param property - Nome da propriedade.
     * @param operator - Operador de comparação.
     * @param value - Valor para comparação.
     * @param value2 - Segundo valor para comparação (para o operador "between").
     * @returns Um filtro de propriedade.
     */
    createPropertyFilter(property: string, operator: PropertyFilter["operator"], value: any, value2?: any): PropertyFilter;
    /**
     * Cria um filtro de categoria.
     * @param categoryId - ID da categoria.
     * @param includeSubcategories - Se true, inclui equipamentos em subcategorias.
     * @returns Um filtro de categoria.
     */
    createCategoryFilter(categoryId: string, includeSubcategories?: boolean): CategoryFilter;
    /**
     * Cria um filtro de estado.
     * @param states - Estados a serem filtrados.
     * @returns Um filtro de estado.
     */
    createStateFilter(states: string[]): StateFilter;
    /**
     * Cria um filtro de produto.
     * @param products - Produtos a serem filtrados.
     * @returns Um filtro de produto.
     */
    createProductFilter(products: string[]): ProductFilter;
    /**
     * Cria um filtro personalizado.
     * @param id - ID do filtro.
     * @param name - Nome do filtro.
     * @param filterFn - Função de filtro.
     * @param description - Descrição do filtro.
     * @returns Um filtro personalizado.
     */
    createCustomFilter(id: string, name: string, filterFn: (equipment: EquipmentDataUnion) => boolean, description?: string): EquipmentFilter;
}
export declare const filterManager: FilterManager;

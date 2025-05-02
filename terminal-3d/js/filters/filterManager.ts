import { Vector3 } from "@babylonjs/core";
import { db, EquipmentDataUnion } from "../database/inMemoryDb";
import { categoryManager, CategoryNode } from "./categoryManager";

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
    fields: string[]; // Campos a serem pesquisados
    isActive: boolean;
}

/**
 * Interface para um filtro de propriedade
 */
export interface PropertyFilter {
    property: string;
    operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "between";
    value: any;
    value2?: any; // Para o operador "between"
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
    states: string[]; // Ex: ["operational", "maintenance", "fault"]
    isActive: boolean;
}

/**
 * Interface para um filtro de produto
 */
export interface ProductFilter {
    products: string[]; // Ex: ["Petróleo", "Água", "GLP"]
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
export class FilterManager {
    private static _instance: FilterManager;
    private _filterSets: Map<string, FilterSet> = new Map();
    private _activeFilterSetId: string | null = null;

    /**
     * Obtém a instância única do FilterManager (Singleton)
     */
    public static getInstance(): FilterManager {
        if (!FilterManager._instance) {
            FilterManager._instance = new FilterManager();
        }
        return FilterManager._instance;
    }

    /**
     * Construtor privado (Singleton)
     */
    private constructor() {
        this._initializeDefaultFilters();
    }

    /**
     * Inicializa com filtros padrão
     */
    private _initializeDefaultFilters(): void {
        // Filtro para equipamentos operacionais
        this.createFilterSet({
            id: "operational_equipment",
            name: "Equipamentos Operacionais",
            description: "Mostra apenas equipamentos em estado operacional",
            filters: [],
            propertyFilters: [],
            stateFilter: {
                states: ["operational"],
                isActive: true
            },
            isActive: false,
            dateCreated: new Date(),
            dateModified: new Date()
        });

        // Filtro para equipamentos em manutenção
        this.createFilterSet({
            id: "maintenance_equipment",
            name: "Equipamentos em Manutenção",
            description: "Mostra apenas equipamentos em manutenção",
            filters: [],
            propertyFilters: [],
            stateFilter: {
                states: ["maintenance"],
                isActive: true
            },
            isActive: false,
            dateCreated: new Date(),
            dateModified: new Date()
        });

        // Filtro para tanques
        this.createFilterSet({
            id: "tanks_only",
            name: "Apenas Tanques",
            description: "Mostra apenas tanques",
            filters: [
                {
                    id: "tank_filter",
                    name: "Filtro de Tanques",
                    filter: (equipment) => equipment.type === "tank",
                    isActive: true
                }
            ],
            propertyFilters: [],
            isActive: false,
            dateCreated: new Date(),
            dateModified: new Date()
        });

        // Filtro para tubulações
        this.createFilterSet({
            id: "pipes_only",
            name: "Apenas Tubulações",
            description: "Mostra apenas tubulações",
            filters: [
                {
                    id: "pipe_filter",
                    name: "Filtro de Tubulações",
                    filter: (equipment) => equipment.type === "pipe",
                    isActive: true
                }
            ],
            propertyFilters: [],
            isActive: false,
            dateCreated: new Date(),
            dateModified: new Date()
        });

        // Filtro para válvulas
        this.createFilterSet({
            id: "valves_only",
            name: "Apenas Válvulas",
            description: "Mostra apenas válvulas",
            filters: [
                {
                    id: "valve_filter",
                    name: "Filtro de Válvulas",
                    filter: (equipment) => equipment.type === "valve",
                    isActive: true
                }
            ],
            propertyFilters: [],
            isActive: false,
            dateCreated: new Date(),
            dateModified: new Date()
        });

        console.log("Filtros padrão inicializados.");
    }

    /**
     * Cria um novo conjunto de filtros.
     * @param filterSet - Conjunto de filtros a ser criado.
     * @returns O ID do conjunto de filtros criado ou null em caso de erro.
     */
    public createFilterSet(filterSet: FilterSet): string | null {
        if (this._filterSets.has(filterSet.id)) {
            console.warn(`Conjunto de filtros com ID ${filterSet.id} já existe.`);
            return null;
        }

        this._filterSets.set(filterSet.id, filterSet);
        console.log(`Conjunto de filtros '${filterSet.name}' (ID: ${filterSet.id}) criado.`);
        return filterSet.id;
    }

    /**
     * Remove um conjunto de filtros.
     * @param id - ID do conjunto de filtros a ser removido.
     * @returns true se removido com sucesso, false caso contrário.
     */
    public removeFilterSet(id: string): boolean {
        if (!this._filterSets.has(id)) {
            console.warn(`Conjunto de filtros com ID ${id} não encontrado.`);
            return false;
        }

        this._filterSets.delete(id);
        
        // Se o conjunto removido era o ativo, desativar
        if (this._activeFilterSetId === id) {
            this._activeFilterSetId = null;
        }
        
        console.log(`Conjunto de filtros ${id} removido.`);
        return true;
    }

    /**
     * Atualiza um conjunto de filtros existente.
     * @param id - ID do conjunto de filtros a ser atualizado.
     * @param updates - Atualizações a serem aplicadas.
     * @returns true se atualizado com sucesso, false caso contrário.
     */
    public updateFilterSet(id: string, updates: Partial<FilterSet>): boolean {
        const filterSet = this._filterSets.get(id);
        if (!filterSet) {
            console.warn(`Conjunto de filtros com ID ${id} não encontrado.`);
            return false;
        }

        // Aplicar atualizações
        Object.assign(filterSet, { ...updates, dateModified: new Date() });
        
        console.log(`Conjunto de filtros ${id} atualizado.`);
        return true;
    }

    /**
     * Ativa um conjunto de filtros.
     * @param id - ID do conjunto de filtros a ser ativado.
     * @returns true se ativado com sucesso, false caso contrário.
     */
    public activateFilterSet(id: string): boolean {
        const filterSet = this._filterSets.get(id);
        if (!filterSet) {
            console.warn(`Conjunto de filtros com ID ${id} não encontrado.`);
            return false;
        }

        // Desativar o conjunto ativo atual
        if (this._activeFilterSetId) {
            const currentActive = this._filterSets.get(this._activeFilterSetId);
            if (currentActive) {
                currentActive.isActive = false;
            }
        }

        // Ativar o novo conjunto
        filterSet.isActive = true;
        this._activeFilterSetId = id;
        
        console.log(`Conjunto de filtros ${id} ativado.`);
        return true;
    }

    /**
     * Desativa todos os conjuntos de filtros.
     */
    public deactivateAllFilterSets(): void {
        this._filterSets.forEach(filterSet => {
            filterSet.isActive = false;
        });
        this._activeFilterSetId = null;
        
        console.log("Todos os conjuntos de filtros foram desativados.");
    }

    /**
     * Obtém um conjunto de filtros pelo ID.
     * @param id - ID do conjunto de filtros.
     * @returns O conjunto de filtros ou undefined se não encontrado.
     */
    public getFilterSetById(id: string): FilterSet | undefined {
        return this._filterSets.get(id);
    }

    /**
     * Obtém o conjunto de filtros ativo.
     * @returns O conjunto de filtros ativo ou undefined se nenhum estiver ativo.
     */
    public getActiveFilterSet(): FilterSet | undefined {
        return this._activeFilterSetId ? this._filterSets.get(this._activeFilterSetId) : undefined;
    }

    /**
     * Obtém todos os conjuntos de filtros.
     * @returns Array com todos os conjuntos de filtros.
     */
    public getAllFilterSets(): FilterSet[] {
        return Array.from(this._filterSets.values());
    }

    /**
     * Aplica o conjunto de filtros ativo aos equipamentos.
     * @returns Array com os equipamentos que passam pelos filtros.
     */
    public applyActiveFilters(): EquipmentDataUnion[] {
        const activeFilterSet = this.getActiveFilterSet();
        if (!activeFilterSet) {
            // Se não houver filtro ativo, retornar todos os equipamentos
            return db.getAllEquipment();
        }

        return this.applyFilters(activeFilterSet);
    }

    /**
     * Aplica um conjunto de filtros específico aos equipamentos.
     * @param filterSet - Conjunto de filtros a ser aplicado.
     * @returns Array com os equipamentos que passam pelos filtros.
     */
    public applyFilters(filterSet: FilterSet): EquipmentDataUnion[] {
        // Obter todos os equipamentos do banco de dados
        let filteredEquipment = db.getAllEquipment();

        // Aplicar filtros personalizados
        if (filterSet.filters && filterSet.filters.length > 0) {
            const activeFilters = filterSet.filters.filter(f => f.isActive);
            if (activeFilters.length > 0) {
                filteredEquipment = filteredEquipment.filter(equipment => 
                    activeFilters.every(filter => filter.filter(equipment))
                );
            }
        }

        // Aplicar filtro de categoria
        if (filterSet.categoryFilter && filterSet.categoryFilter.isActive) {
            const { categoryId, includeSubcategories } = filterSet.categoryFilter;
            
            if (includeSubcategories) {
                // Obter todos os equipamentos na categoria e subcategorias
                const categoryEquipment = categoryManager.getEquipmentInSubtree(categoryId);
                const categoryEquipmentIds = new Set(categoryEquipment.map(eq => eq.id));
                
                filteredEquipment = filteredEquipment.filter(equipment => 
                    categoryEquipmentIds.has(equipment.id)
                );
            } else {
                // Obter apenas equipamentos diretamente na categoria
                const categoryEquipment = categoryManager.getEquipmentInCategory(categoryId);
                const categoryEquipmentIds = new Set(categoryEquipment.map(eq => eq.id));
                
                filteredEquipment = filteredEquipment.filter(equipment => 
                    categoryEquipmentIds.has(equipment.id)
                );
            }
        }

        // Aplicar filtro de estado
        if (filterSet.stateFilter && filterSet.stateFilter.isActive && filterSet.stateFilter.states.length > 0) {
            const states = new Set(filterSet.stateFilter.states);
            filteredEquipment = filteredEquipment.filter(equipment => 
                equipment.status && states.has(equipment.status)
            );
        }

        // Aplicar filtro de produto
        if (filterSet.productFilter && filterSet.productFilter.isActive && filterSet.productFilter.products.length > 0) {
            const products = new Set(filterSet.productFilter.products);
            filteredEquipment = filteredEquipment.filter(equipment => 
                'product' in equipment && equipment.product && products.has(equipment.product)
            );
        }

        // Aplicar filtros de propriedade
        if (filterSet.propertyFilters && filterSet.propertyFilters.length > 0) {
            const activePropertyFilters = filterSet.propertyFilters.filter(f => f.isActive);
            
            activePropertyFilters.forEach(propFilter => {
                filteredEquipment = filteredEquipment.filter(equipment => {
                    const value = (equipment as any)[propFilter.property];
                    
                    if (value === undefined) return false;
                    
                    switch (propFilter.operator) {
                        case "equals":
                            return value === propFilter.value;
                        case "notEquals":
                            return value !== propFilter.value;
                        case "contains":
                            return typeof value === 'string' && 
                                   value.toLowerCase().includes(String(propFilter.value).toLowerCase());
                        case "greaterThan":
                            return typeof value === 'number' && value > propFilter.value;
                        case "lessThan":
                            return typeof value === 'number' && value < propFilter.value;
                        case "between":
                            return typeof value === 'number' && 
                                   value >= propFilter.value && 
                                   value <= (propFilter.value2 || propFilter.value);
                        default:
                            return true;
                    }
                });
            });
        }

        // Aplicar filtro de texto
        if (filterSet.textFilter && filterSet.textFilter.isActive && filterSet.textFilter.searchText) {
            const searchText = filterSet.textFilter.searchText.toLowerCase();
            const fields = filterSet.textFilter.fields.length > 0 
                ? filterSet.textFilter.fields 
                : ['id', 'name', 'description', 'type']; // Campos padrão
            
            filteredEquipment = filteredEquipment.filter(equipment => {
                return fields.some(field => {
                    const value = (equipment as any)[field];
                    return value !== undefined && 
                           String(value).toLowerCase().includes(searchText);
                });
            });
        }

        // Aplicar filtro espacial
        if (filterSet.spatialFilter && filterSet.spatialFilter.isActive) {
            const { center, radius } = filterSet.spatialFilter;
            
            filteredEquipment = filteredEquipment.filter(equipment => {
                if (!equipment.position) return false;
                
                const position = equipment.position instanceof Vector3 
                    ? equipment.position 
                    : new Vector3(
                        equipment.position.x || 0,
                        equipment.position.y || 0,
                        equipment.position.z || 0
                    );
                
                const distance = Vector3.Distance(position, center);
                return distance <= radius;
            });
        }

        return filteredEquipment;
    }

    /**
     * Cria um filtro de texto.
     * @param searchText - Texto para busca.
     * @param fields - Campos a serem pesquisados.
     * @returns Um filtro de texto.
     */
    public createTextFilter(searchText: string, fields: string[] = []): TextFilter {
        return {
            searchText,
            fields,
            isActive: true
        };
    }

    /**
     * Cria um filtro espacial.
     * @param center - Centro da área de busca.
     * @param radius - Raio da área de busca.
     * @returns Um filtro espacial.
     */
    public createSpatialFilter(center: Vector3, radius: number): SpatialFilter {
        return {
            center,
            radius,
            isActive: true
        };
    }

    /**
     * Cria um filtro de propriedade.
     * @param property - Nome da propriedade.
     * @param operator - Operador de comparação.
     * @param value - Valor para comparação.
     * @param value2 - Segundo valor para comparação (para o operador "between").
     * @returns Um filtro de propriedade.
     */
    public createPropertyFilter(
        property: string, 
        operator: PropertyFilter["operator"], 
        value: any, 
        value2?: any
    ): PropertyFilter {
        return {
            property,
            operator,
            value,
            value2,
            isActive: true
        };
    }

    /**
     * Cria um filtro de categoria.
     * @param categoryId - ID da categoria.
     * @param includeSubcategories - Se true, inclui equipamentos em subcategorias.
     * @returns Um filtro de categoria.
     */
    public createCategoryFilter(categoryId: string, includeSubcategories: boolean = true): CategoryFilter {
        return {
            categoryId,
            includeSubcategories,
            isActive: true
        };
    }

    /**
     * Cria um filtro de estado.
     * @param states - Estados a serem filtrados.
     * @returns Um filtro de estado.
     */
    public createStateFilter(states: string[]): StateFilter {
        return {
            states,
            isActive: true
        };
    }

    /**
     * Cria um filtro de produto.
     * @param products - Produtos a serem filtrados.
     * @returns Um filtro de produto.
     */
    public createProductFilter(products: string[]): ProductFilter {
        return {
            products,
            isActive: true
        };
    }

    /**
     * Cria um filtro personalizado.
     * @param id - ID do filtro.
     * @param name - Nome do filtro.
     * @param filterFn - Função de filtro.
     * @param description - Descrição do filtro.
     * @returns Um filtro personalizado.
     */
    public createCustomFilter(
        id: string, 
        name: string, 
        filterFn: (equipment: EquipmentDataUnion) => boolean,
        description?: string
    ): EquipmentFilter {
        return {
            id,
            name,
            description,
            filter: filterFn,
            isActive: true
        };
    }
}

// Exportar instância singleton para fácil acesso
export const filterManager = FilterManager.getInstance();

// Disponibilizar no escopo global para compatibilidade (opcional)
(window as any).FilterManager = filterManager;

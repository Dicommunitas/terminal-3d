"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.InMemoryDatabase = void 0;
const core_1 = require("@babylonjs/core"); // Import Nullable
/**
 * InMemoryDatabase - Gerencia os dados do terminal em memória.
 *
 * Utiliza uma estrutura híbrida, com uma tabela principal relacional (Map)
 * e coleções NoSQL (Map) para dados como anotações.
 * Implementa o padrão Singleton.
 */
class InMemoryDatabase {
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._db = {
            equipment: new Map(),
            annotations: new Map(),
            equipmentByType: new Map(),
            equipmentByParent: new Map(),
            equipmentByCategory: new Map() // Inicializar novo índice
        };
        console.log("Instância do InMemoryDatabase criada.");
    }
    /**
     * Obtém a instância única do InMemoryDatabase (Singleton)
     */
    static getInstance() {
        if (!InMemoryDatabase._instance) {
            InMemoryDatabase._instance = new InMemoryDatabase();
        }
        return InMemoryDatabase._instance;
    }
    /**
     * Limpa todo o banco de dados.
     */
    clearDatabase() {
        this._db.equipment.clear();
        this._db.annotations.clear();
        this._db.equipmentByType.clear();
        this._db.equipmentByParent.clear();
        this._db.equipmentByCategory.clear(); // Limpar novo índice
        console.log("Banco de dados em memória limpo.");
    }
    /**
     * Adiciona ou atualiza um equipamento no banco de dados.
     * @param equipmentData - Dados do equipamento.
     */
    upsertEquipment(equipmentData) {
        const oldData = this._db.equipment.get(equipmentData.id);
        // Remover dos índices antigos se existir e o tipo/pai/categoria mudou
        if (oldData) {
            if (oldData.type !== equipmentData.type) {
                this._removeFromIndex(this._db.equipmentByType, oldData.type, oldData.id);
            }
            if (oldData.parentId !== equipmentData.parentId) {
                this._removeFromIndex(this._db.equipmentByParent, oldData.parentId || '', oldData.id);
            }
            if (oldData.categoryId !== equipmentData.categoryId) {
                this._removeFromIndex(this._db.equipmentByCategory, oldData.categoryId || '', oldData.id);
            }
        }
        // Adicionar/Atualizar na tabela principal
        this._db.equipment.set(equipmentData.id, equipmentData);
        // Adicionar aos índices
        this._addToIndex(this._db.equipmentByType, equipmentData.type, equipmentData.id);
        if (equipmentData.parentId) {
            this._addToIndex(this._db.equipmentByParent, equipmentData.parentId, equipmentData.id);
        }
        if (equipmentData.categoryId) {
            this._addToIndex(this._db.equipmentByCategory, equipmentData.categoryId, equipmentData.id);
        }
        // console.log(`Equipamento ${equipmentData.id} adicionado/atualizado.`);
    }
    /**
     * Remove um equipamento do banco de dados.
     * @param id - ID do equipamento a ser removido.
     * @returns true se o equipamento foi removido, false caso contrário.
     */
    deleteEquipment(id) {
        const equipmentData = this._db.equipment.get(id);
        if (!equipmentData) {
            return false;
        }
        // Remover da tabela principal
        this._db.equipment.delete(id);
        // Remover dos índices
        this._removeFromIndex(this._db.equipmentByType, equipmentData.type, id);
        if (equipmentData.parentId) {
            this._removeFromIndex(this._db.equipmentByParent, equipmentData.parentId, id);
        }
        if (equipmentData.categoryId) {
            this._removeFromIndex(this._db.equipmentByCategory, equipmentData.categoryId, id);
        }
        // TODO: Remover equipamentos filhos recursivamente? Ou anotações associadas?
        console.log(`Equipamento ${id} removido.`);
        return true;
    }
    /**
     * Busca um equipamento pelo ID.
     * @param id - ID do equipamento.
     * @returns Os dados do equipamento ou undefined se não encontrado.
     */
    getEquipmentById(id) {
        return this._db.equipment.get(id);
    }
    /**
     * Busca todos os equipamentos de um determinado tipo.
     * @param type - Tipo do equipamento ('tank', 'pipe', etc.).
     * @returns Um array com os dados dos equipamentos encontrados.
     */
    getEquipmentByType(type) {
        const ids = this._db.equipmentByType.get(type) || [];
        return ids.map(id => this._db.equipment.get(id)).filter(Boolean);
    }
    /**
     * Busca todos os equipamentos.
     * @returns Um array com os dados de todos os equipamentos.
     */
    getAllEquipment() {
        return Array.from(this._db.equipment.values());
    }
    /**
     * Busca equipamentos filhos de um determinado pai.
     * @param parentId - ID do equipamento pai.
     * @returns Um array com os dados dos equipamentos filhos.
     */
    getChildrenOf(parentId) {
        const ids = this._db.equipmentByParent.get(parentId) || [];
        return ids.map(id => this._db.equipment.get(id)).filter(Boolean);
    }
    /**
     * Busca equipamentos por categoria.
     * @param categoryId - ID da categoria.
     * @returns Um array com os dados dos equipamentos na categoria.
     */
    getEquipmentByCategory(categoryId) {
        const ids = this._db.equipmentByCategory.get(categoryId) || [];
        return ids.map(id => this._db.equipment.get(id)).filter(Boolean);
    }
    /**
     * Adiciona ou atualiza uma anotação.
     * @param annotationData - Dados da anotação.
     */
    upsertAnnotation(annotationData) {
        // Garantir que as datas existam
        if (!annotationData.dateCreated) {
            annotationData.dateCreated = new Date();
        }
        annotationData.dateModified = new Date(); // Sempre atualiza dateModified
        // Garantir que o tipo exista?
        if (!annotationData.type) {
            annotationData.type = "note"; // Default to 'note' if missing?
        }
        this._db.annotations.set(annotationData.id, annotationData);
        // console.log(`Anotação ${annotationData.id} adicionada/atualizada.`);
    }
    /**
     * Remove uma anotação.
     * @param id - ID da anotação.
     * @returns true se removida, false caso contrário.
     */
    deleteAnnotation(id) {
        return this._db.annotations.delete(id);
    }
    /**
     * Busca uma anotação pelo ID.
     * @param id - ID da anotação.
     * @returns Os dados da anotação ou undefined.
     */
    getAnnotationById(id) {
        return this._db.annotations.get(id);
    }
    /**
     * Busca todas as anotações associadas a um equipamento.
     * @param targetId - ID do equipamento alvo.
     * @returns Um array com as anotações encontradas.
     */
    getAnnotationsByTarget(targetId) {
        const results = [];
        for (const annotation of this._db.annotations.values()) {
            if (annotation.targetId === targetId) {
                results.push(annotation);
            }
        }
        return results;
    }
    /**
     * Busca todas as anotações.
     * @returns Um array com todas as anotações.
     */
    getAllAnnotations() {
        return Array.from(this._db.annotations.values());
    }
    // --- Métodos auxiliares para gerenciamento de índices ---
    _addToIndex(index, key, id) {
        const list = index.get(key) || [];
        if (!list.includes(id)) {
            list.push(id);
            index.set(key, list);
        }
    }
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
    // --- Método para carregar dados iniciais (exemplo) ---
    /**
     * Carrega dados iniciais no banco de dados a partir de um objeto.
     * Espera um objeto com chaves como 'tanks', 'pipes', 'valves', etc.
     * @param initialData - Objeto contendo arrays de dados para cada tipo.
     */
    loadInitialData(initialData) {
        this.clearDatabase();
        console.log("Carregando dados iniciais...");
        let count = 0;
        for (const type in initialData) {
            if (Array.isArray(initialData[type])) {
                initialData[type].forEach((item) => {
                    // Adiciona o tipo correto ao item se não existir
                    if (!item.type) {
                        // Tenta inferir o tipo pela chave do array (ex: 'tanks' -> 'tank')
                        if (type.endsWith('s')) {
                            item.type = type.slice(0, -1);
                        }
                        else {
                            console.warn(`Não foi possível inferir o tipo para o item ${item.id} em ${type}. Pulando.`);
                            return;
                        }
                    }
                    // Converte posições e pontos para Vector3 se necessário
                    if (item.position && !(item.position instanceof core_1.Vector3)) {
                        item.position = new core_1.Vector3(item.position.x || 0, item.position.y || 0, item.position.z || 0);
                    }
                    if (item.targetPosition && !(item.targetPosition instanceof core_1.Vector3)) { // Converter targetPosition também
                        item.targetPosition = new core_1.Vector3(item.targetPosition.x || 0, item.targetPosition.y || 0, item.targetPosition.z || 0);
                    }
                    if (item.points && Array.isArray(item.points)) {
                        item.points = item.points.map((p) => p instanceof core_1.Vector3 ? p : new core_1.Vector3(p.x || 0, p.y || 0, p.z || 0));
                    }
                    // Garantir que ID existe
                    if (!item.id) {
                        item.id = `${item.type}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
                        console.warn(`Item em ${type} não tinha ID. Gerado: ${item.id}`);
                    }
                    // Carregar como equipamento ou anotação
                    if (item.type === 'annotation') { // Assumindo que anotações podem vir nos dados iniciais
                        if (!item.dateCreated)
                            item.dateCreated = new Date(); // Use dateCreated
                        if (!item.author)
                            item.author = "System";
                        this.upsertAnnotation(item);
                    }
                    else {
                        this.upsertEquipment(item);
                    }
                    count++;
                });
            }
        }
        console.log(`${count} itens carregados no banco de dados em memória.`);
    }
}
exports.InMemoryDatabase = InMemoryDatabase;
// Exportar a instância Singleton para fácil acesso
exports.db = InMemoryDatabase.getInstance();
// Exemplo de como carregar dados (será feito em outro lugar, como app.ts)
/*
import { EquipmentData } from '../data/equipment'; // Supondo que equipment.js seja convertido para TS

document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados quando o DOM estiver pronto
    db.loadInitialData(EquipmentData);
});
*/
// Disponibilizar no escopo global para compatibilidade (opcional)
window.InMemoryDb = exports.db;
//# sourceMappingURL=inMemoryDb.js.map
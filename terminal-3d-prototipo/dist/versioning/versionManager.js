"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionManager = exports.VersionManager = void 0;
const inMemoryDb_1 = require("../database/inMemoryDb");
/**
 * VersionManager - Gerencia diferentes versões do modelo do terminal.
 *
 * Permite criar, listar e carregar versões conceituais dos dados.
 * Assume que os dados no InMemoryDatabase possuem um campo `versionId`.
 */
class VersionManager {
    /**
     * Obtém a instância única do VersionManager (Singleton)
     */
    static getInstance() {
        if (!VersionManager._instance) {
            VersionManager._instance = new VersionManager();
        }
        return VersionManager._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._versions = new Map();
        this._activeVersionId = null; // ID da versão atualmente carregada/ativa
        this._initializeDefaultVersion();
    }
    /**
     * Inicializa com uma versão padrão (ex: "current" ou "initial")
     */
    _initializeDefaultVersion() {
        // Tenta criar uma versão inicial baseada nos dados atuais (se houver)
        // Ou apenas define uma versão "main"/"latest"
        const initialVersionId = "main_v1";
        const existingData = inMemoryDb_1.db.getAllEquipment(); // Assume que dados iniciais já foram carregados
        const existingAnnotations = inMemoryDb_1.db.getAllAnnotations();
        if (existingData.length > 0 || existingAnnotations.length > 0) {
            this.createVersion(initialVersionId, "Versão Inicial", "Versão carregada inicialmente");
            this.setActiveVersionId(initialVersionId);
        }
        else {
            // Se não houver dados, apenas cria a entrada de metadados
            const initialVersion = {
                id: initialVersionId,
                name: "Versão Principal",
                description: "Versão principal de trabalho",
                timestamp: new Date(),
                equipmentCount: 0,
                annotationCount: 0
            };
            this._versions.set(initialVersionId, initialVersion);
            this.setActiveVersionId(initialVersionId);
            console.log("Nenhum dado inicial encontrado, versão principal criada.");
        }
    }
    /**
     * Cria uma nova versão conceitual baseada no estado atual dos dados.
     * Na implementação atual, apenas cria metadados e assume que novos dados
     * serão salvos com o novo versionId.
     * Uma implementação mais robusta faria um snapshot (cópia) dos dados.
     *
     * @param name - Nome descritivo da nova versão.
     * @param description - Descrição opcional.
     * @param baseVersionId - ID da versão base (opcional).
     * @returns O ID da nova versão criada ou null em caso de erro.
     */
    createVersion(name, description, baseVersionId) {
        const newVersionId = `v_${Date.now()}`;
        if (this._versions.has(newVersionId)) {
            console.error("Erro ao gerar ID de versão único.");
            return null;
        }
        // Contar equipamentos e anotações atuais (assumindo que representam o estado a ser versionado)
        // Idealmente, filtraríamos pelo baseVersionId se ele fosse fornecido
        const currentEquipment = inMemoryDb_1.db.getAllEquipment();
        const currentAnnotations = inMemoryDb_1.db.getAllAnnotations();
        const newVersion = {
            id: newVersionId,
            name,
            description,
            timestamp: new Date(),
            baseVersionId: baseVersionId || this._activeVersionId || undefined,
            equipmentCount: currentEquipment.length,
            annotationCount: currentAnnotations.length
        };
        this._versions.set(newVersionId, newVersion);
        console.log(`Versão conceitual '${name}' (ID: ${newVersionId}) criada.`);
        // Opcional: Definir a nova versão como ativa?
        // this.setActiveVersionId(newVersionId);
        // IMPORTANTE: Esta função NÃO copia os dados. Ela apenas registra os metadados.
        // A lógica de salvar dados com o versionId correto deve ser implementada
        // nos métodos upsert do InMemoryDatabase ou em uma camada superior.
        return newVersionId;
    }
    /**
     * Cria um snapshot real dos dados para uma nova versão.
     * (Implementação mais complexa e que consome mais memória)
     *
     * @param name - Nome descritivo da nova versão.
     * @param description - Descrição opcional.
     * @returns O ID da nova versão criada ou null em caso de erro.
     */
    createSnapshotVersion(name, description) {
        const newVersionId = `snap_${Date.now()}`;
        if (this._versions.has(newVersionId)) {
            console.error("Erro ao gerar ID de versão único para snapshot.");
            return null;
        }
        const baseVersionId = this._activeVersionId;
        let equipmentCount = 0;
        let annotationCount = 0;
        // 1. Copiar todos os equipamentos da versão ativa (ou todos se não houver ativa)
        const equipmentToSnapshot = baseVersionId
            ? inMemoryDb_1.db.getAllEquipment().filter(eq => eq.versionId === baseVersionId)
            : inMemoryDb_1.db.getAllEquipment();
        equipmentToSnapshot.forEach(eq => {
            // Criar uma cópia profunda e atribuir o novo versionId
            const newEq = JSON.parse(JSON.stringify(eq)); // Cópia profunda simples
            newEq.versionId = newVersionId;
            // O ID do equipamento em si deve permanecer o mesmo?
            // Ou gerar novos IDs para a versão? Manter o mesmo ID parece mais útil.
            inMemoryDb_1.db.upsertEquipment(newEq); // Salva a cópia com novo versionId
            equipmentCount++;
        });
        // 2. Copiar todas as anotações da versão ativa
        const annotationsToSnapshot = baseVersionId
            ? inMemoryDb_1.db.getAllAnnotations().filter(an => an.versionId === baseVersionId)
            : inMemoryDb_1.db.getAllAnnotations();
        annotationsToSnapshot.forEach(an => {
            const newAn = JSON.parse(JSON.stringify(an));
            newAn.versionId = newVersionId;
            inMemoryDb_1.db.upsertAnnotation(newAn);
            annotationCount++;
        });
        // 3. Criar metadados da versão
        const newVersion = {
            id: newVersionId,
            name,
            description,
            timestamp: new Date(),
            baseVersionId: baseVersionId || undefined,
            equipmentCount,
            annotationCount
        };
        this._versions.set(newVersionId, newVersion);
        console.log(`Snapshot da versão '${name}' (ID: ${newVersionId}) criado com ${equipmentCount} equipamentos e ${annotationCount} anotações.`);
        return newVersionId;
    }
    /**
     * Lista todas as versões disponíveis.
     * @returns Array com os metadados de todas as versões.
     */
    listVersions() {
        return Array.from(this._versions.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Obtém os metadados de uma versão específica.
     * @param versionId - ID da versão.
     * @returns Metadados da versão ou undefined se não encontrada.
     */
    getVersionMetadata(versionId) {
        return this._versions.get(versionId);
    }
    /**
     * Define a versão ativa.
     * Outros módulos (Managers, UI) devem observar essa mudança ou consultar
     * o `getActiveVersionId()` para carregar/mostrar os dados corretos.
     * @param versionId - ID da versão a ser ativada.
     * @returns true se a versão foi encontrada e definida como ativa, false caso contrário.
     */
    setActiveVersionId(versionId) {
        var _a;
        if (!this._versions.has(versionId)) {
            console.warn(`Versão com ID ${versionId} não encontrada.`);
            return false;
        }
        this._activeVersionId = versionId;
        console.log(`Versão ativa definida para: ${versionId} (${(_a = this._versions.get(versionId)) === null || _a === void 0 ? void 0 : _a.name})`);
        // TODO: Notificar observadores sobre a mudança de versão ativa?
        // this.onActiveVersionChangeObservable.notifyObservers(versionId);
        return true;
    }
    /**
     * Obtém o ID da versão ativa.
     * @returns O ID da versão ativa ou null se nenhuma estiver ativa.
     */
    getActiveVersionId() {
        return this._activeVersionId;
    }
    /**
     * Obtém os dados dos equipamentos para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados dos equipamentos da versão.
     */
    getEquipmentForVersion(versionId) {
        if (!this._versions.has(versionId))
            return [];
        // Esta é uma simplificação. O DB precisaria de um índice por versionId
        // ou teríamos que filtrar todos os equipamentos.
        return inMemoryDb_1.db.getAllEquipment().filter(eq => eq.versionId === versionId);
    }
    /**
     * Obtém os dados das anotações para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados das anotações da versão.
     */
    getAnnotationsForVersion(versionId) {
        if (!this._versions.has(versionId))
            return [];
        return inMemoryDb_1.db.getAllAnnotations().filter(an => an.versionId === versionId);
    }
    /**
     * Remove uma versão (metadados e, opcionalmente, dados associados).
     * ATENÇÃO: Remover dados pode ser destrutivo e complexo.
     * @param versionId - ID da versão a ser removida.
     * @param removeData - Se true, tenta remover os dados associados a esta versão (PERIGOSO).
     * @returns true se os metadados foram removidos, false caso contrário.
     */
    deleteVersion(versionId, removeData = false) {
        if (!this._versions.has(versionId)) {
            console.warn(`Versão com ID ${versionId} não encontrada.`);
            return false;
        }
        if (versionId === this._activeVersionId) {
            console.warn(`Não é possível remover a versão ativa (${versionId}). Mude a versão ativa primeiro.`);
            return false;
        }
        // TODO: Lógica para impedir a remoção de versões base?
        if (removeData) {
            console.warn(`Removendo dados associados à versão ${versionId}...`);
            const equipmentToRemove = this.getEquipmentForVersion(versionId);
            equipmentToRemove.forEach(eq => inMemoryDb_1.db.deleteEquipment(eq.id)); // CUIDADO: Isso remove o equipamento completamente se o ID for compartilhado!
            const annotationsToRemove = this.getAnnotationsForVersion(versionId);
            annotationsToRemove.forEach(an => inMemoryDb_1.db.deleteAnnotation(an.id));
            console.warn(`Dados da versão ${versionId} removidos (equipamentos: ${equipmentToRemove.length}, anotações: ${annotationsToRemove.length}).`);
        }
        // Remover metadados
        this._versions.delete(versionId);
        console.log(`Metadados da versão ${versionId} removidos.`);
        return true;
    }
}
exports.VersionManager = VersionManager;
// Exportar instância singleton para fácil acesso
exports.versionManager = VersionManager.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.VersionManager = exports.versionManager;
//# sourceMappingURL=versionManager.js.map
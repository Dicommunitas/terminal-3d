import { db, EquipmentDataUnion, AnnotationData } from "../database/inMemoryDb";

/**
 * Interface para metadados de uma versão
 */
export interface VersionMetadata {
    id: string; // ID único da versão (ex: timestamp ou hash)
    name: string; // Nome descritivo da versão
    description?: string; // Descrição opcional
    timestamp: Date; // Data de criação da versão
    baseVersionId?: string; // ID da versão base (se for um delta)
    equipmentCount: number; // Número de equipamentos nesta versão
    annotationCount: number; // Número de anotações nesta versão
}

/**
 * VersionManager - Gerencia diferentes versões do modelo do terminal.
 * 
 * Permite criar, listar e carregar versões conceituais dos dados.
 * Assume que os dados no InMemoryDatabase possuem um campo `versionId`.
 */
export class VersionManager {
    private static _instance: VersionManager;
    private _versions: Map<string, VersionMetadata> = new Map();
    private _activeVersionId: string | null = null; // ID da versão atualmente carregada/ativa

    /**
     * Obtém a instância única do VersionManager (Singleton)
     */
    public static getInstance(): VersionManager {
        if (!VersionManager._instance) {
            VersionManager._instance = new VersionManager();
        }
        return VersionManager._instance;
    }

    /**
     * Construtor privado (Singleton)
     */
    private constructor() {
        this._initializeDefaultVersion();
    }

    /**
     * Inicializa com uma versão padrão (ex: "current" ou "initial")
     */
    private _initializeDefaultVersion(): void {
        // Tenta criar uma versão inicial baseada nos dados atuais (se houver)
        // Ou apenas define uma versão "main"/"latest"
        const initialVersionId = "main_v1";
        const existingData = db.getAllEquipment(); // Assume que dados iniciais já foram carregados
        const existingAnnotations = db.getAllAnnotations();

        if (existingData.length > 0 || existingAnnotations.length > 0) {
            this.createVersion(initialVersionId, "Versão Inicial", "Versão carregada inicialmente");
            this.setActiveVersionId(initialVersionId);
        } else {
            // Se não houver dados, apenas cria a entrada de metadados
             const initialVersion: VersionMetadata = {
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
    public createVersion(name: string, description?: string, baseVersionId?: string): string | null {
        const newVersionId = `v_${Date.now()}`;
        if (this._versions.has(newVersionId)) {
            console.error("Erro ao gerar ID de versão único.");
            return null;
        }

        // Contar equipamentos e anotações atuais (assumindo que representam o estado a ser versionado)
        // Idealmente, filtraríamos pelo baseVersionId se ele fosse fornecido
        const currentEquipment = db.getAllEquipment();
        const currentAnnotations = db.getAllAnnotations();

        const newVersion: VersionMetadata = {
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
    public createSnapshotVersion(name: string, description?: string): string | null {
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
            ? db.getAllEquipment().filter(eq => eq.versionId === baseVersionId) 
            : db.getAllEquipment();
            
        equipmentToSnapshot.forEach(eq => {
            // Criar uma cópia profunda e atribuir o novo versionId
            const newEq = JSON.parse(JSON.stringify(eq)); // Cópia profunda simples
            newEq.versionId = newVersionId;
            // O ID do equipamento em si deve permanecer o mesmo?
            // Ou gerar novos IDs para a versão? Manter o mesmo ID parece mais útil.
            db.upsertEquipment(newEq as EquipmentDataUnion); // Salva a cópia com novo versionId
            equipmentCount++;
        });

        // 2. Copiar todas as anotações da versão ativa
        const annotationsToSnapshot = baseVersionId
            ? db.getAllAnnotations().filter(an => an.versionId === baseVersionId)
            : db.getAllAnnotations();
            
        annotationsToSnapshot.forEach(an => {
            const newAn = JSON.parse(JSON.stringify(an));
            newAn.versionId = newVersionId;
            db.upsertAnnotation(newAn as AnnotationData);
            annotationCount++;
        });

        // 3. Criar metadados da versão
        const newVersion: VersionMetadata = {
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
    public listVersions(): VersionMetadata[] {
        return Array.from(this._versions.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Obtém os metadados de uma versão específica.
     * @param versionId - ID da versão.
     * @returns Metadados da versão ou undefined se não encontrada.
     */
    public getVersionMetadata(versionId: string): VersionMetadata | undefined {
        return this._versions.get(versionId);
    }

    /**
     * Define a versão ativa.
     * Outros módulos (Managers, UI) devem observar essa mudança ou consultar
     * o `getActiveVersionId()` para carregar/mostrar os dados corretos.
     * @param versionId - ID da versão a ser ativada.
     * @returns true se a versão foi encontrada e definida como ativa, false caso contrário.
     */
    public setActiveVersionId(versionId: string): boolean {
        if (!this._versions.has(versionId)) {
            console.warn(`Versão com ID ${versionId} não encontrada.`);
            return false;
        }
        this._activeVersionId = versionId;
        console.log(`Versão ativa definida para: ${versionId} (${this._versions.get(versionId)?.name})`);
        
        // TODO: Notificar observadores sobre a mudança de versão ativa?
        // this.onActiveVersionChangeObservable.notifyObservers(versionId);
        
        return true;
    }

    /**
     * Obtém o ID da versão ativa.
     * @returns O ID da versão ativa ou null se nenhuma estiver ativa.
     */
    public getActiveVersionId(): string | null {
        return this._activeVersionId;
    }
    
    /**
     * Obtém os dados dos equipamentos para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados dos equipamentos da versão.
     */
    public getEquipmentForVersion(versionId: string): EquipmentDataUnion[] {
        if (!this._versions.has(versionId)) return [];
        // Esta é uma simplificação. O DB precisaria de um índice por versionId
        // ou teríamos que filtrar todos os equipamentos.
        return db.getAllEquipment().filter(eq => eq.versionId === versionId);
    }

    /**
     * Obtém os dados das anotações para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados das anotações da versão.
     */
    public getAnnotationsForVersion(versionId: string): AnnotationData[] {
        if (!this._versions.has(versionId)) return [];
        return db.getAllAnnotations().filter(an => an.versionId === versionId);
    }
    
    /**
     * Remove uma versão (metadados e, opcionalmente, dados associados).
     * ATENÇÃO: Remover dados pode ser destrutivo e complexo.
     * @param versionId - ID da versão a ser removida.
     * @param removeData - Se true, tenta remover os dados associados a esta versão (PERIGOSO).
     * @returns true se os metadados foram removidos, false caso contrário.
     */
    public deleteVersion(versionId: string, removeData: boolean = false): boolean {
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
            equipmentToRemove.forEach(eq => db.deleteEquipment(eq.id)); // CUIDADO: Isso remove o equipamento completamente se o ID for compartilhado!
            
            const annotationsToRemove = this.getAnnotationsForVersion(versionId);
            annotationsToRemove.forEach(an => db.deleteAnnotation(an.id));
            console.warn(`Dados da versão ${versionId} removidos (equipamentos: ${equipmentToRemove.length}, anotações: ${annotationsToRemove.length}).`);
        }

        // Remover metadados
        this._versions.delete(versionId);
        console.log(`Metadados da versão ${versionId} removidos.`);
        return true;
    }
}

// Exportar instância singleton para fácil acesso
export const versionManager = VersionManager.getInstance();

// Disponibilizar no escopo global para compatibilidade (opcional)
(window as any).VersionManager = versionManager;

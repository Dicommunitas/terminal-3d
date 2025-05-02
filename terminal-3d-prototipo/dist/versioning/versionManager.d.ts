import { EquipmentDataUnion, AnnotationData } from "../database/inMemoryDb";
/**
 * Interface para metadados de uma versão
 */
export interface VersionMetadata {
    id: string;
    name: string;
    description?: string;
    timestamp: Date;
    baseVersionId?: string;
    equipmentCount: number;
    annotationCount: number;
}
/**
 * VersionManager - Gerencia diferentes versões do modelo do terminal.
 *
 * Permite criar, listar e carregar versões conceituais dos dados.
 * Assume que os dados no InMemoryDatabase possuem um campo `versionId`.
 */
export declare class VersionManager {
    private static _instance;
    private _versions;
    private _activeVersionId;
    /**
     * Obtém a instância única do VersionManager (Singleton)
     */
    static getInstance(): VersionManager;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicializa com uma versão padrão (ex: "current" ou "initial")
     */
    private _initializeDefaultVersion;
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
    createVersion(name: string, description?: string, baseVersionId?: string): string | null;
    /**
     * Cria um snapshot real dos dados para uma nova versão.
     * (Implementação mais complexa e que consome mais memória)
     *
     * @param name - Nome descritivo da nova versão.
     * @param description - Descrição opcional.
     * @returns O ID da nova versão criada ou null em caso de erro.
     */
    createSnapshotVersion(name: string, description?: string): string | null;
    /**
     * Lista todas as versões disponíveis.
     * @returns Array com os metadados de todas as versões.
     */
    listVersions(): VersionMetadata[];
    /**
     * Obtém os metadados de uma versão específica.
     * @param versionId - ID da versão.
     * @returns Metadados da versão ou undefined se não encontrada.
     */
    getVersionMetadata(versionId: string): VersionMetadata | undefined;
    /**
     * Define a versão ativa.
     * Outros módulos (Managers, UI) devem observar essa mudança ou consultar
     * o `getActiveVersionId()` para carregar/mostrar os dados corretos.
     * @param versionId - ID da versão a ser ativada.
     * @returns true se a versão foi encontrada e definida como ativa, false caso contrário.
     */
    setActiveVersionId(versionId: string): boolean;
    /**
     * Obtém o ID da versão ativa.
     * @returns O ID da versão ativa ou null se nenhuma estiver ativa.
     */
    getActiveVersionId(): string | null;
    /**
     * Obtém os dados dos equipamentos para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados dos equipamentos da versão.
     */
    getEquipmentForVersion(versionId: string): EquipmentDataUnion[];
    /**
     * Obtém os dados das anotações para uma versão específica.
     * (Assume que o DB pode filtrar por versionId)
     * @param versionId - ID da versão.
     * @returns Array com os dados das anotações da versão.
     */
    getAnnotationsForVersion(versionId: string): AnnotationData[];
    /**
     * Remove uma versão (metadados e, opcionalmente, dados associados).
     * ATENÇÃO: Remover dados pode ser destrutivo e complexo.
     * @param versionId - ID da versão a ser removida.
     * @param removeData - Se true, tenta remover os dados associados a esta versão (PERIGOSO).
     * @returns true se os metadados foram removidos, false caso contrário.
     */
    deleteVersion(versionId: string, removeData?: boolean): boolean;
}
export declare const versionManager: VersionManager;

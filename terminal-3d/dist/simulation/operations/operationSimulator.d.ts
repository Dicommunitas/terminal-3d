import { ValveData } from "../database/inMemoryDb";
import { Observable } from "@babylonjs/core";
/**
 * Interface para o status de uma operação
 */
export interface OperationStatus {
    operationId: string;
    type: string;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    message?: string;
    progress?: number;
    startTime?: Date;
    endTime?: Date;
    relatedEquipment: string[];
}
/**
 * Interface base para parâmetros de operação
 */
interface BaseOperationParams {
    operationId?: string;
}
/**
 * Parâmetros para operação de mudança de estado de válvula
 */
export interface SetValveStateParams extends BaseOperationParams {
    valveId: string;
    newState: ValveData["state"];
}
/**
 * Parâmetros para operação de transferência de produto (simplificada)
 */
export interface TransferProductParams extends BaseOperationParams {
    sourceTankId: string;
    destinationTankId: string;
    pipeId: string;
    valveIds: string[];
    transferRate: number;
    targetVolume?: number;
    duration?: number;
}
/**
 * OperationSimulator - Simula operações discretas no terminal.
 *
 * Permite iniciar, monitorar e cancelar operações como transferências,
 * mudanças de estado, etc., interagindo com o DataSimulator e o DB.
 */
export declare class OperationSimulator {
    private static _instance;
    private _activeOperations;
    private _operationTimers;
    onOperationStatusChangeObservable: Observable<OperationStatus>;
    /**
     * Obtém a instância única do OperationSimulator (Singleton)
     */
    static getInstance(): OperationSimulator;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicia uma operação de mudança de estado de válvula.
     * @param params - Parâmetros da operação.
     * @returns O ID da operação iniciada ou null em caso de erro.
     */
    startSetValveState(params: SetValveStateParams): string | null;
    /**
     * Inicia uma operação de transferência de produto (simplificada).
     * @param params - Parâmetros da operação.
     * @returns O ID da operação iniciada ou null em caso de erro.
     */
    startTransferProduct(params: TransferProductParams): string | null;
    /**
     * Cancela uma operação em andamento.
     * @param operationId - ID da operação a ser cancelada.
     * @returns true se a operação foi encontrada e cancelada, false caso contrário.
     */
    cancelOperation(operationId: string): boolean;
    /**
     * Obtém o status de uma operação específica.
     * @param operationId - ID da operação.
     * @returns O status da operação ou undefined se não encontrada.
     */
    getOperationStatus(operationId: string): OperationStatus | undefined;
    /**
     * Obtém o status de todas as operações ativas.
     * @returns Array com os status das operações ativas.
     */
    getActiveOperations(): OperationStatus[];
    /**
     * Atualiza o status de uma operação e notifica observadores.
     * @param operationId - ID da operação.
     * @param status - Novo status.
     * @param message - Mensagem opcional.
     * @param progress - Progresso opcional (0.0 a 1.0).
     * @private
     */
    private _updateOperationStatus;
    /**
     * Loga um erro ao iniciar uma operação.
     * @param params - Parâmetros da operação.
     * @param errorMessage - Mensagem de erro.
     * @private
     */
    private _logOperationError;
}
export declare const operationSimulator: OperationSimulator;
export {};

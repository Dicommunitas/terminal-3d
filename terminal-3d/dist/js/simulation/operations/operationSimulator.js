"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationSimulator = exports.OperationSimulator = void 0;
const inMemoryDb_1 = require("../../database/inMemoryDb");
const dataSimulator_1 = require("../dataSimulator");
const core_1 = require("@babylonjs/core");
/**
 * OperationSimulator - Simula operações discretas no terminal.
 *
 * Permite iniciar, monitorar e cancelar operações como transferências,
 * mudanças de estado, etc., interagindo com o DataSimulator e o DB.
 */
class OperationSimulator {
    /**
     * Obtém a instância única do OperationSimulator (Singleton)
     */
    static getInstance() {
        if (!OperationSimulator._instance) {
            OperationSimulator._instance = new OperationSimulator();
        }
        return OperationSimulator._instance;
    }
    /**
     * Construtor privado (Singleton)
     */
    constructor() {
        this._activeOperations = new Map();
        this._operationTimers = new Map(); // Para operações baseadas em tempo
        // Observável para notificar sobre mudanças no status das operações
        this.onOperationStatusChangeObservable = new core_1.Observable();
    }
    /**
     * Inicia uma operação de mudança de estado de válvula.
     * @param params - Parâmetros da operação.
     * @returns O ID da operação iniciada ou null em caso de erro.
     */
    startSetValveState(params) {
        const valve = inMemoryDb_1.db.getEquipmentById(params.valveId);
        if (!valve || valve.type !== "valve") {
            console.error(`Válvula com ID ${params.valveId} não encontrada.`);
            return null;
        }
        // Não permitir mudar estado de válvula de retenção
        if (valve.valveType === "check") {
            console.warn(`Não é possível mudar manualmente o estado da válvula de retenção ${params.valveId}.`);
            return null;
        }
        const operationId = params.operationId || `op_valve_${Date.now()}`;
        const status = {
            operationId,
            type: "setValveState",
            status: "running",
            startTime: new Date(),
            relatedEquipment: [params.valveId]
        };
        this._activeOperations.set(operationId, status);
        this.onOperationStatusChangeObservable.notifyObservers(status);
        // Simular um pequeno atraso para a operação
        const delay = 500 + Math.random() * 1000; // 0.5 a 1.5 segundos
        this._operationTimers.set(operationId, setTimeout(() => {
            const currentValve = inMemoryDb_1.db.getEquipmentById(params.valveId);
            if (currentValve) {
                currentValve.state = params.newState;
                inMemoryDb_1.db.upsertEquipment(currentValve);
                // Notificar via DataSimulator também
                dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({
                    equipmentId: params.valveId,
                    property: "state",
                    newValue: params.newState,
                    timestamp: new Date()
                });
                // Atualizar status da operação para concluído
                const finalStatus = this._activeOperations.get(operationId);
                if (finalStatus) {
                    finalStatus.status = "completed";
                    finalStatus.endTime = new Date();
                    this.onOperationStatusChangeObservable.notifyObservers(finalStatus);
                    this._activeOperations.delete(operationId);
                    this._operationTimers.delete(operationId);
                    console.log(`Operação ${operationId} (SetValveState ${params.valveId} to ${params.newState}) concluída.`);
                }
            }
            else {
                // Falha se a válvula não for encontrada no final
                this._updateOperationStatus(operationId, "failed", "Válvula não encontrada durante a execução.");
            }
        }, delay));
        console.log(`Operação ${operationId} (SetValveState ${params.valveId} to ${params.newState}) iniciada.`);
        return operationId;
    }
    /**
     * Inicia uma operação de transferência de produto (simplificada).
     * @param params - Parâmetros da operação.
     * @returns O ID da operação iniciada ou null em caso de erro.
     */
    startTransferProduct(params) {
        const sourceTank = inMemoryDb_1.db.getEquipmentById(params.sourceTankId);
        const destTank = inMemoryDb_1.db.getEquipmentById(params.destinationTankId);
        const pipe = inMemoryDb_1.db.getEquipmentById(params.pipeId);
        if (!sourceTank || sourceTank.type !== "tank")
            return this._logOperationError(params, `Tanque de origem ${params.sourceTankId} não encontrado.`);
        if (!destTank || destTank.type !== "tank")
            return this._logOperationError(params, `Tanque de destino ${params.destinationTankId} não encontrado.`);
        if (!pipe || pipe.type !== "pipe")
            return this._logOperationError(params, `Tubulação ${params.pipeId} não encontrada.`);
        if (params.transferRate <= 0)
            return this._logOperationError(params, `Taxa de transferência deve ser positiva.`);
        if (!params.duration && !params.targetVolume)
            return this._logOperationError(params, `Duração ou volume alvo deve ser especificado.`);
        // Verificar se as válvulas no caminho estão abertas
        for (const valveId of params.valveIds) {
            const valve = inMemoryDb_1.db.getEquipmentById(valveId);
            if (!valve || valve.type !== "valve")
                return this._logOperationError(params, `Válvula ${valveId} não encontrada.`);
            if (valve.state !== "open")
                return this._logOperationError(params, `Válvula ${valveId} não está aberta.`);
        }
        const operationId = params.operationId || `op_transfer_${Date.now()}`;
        const status = {
            operationId,
            type: "transferProduct",
            status: "running",
            startTime: new Date(),
            progress: 0,
            relatedEquipment: [params.sourceTankId, params.destinationTankId, params.pipeId, ...params.valveIds]
        };
        this._activeOperations.set(operationId, status);
        this.onOperationStatusChangeObservable.notifyObservers(status);
        let remainingDuration = params.duration; // Segundos
        let transferredVolume = 0;
        const updateInterval = 1000; // Atualizar a cada segundo
        const intervalId = setInterval(() => {
            const currentStatus = this._activeOperations.get(operationId);
            if (!currentStatus || currentStatus.status !== "running") {
                clearInterval(intervalId);
                this._operationTimers.delete(operationId);
                return;
            }
            const currentSourceTank = inMemoryDb_1.db.getEquipmentById(params.sourceTankId);
            const currentDestTank = inMemoryDb_1.db.getEquipmentById(params.destinationTankId);
            const currentPipe = inMemoryDb_1.db.getEquipmentById(params.pipeId);
            if (!currentSourceTank || !currentDestTank || !currentPipe) {
                this._updateOperationStatus(operationId, "failed", "Equipamento não encontrado durante a transferência.");
                clearInterval(intervalId);
                this._operationTimers.delete(operationId);
                return;
            }
            // Verificar válvulas novamente (poderiam ter sido fechadas)
            for (const valveId of params.valveIds) {
                const valve = inMemoryDb_1.db.getEquipmentById(valveId);
                if (!valve || valve.state !== "open") {
                    this._updateOperationStatus(operationId, "failed", `Válvula ${valveId} foi fechada durante a transferência.`);
                    clearInterval(intervalId);
                    this._operationTimers.delete(operationId);
                    // Zerar fluxo na tubulação
                    if (currentPipe.flowRate !== 0) {
                        currentPipe.flowRate = 0;
                        inMemoryDb_1.db.upsertEquipment(currentPipe);
                        dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.pipeId, property: "flowRate", newValue: 0, timestamp: new Date() });
                    }
                    return;
                }
            }
            const volumeThisTick = params.transferRate * (updateInterval / 1000);
            let canTransfer = volumeThisTick;
            // Verificar nível do tanque de origem
            const sourceLevel = currentSourceTank.level || 0;
            const sourceCapacity = currentSourceTank.capacity || 1000; // Assumir capacidade se não definida
            const availableVolumeSource = sourceLevel * sourceCapacity;
            if (availableVolumeSource < volumeThisTick) {
                canTransfer = availableVolumeSource;
            }
            // Verificar espaço no tanque de destino
            const destLevel = currentDestTank.level || 0;
            const destCapacity = currentDestTank.capacity || 1000;
            const availableSpaceDest = (1 - destLevel) * destCapacity;
            if (availableSpaceDest < canTransfer) {
                canTransfer = availableSpaceDest;
            }
            if (canTransfer <= 0) {
                this._updateOperationStatus(operationId, "completed", "Transferência parada (tanque de origem vazio ou destino cheio).", 1.0);
                clearInterval(intervalId);
                this._operationTimers.delete(operationId);
                // Zerar fluxo na tubulação
                if (currentPipe.flowRate !== 0) {
                    currentPipe.flowRate = 0;
                    inMemoryDb_1.db.upsertEquipment(currentPipe);
                    dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.pipeId, property: "flowRate", newValue: 0, timestamp: new Date() });
                }
                return;
            }
            // Atualizar níveis dos tanques
            const newSourceLevel = Math.max(0, sourceLevel - (canTransfer / sourceCapacity));
            const newDestLevel = Math.min(1, destLevel + (canTransfer / destCapacity));
            currentSourceTank.level = parseFloat(newSourceLevel.toFixed(4));
            currentDestTank.level = parseFloat(newDestLevel.toFixed(4));
            inMemoryDb_1.db.upsertEquipment(currentSourceTank);
            inMemoryDb_1.db.upsertEquipment(currentDestTank);
            dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.sourceTankId, property: "level", newValue: currentSourceTank.level, timestamp: new Date() });
            dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.destinationTankId, property: "level", newValue: currentDestTank.level, timestamp: new Date() });
            // Atualizar fluxo na tubulação
            if (currentPipe.flowRate !== params.transferRate) {
                currentPipe.flowRate = params.transferRate;
                inMemoryDb_1.db.upsertEquipment(currentPipe);
                dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.pipeId, property: "flowRate", newValue: params.transferRate, timestamp: new Date() });
            }
            transferredVolume += canTransfer;
            // Atualizar progresso
            let progress = 0;
            if (params.duration) {
                progress = (params.duration - (remainingDuration || params.duration) + (updateInterval / 1000)) / params.duration;
            }
            else if (params.targetVolume) {
                progress = transferredVolume / params.targetVolume;
            }
            currentStatus.progress = Math.min(1, progress);
            this.onOperationStatusChangeObservable.notifyObservers(currentStatus);
            // Verificar condição de término
            let finished = false;
            if (remainingDuration !== undefined) {
                remainingDuration -= (updateInterval / 1000);
                if (remainingDuration <= 0) {
                    finished = true;
                }
            }
            if (params.targetVolume && transferredVolume >= params.targetVolume) {
                finished = true;
            }
            if (finished) {
                this._updateOperationStatus(operationId, "completed", "Transferência concluída.", 1.0);
                clearInterval(intervalId);
                this._operationTimers.delete(operationId);
                // Zerar fluxo na tubulação
                if (currentPipe.flowRate !== 0) {
                    currentPipe.flowRate = 0;
                    inMemoryDb_1.db.upsertEquipment(currentPipe);
                    dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: params.pipeId, property: "flowRate", newValue: 0, timestamp: new Date() });
                }
            }
        }, updateInterval);
        this._operationTimers.set(operationId, intervalId);
        console.log(`Operação ${operationId} (TransferProduct) iniciada.`);
        return operationId;
    }
    /**
     * Cancela uma operação em andamento.
     * @param operationId - ID da operação a ser cancelada.
     * @returns true se a operação foi encontrada e cancelada, false caso contrário.
     */
    cancelOperation(operationId) {
        const status = this._activeOperations.get(operationId);
        if (!status || status.status !== "running") {
            console.warn(`Operação ${operationId} não está em execução ou não foi encontrada.`);
            return false;
        }
        const timer = this._operationTimers.get(operationId);
        if (timer) {
            // Limpar timeout ou interval
            if (status.type === "transferProduct") {
                clearInterval(timer);
            }
            else {
                clearTimeout(timer);
            }
            this._operationTimers.delete(operationId);
        }
        this._updateOperationStatus(operationId, "cancelled", "Operação cancelada pelo usuário.");
        // Reverter efeitos parciais? (Ex: zerar fluxo na tubulação se for transferência)
        if (status.type === "transferProduct") {
            const pipeId = status.relatedEquipment.find(id => id.startsWith("PIPE"));
            if (pipeId) {
                const pipe = inMemoryDb_1.db.getEquipmentById(pipeId);
                if (pipe && pipe.flowRate !== 0) {
                    pipe.flowRate = 0;
                    inMemoryDb_1.db.upsertEquipment(pipe);
                    dataSimulator_1.dataSimulator.onDataUpdateObservable.notifyObservers({ equipmentId: pipeId, property: "flowRate", newValue: 0, timestamp: new Date() });
                }
            }
        }
        return true;
    }
    /**
     * Obtém o status de uma operação específica.
     * @param operationId - ID da operação.
     * @returns O status da operação ou undefined se não encontrada.
     */
    getOperationStatus(operationId) {
        return this._activeOperations.get(operationId);
    }
    /**
     * Obtém o status de todas as operações ativas.
     * @returns Array com os status das operações ativas.
     */
    getActiveOperations() {
        return Array.from(this._activeOperations.values());
    }
    /**
     * Atualiza o status de uma operação e notifica observadores.
     * @param operationId - ID da operação.
     * @param status - Novo status.
     * @param message - Mensagem opcional.
     * @param progress - Progresso opcional (0.0 a 1.0).
     * @private
     */
    _updateOperationStatus(operationId, status, message, progress) {
        const currentStatus = this._activeOperations.get(operationId);
        if (currentStatus) {
            currentStatus.status = status;
            currentStatus.message = message || currentStatus.message;
            currentStatus.progress = progress !== undefined ? progress : currentStatus.progress;
            if (status === "completed" || status === "failed" || status === "cancelled") {
                currentStatus.endTime = new Date();
            }
            this.onOperationStatusChangeObservable.notifyObservers(currentStatus);
            // Remover da lista de ativos se concluída/falha/cancelada
            if (status !== "running" && status !== "pending") {
                this._activeOperations.delete(operationId);
                this._operationTimers.delete(operationId); // Garantir que o timer seja removido
            }
            console.log(`Operação ${operationId} status: ${status} ${message ? `- ${message}` : ""}`);
        }
        else {
            console.warn(`Tentativa de atualizar status de operação não encontrada: ${operationId}`);
        }
    }
    /**
     * Loga um erro ao iniciar uma operação.
     * @param params - Parâmetros da operação.
     * @param errorMessage - Mensagem de erro.
     * @private
     */
    _logOperationError(params, errorMessage) {
        console.error(`Falha ao iniciar operação (${params.operationId || "sem ID"}): ${errorMessage}`);
        // Poderia notificar um status de falha inicial aqui se desejado
        return null;
    }
}
exports.OperationSimulator = OperationSimulator;
// Exportar instância singleton para fácil acesso
exports.operationSimulator = OperationSimulator.getInstance();
// Disponibilizar no escopo global para compatibilidade (opcional)
window.OperationSimulator = exports.operationSimulator;
//# sourceMappingURL=operationSimulator.js.map
import { Observable, Observer } from "@babylonjs/core";
/**
 * Interface para um evento de atualização de dados
 */
export interface DataUpdateEvent {
    equipmentId: string;
    property: string;
    newValue: any;
    timestamp: Date;
}
/**
 * DataSimulator - Simula atualizações de dados em tempo real para equipamentos.
 *
 * Atualiza periodicamente propriedades como nível de tanque, estado de válvula,
 * e notifica observadores sobre as mudanças.
 */
export declare class DataSimulator {
    private static _instance;
    private _intervalId;
    private _simulationSpeed;
    private _isRunning;
    onDataUpdateObservable: Observable<DataUpdateEvent>;
    /**
     * Obtém a instância única do DataSimulator (Singleton)
     */
    static getInstance(): DataSimulator;
    /**
     * Construtor privado (Singleton)
     */
    private constructor();
    /**
     * Inicia a simulação de dados.
     * @param speed - Intervalo da simulação em milissegundos (opcional).
     */
    start(speed?: number): void;
    /**
     * Para a simulação de dados.
     */
    stop(): void;
    /**
     * Verifica se o simulador está em execução.
     * @returns true se o simulador estiver ativo, false caso contrário.
     */
    isRunning(): boolean;
    /**
     * Define a velocidade da simulação.
     * @param speed - Novo intervalo em milissegundos.
     */
    setSpeed(speed: number): void;
    /**
     * Função principal que simula as atualizações.
     * Chamada periodicamente pelo setInterval.
     */
    private _simulateUpdates;
    /**
     * Simula a atualização de um tanque (nível).
     * @param tank - Dados do tanque.
     */
    private _simulateTankUpdate;
    /**
     * Simula a atualização de uma válvula (estado).
     * @param valve - Dados da válvula.
     */
    private _simulateValveUpdate;
    /**
     * Simula a atualização de uma tubulação (fluxo ou pressão - exemplo).
     * @param pipe - Dados da tubulação.
     */
    private _simulatePipeUpdate;
    /**
     * Notifica os observadores sobre uma atualização de dados.
     * @param equipmentId - ID do equipamento atualizado.
     * @param property - Nome da propriedade atualizada.
     * @param newValue - Novo valor da propriedade.
     */
    private _notifyUpdate;
    /**
     * Adiciona um observador para atualizações de dados.
     * @param observer - Função ou objeto Observer a ser chamado.
     * @returns O Observer adicionado.
     */
    addObserver(observer: (eventData: DataUpdateEvent) => void): Observer<DataUpdateEvent>;
    /**
     * Remove um observador.
     * @param observer - O Observer a ser removido.
     * @returns true se removido com sucesso, false caso contrário.
     */
    removeObserver(observer: Observer<DataUpdateEvent>): boolean;
}
export declare const dataSimulator: DataSimulator;

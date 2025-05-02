import { ValveState } from "../models/valves"; // Import ValveState
import { db, TankData, ValveData, PipeData, EquipmentDataUnion } from "../database/inMemoryDb";
import { Observable, Observer, Nullable } from "@babylonjs/core"; // Add Nullable import

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
export class DataSimulator {
    private static _instance: DataSimulator;
    private _intervalId: Nullable<NodeJS.Timeout> = null;
    private _simulationSpeed: number = 5000; // Intervalo em milissegundos (5 segundos)
    private _isRunning: boolean = false;

    // Observável para notificar sobre atualizações de dados
    public onDataUpdateObservable: Observable<DataUpdateEvent> = new Observable<DataUpdateEvent>();

    /**
     * Obtém a instância única do DataSimulator (Singleton)
     */
    public static getInstance(): DataSimulator {
        if (!DataSimulator._instance) {
            DataSimulator._instance = new DataSimulator();
        }
        return DataSimulator._instance;
    }

    /**
     * Construtor privado (Singleton)
     */
    private constructor() {}

    /**
     * Inicia a simulação de dados.
     * @param speed - Intervalo da simulação em milissegundos (opcional).
     */
    public start(speed?: number): void {
        if (this._isRunning) {
            console.warn("Simulador já está em execução.");
            return;
        }

        if (speed) {
            this._simulationSpeed = speed;
        }

        this._isRunning = true;
        this._intervalId = setInterval(() => this._simulateUpdates(), this._simulationSpeed);
        console.log(`Simulador de dados iniciado com intervalo de ${this._simulationSpeed}ms.`);
    }

    /**
     * Para a simulação de dados.
     */
    public stop(): void {
        if (!this._isRunning || !this._intervalId) {
            console.warn("Simulador não está em execução.");
            return;
        }

        clearInterval(this._intervalId);
        this._intervalId = null;
        this._isRunning = false;
        console.log("Simulador de dados parado.");
    }

    /**
     * Verifica se o simulador está em execução.
     * @returns true se o simulador estiver ativo, false caso contrário.
     */
    public isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * Define a velocidade da simulação.
     * @param speed - Novo intervalo em milissegundos.
     */
    public setSpeed(speed: number): void {
        if (speed <= 0) {
            console.error("Velocidade da simulação deve ser maior que zero.");
            return;
        }
        this._simulationSpeed = speed;
        if (this._isRunning) {
            // Reinicia o intervalo com a nova velocidade
            this.stop();
            this.start();
        }
        console.log(`Velocidade do simulador definida para ${this._simulationSpeed}ms.`);
    }

    /**
     * Função principal que simula as atualizações.
     * Chamada periodicamente pelo setInterval.
     */
    private _simulateUpdates(): void {
        if (!this._isRunning) return;

        const allEquipment = db.getAllEquipment();
        if (allEquipment.length === 0) return;

        // Simular atualizações para alguns equipamentos aleatórios
        const numUpdates = Math.min(5, Math.ceil(allEquipment.length * 0.1)); // Atualizar até 5 ou 10% dos equipamentos

        for (let i = 0; i < numUpdates; i++) {
            const randomIndex = Math.floor(Math.random() * allEquipment.length);
            const equipment = allEquipment[randomIndex];

            switch (equipment.type) {
                case "tank":
                    this._simulateTankUpdate(equipment as TankData);
                    break;
                case "valve":
                    this._simulateValveUpdate(equipment as ValveData);
                    break;
                case "pipe":
                    this._simulatePipeUpdate(equipment as PipeData);
                    break;
                // Adicionar outros tipos se necessário
            }
        }
    }

    /**
     * Simula a atualização de um tanque (nível).
     * @param tank - Dados do tanque.
     */
    private _simulateTankUpdate(tank: TankData): void {
        const currentLevel = tank.level || 0;
        let change = (Math.random() - 0.45) * 0.1; // Pequena variação aleatória (-0.045 a +0.055)
        let newLevel = Math.max(0, Math.min(1, currentLevel + change)); // Manter entre 0 e 1
        newLevel = parseFloat(newLevel.toFixed(3)); // Arredondar

        if (newLevel !== currentLevel) {
            tank.level = newLevel;
            db.upsertEquipment(tank); // Atualizar no DB
            this._notifyUpdate(tank.id, "level", newLevel);
        }
    }

    /**
     * Simula a atualização de uma válvula (estado).
     * @param valve - Dados da válvula.
     */
    private _simulateValveUpdate(valve: ValveData): void {
        // Não simular mudança de estado para válvulas de retenção
        if (valve.valveType === "check") return;

        const possibleStates = ["open", "closed", "partial"];
        // Pequena chance de mudar para manutenção ou falha
        if (Math.random() < 0.02) possibleStates.push("maintenance");
        if (Math.random() < 0.01) possibleStates.push("fault");
        
        const currentState = valve.state || "closed";
        let newState = currentState;

        // Chance de mudar de estado
        if (Math.random() < 0.1) { // 10% de chance de mudar
            const availableStates = possibleStates.filter(s => s !== currentState);
            if (availableStates.length > 0) {
                newState = availableStates[Math.floor(Math.random() * availableStates.length)] as ValveState;
            }
        }

        if (newState !== currentState) {
            valve.state = newState;
            db.upsertEquipment(valve); // Atualizar no DB
            this._notifyUpdate(valve.id, "state", newState);
        }
    }

    /**
     * Simula a atualização de uma tubulação (fluxo ou pressão - exemplo).
     * @param pipe - Dados da tubulação.
     */
    private _simulatePipeUpdate(pipe: PipeData): void {
        const currentFlow = pipe.flowRate || 0;
        let change = (Math.random() - 0.5) * 10; // Variação aleatória de fluxo
        let newFlow = Math.max(0, currentFlow + change);
        newFlow = parseFloat(newFlow.toFixed(2));

        if (newFlow !== currentFlow) {
            pipe.flowRate = newFlow;
            db.upsertEquipment(pipe); // Atualizar no DB
            this._notifyUpdate(pipe.id, "flowRate", newFlow);
        }
        
        // Simular pressão (exemplo)
        const currentPressure = pipe.pressure || 5;
        let pressureChange = (Math.random() - 0.5) * 0.5;
        let newPressure = Math.max(0, currentPressure + pressureChange);
        newPressure = parseFloat(newPressure.toFixed(2));
        
        if (newPressure !== currentPressure) {
            pipe.pressure = newPressure;
            db.upsertEquipment(pipe); // Atualizar no DB
            this._notifyUpdate(pipe.id, "pressure", newPressure);
        }
    }

    /**
     * Notifica os observadores sobre uma atualização de dados.
     * @param equipmentId - ID do equipamento atualizado.
     * @param property - Nome da propriedade atualizada.
     * @param newValue - Novo valor da propriedade.
     */
    private _notifyUpdate(equipmentId: string, property: string, newValue: any): void {
        const eventData: DataUpdateEvent = {
            equipmentId,
            property,
            newValue,
            timestamp: new Date()
        };
        this.onDataUpdateObservable.notifyObservers(eventData);
        // console.log(`Data Update: ${equipmentId} - ${property} = ${newValue}`);
    }

    /**
     * Adiciona um observador para atualizações de dados.
     * @param observer - Função ou objeto Observer a ser chamado.
     * @returns O Observer adicionado.
     */
    public addObserver(observer: (eventData: DataUpdateEvent) => void): Observer<DataUpdateEvent> {
        return this.onDataUpdateObservable.add(observer);
    }

    /**
     * Remove um observador.
     * @param observer - O Observer a ser removido.
     * @returns true se removido com sucesso, false caso contrário.
     */
    public removeObserver(observer: Observer<DataUpdateEvent>): boolean {
        return this.onDataUpdateObservable.remove(observer);
    }
}

// Exportar instância singleton para fácil acesso
export const dataSimulator = DataSimulator.getInstance();

// Disponibilizar no escopo global para compatibilidade (opcional)
(window as any).DataSimulator = dataSimulator;


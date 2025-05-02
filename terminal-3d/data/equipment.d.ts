import { TankData, PipeData, ValveData, LoadingAreaData } from "../js/database/inMemoryDb";
/**
 * EquipmentData - Dados simulados de equipamentos
 *
 * Este arquivo contém dados simulados para os equipamentos do terminal,
 * incluindo tanques, tubulações, válvulas e áreas de carregamento.
 * Em um ambiente de produção, estes dados viriam de uma API ou banco de dados.
 */
interface InitialEquipmentData {
    tanks: TankData[];
    pipes: PipeData[];
    valves: ValveData[];
    loadingAreas: LoadingAreaData[];
}
export declare const EquipmentData: InitialEquipmentData;
export {};

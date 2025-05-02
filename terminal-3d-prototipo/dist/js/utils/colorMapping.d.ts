import { Scene, Color3, AbstractMesh, TransformNode } from "@babylonjs/core";
interface LegendItem {
    label: string;
    color: Color3;
}
/**
 * ColorMapper - Gerencia a aplicação de esquemas de cores aos objetos da cena.
 * Refatorado para usar o padrão Strategy através do ColorContext.
 * Esta classe agora pode ser simplificada ou removida se ColorContext for usado diretamente.
 * Mantendo por enquanto para compatibilidade e possível refatoração futura.
 */
export declare class ColorMapper {
    private _scene;
    private _currentMode;
    private _colorSchemes;
    private _managedObjects;
    constructor(scene: Scene);
    /**
     * Define os objetos que serão gerenciados pelo ColorMapper.
     * @param objects - Array de meshes ou transform nodes.
     */
    setManagedObjects(objects: (AbstractMesh | TransformNode)[]): void;
    /**
     * Aplica um modo de coloração aos objetos gerenciados.
     * IMPORTANTE: Esta função será substituída pelo ColorContext.applyColorMode().
     * @param mode - Modo de coloração ('default', 'product', 'status', 'temperature').
     */
    applyColorMode(mode: string): void;
    /**
     * Colorize um objeto específico com base no modo.
     * @param objectNode - Nó do objeto a ser colorido.
     * @param mode - Modo de coloração.
     */
    private _colorizeObject;
    private _getColorForProduct;
    private _getColorForStatus;
    private _getColorForTemperature;
    private _getDefaultColor;
    /**
     * Aplica uma cor a todos os meshes relevantes de um nó.
     * @param node - Nó pai.
     * @param color - Cor a aplicar.
     */
    private _applyColorToNode;
    /**
     * Restaura a coloração de um ou todos os objetos para o modo atual.
     * @param objectId - ID do objeto (opcional).
     */
    restoreColors(objectId?: string): void;
    private _findObjectById;
    getCurrentMode(): string;
    getLegendForCurrentMode(): LegendItem[];
    private _getStatusLabel;
    private _getEquipmentTypeLabel;
    dispose(): void;
}
export {};

import { Scene, Color3, AbstractMesh, TransformNode, PBRMaterial, StandardMaterial, Nullable } from "@babylonjs/core";

// Interface para metadados (pode ser movida para um arquivo compartilhado)
interface EquipmentMetadata {
    id: string;
    type: string;
    equipmentType?: string;
    state?: string;
    data?: {
        product?: string;
        status?: string;
        temperature?: number;
        // Outros dados...
    };
    // Outros metadados...
}

// Interface para esquemas de cores
interface ColorScheme {
    [key: string]: Color3 | any; // Permite cores ou estruturas mais complexas como temperature
}

// Interface para legenda
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
export class ColorMapper {
    private _scene: Scene;
    private _currentMode: string = 'default';
    private _colorSchemes: { [mode: string]: ColorScheme } = {
        product: {
            'Diesel S10': new Color3(0.8, 0.7, 0.1),
            'Diesel Marítimo': new Color3(0.7, 0.6, 0.1),
            'Gasolina': new Color3(0.8, 0.4, 0.1),
            'Etanol': new Color3(0.1, 0.8, 0.3),
            'Óleo Lubrificante': new Color3(0.5, 0.3, 0.1),
            'GLP': new Color3(0.3, 0.7, 0.7),
            'Água': new Color3(0.1, 0.5, 0.8),
            'Vapor': new Color3(0.8, 0.8, 0.8),
            'Querosene': new Color3(0.7, 0.7, 0.7),
            'default': new Color3(0.5, 0.5, 0.5)
        },
        status: {
            'operational': new Color3(0.1, 0.7, 0.1),
            'maintenance': new Color3(0.7, 0.7, 0.1),
            'fault': new Color3(0.7, 0.1, 0.1),
            'offline': new Color3(0.5, 0.5, 0.5),
            'standby': new Color3(0.1, 0.5, 0.8),
            // Mapeamento de estados de válvula para status
            'open': new Color3(0.1, 0.7, 0.1), // Verde (operacional)
            'closed': new Color3(0.7, 0.1, 0.1), // Vermelho (operacional, mas fechado)
            'partial': new Color3(0.7, 0.7, 0.1), // Amarelo (operacional, parcial)
            'default': new Color3(0.3, 0.3, 0.3)
        },
        temperature: {
            ranges: [
                { max: 0, color: new Color3(0.0, 0.0, 0.8) },
                { max: 25, color: new Color3(0.0, 0.5, 0.8) },
                { max: 50, color: new Color3(0.0, 0.8, 0.0) },
                { max: 75, color: new Color3(0.8, 0.8, 0.0) },
                { max: 100, color: new Color3(0.8, 0.4, 0.0) },
                { max: Infinity, color: new Color3(0.8, 0.0, 0.0) }
            ],
            default: new Color3(0.5, 0.5, 0.5)
        },
        default: {
            'tank': new Color3(0.0, 0.47, 0.75),
            'pipe': new Color3(0.5, 0.5, 0.5),
            'valve': new Color3(0.7, 0.1, 0.1),
            'loadingArea': new Color3(0.8, 0.5, 0.2),
            'default': new Color3(0.3, 0.3, 0.3)
        }
    };

    // Referência aos objetos gerenciados (deve ser preenchido externamente)
    private _managedObjects: (AbstractMesh | TransformNode)[] = [];

    constructor(scene: Scene) {
        this._scene = scene;
        console.log("ColorMapper inicializado.");
    }

    /**
     * Define os objetos que serão gerenciados pelo ColorMapper.
     * @param objects - Array de meshes ou transform nodes.
     */
    public setManagedObjects(objects: (AbstractMesh | TransformNode)[]): void {
        this._managedObjects = objects;
    }

    /**
     * Aplica um modo de coloração aos objetos gerenciados.
     * IMPORTANTE: Esta função será substituída pelo ColorContext.applyColorMode().
     * @param mode - Modo de coloração ('default', 'product', 'status', 'temperature').
     */
    public applyColorMode(mode: string): void {
        if (!this._colorSchemes[mode]) {
            console.warn(`Modo de coloração '${mode}' não encontrado. Usando 'default'.`);
            mode = 'default';
        }
        this._currentMode = mode;
        console.log(`[ColorMapper - Deprecated] Aplicando modo de coloração: ${mode}`);

        // Delega para o ColorContext (se inicializado)
        if (typeof ColorContext !== 'undefined' && ColorContext.setStrategy) {
            const strategy = ColorStrategies[mode];
            if (strategy) {
                ColorContext.setStrategy(strategy);
                ColorContext.applyColorMode();
            } else {
                 console.error(`Estratégia para o modo '${mode}' não encontrada.`);
            }
        } else {
            // Fallback para lógica antiga (deve ser removido após integração)
            this._managedObjects.forEach(obj => this._colorizeObject(obj, mode));
        }
    }

    /**
     * Colorize um objeto específico com base no modo.
     * @param objectNode - Nó do objeto a ser colorido.
     * @param mode - Modo de coloração.
     */
    private _colorizeObject(objectNode: AbstractMesh | TransformNode, mode: string): void {
        const metadata = (objectNode as any).metadata as EquipmentMetadata | undefined;
        if (!metadata) return;

        let color: Nullable<Color3> = null;

        switch (mode) {
            case 'product':
                color = this._getColorForProduct(metadata.data?.product);
                break;
            case 'status':
                // Prioriza status, depois state (para válvulas)
                color = this._getColorForStatus(metadata.data?.status ?? metadata.state);
                break;
            case 'temperature':
                color = this._getColorForTemperature(metadata.data?.temperature);
                break;
            case 'default':
            default:
                color = this._getDefaultColor(metadata.type);
                break;
        }

        color = color || this._getDefaultColor(metadata.type); // Fallback para cor padrão do tipo
        this._applyColorToNode(objectNode, color);
    }

    private _getColorForProduct(productName?: string): Nullable<Color3> {
        const scheme = this._colorSchemes.product;
        return productName ? (scheme[productName] as Color3 || scheme.default as Color3) : scheme.default as Color3;
    }

    private _getColorForStatus(status?: string): Nullable<Color3> {
        const scheme = this._colorSchemes.status;
        return status ? (scheme[status.toLowerCase()] as Color3 || scheme.default as Color3) : scheme.default as Color3;
    }

    private _getColorForTemperature(temperature?: number): Nullable<Color3> {
        const scheme = this._colorSchemes.temperature;
        if (temperature === undefined) {
            return scheme.default as Color3;
        }
        const ranges = scheme.ranges as { max: number, color: Color3 }[];
        for (let i = 0; i < ranges.length; i++) {
            if (temperature <= ranges[i].max) {
                return ranges[i].color;
            }
        }
        return scheme.default as Color3;
    }

    private _getDefaultColor(equipmentType?: string): Color3 {
        const scheme = this._colorSchemes.default;
        return equipmentType ? (scheme[equipmentType.toLowerCase()] as Color3 || scheme.default as Color3) : scheme.default as Color3;
    }

    /**
     * Aplica uma cor a todos os meshes relevantes de um nó.
     * @param node - Nó pai.
     * @param color - Cor a aplicar.
     */
    private _applyColorToNode(node: AbstractMesh | TransformNode, color: Color3): void {
        const meshesToColor = (node instanceof AbstractMesh) ? [node] : node.getChildMeshes(false);

        meshesToColor.forEach(mesh => {
            // Aplicar apenas às malhas principais, evitar indicadores etc.
            if (mesh.name.includes('_body') || mesh.name.includes('_segment_') || 
               (!mesh.name.includes('_level') && !mesh.name.includes('_indicator') && !mesh.name.includes('_state') && !mesh.name.includes('_wheel') && !mesh.name.includes('_cap') && !mesh.name.includes('_arrow') && !mesh.name.includes('_support') && !mesh.name.includes('_platform') && !mesh.name.includes('_rail') && !mesh.name.includes('_step') && !mesh.name.includes('_conn') && !mesh.name.includes('_valve'))) 
            {
                if (mesh.material) {
                    if (mesh.material instanceof PBRMaterial) {
                        mesh.material.albedoColor = color;
                    } else if (mesh.material instanceof StandardMaterial) {
                        mesh.material.diffuseColor = color;
                    }
                    // Adicionar lógica para MultiMaterial se necessário
                }
            }
        });
    }

    /**
     * Restaura a coloração de um ou todos os objetos para o modo atual.
     * @param objectId - ID do objeto (opcional).
     */
    public restoreColors(objectId?: string): void {
        console.log(`[ColorMapper - Deprecated] Restaurando cores para ${objectId || 'todos os objetos'}`);
        if (objectId) {
            const objectNode = this._findObjectById(objectId);
            if (objectNode) {
                this._colorizeObject(objectNode, this._currentMode);
            }
        } else {
            this.applyColorMode(this._currentMode); // Reaplica o modo atual a todos
        }
    }

    private _findObjectById(objectId: string): Nullable<AbstractMesh | TransformNode> {
        return this._managedObjects.find(obj => (obj as any).metadata?.id === objectId) || null;
    }

    public getCurrentMode(): string {
        return this._currentMode;
    }

    public getLegendForCurrentMode(): LegendItem[] {
        const legend: LegendItem[] = [];
        let scheme: ColorScheme;

        switch (this._currentMode) {
            case 'product':
                scheme = this._colorSchemes.product;
                Object.keys(scheme).forEach(key => {
                    if (key !== 'default') legend.push({ label: key, color: scheme[key] as Color3 });
                });
                break;
            case 'status':
                scheme = this._colorSchemes.status;
                 Object.keys(scheme).forEach(key => {
                    if (key !== 'default') legend.push({ label: this._getStatusLabel(key), color: scheme[key] as Color3 });
                });
                break;
            case 'temperature':
                const ranges = this._colorSchemes.temperature.ranges as { max: number, color: Color3 }[];
                ranges.forEach((range, i) => {
                    const min = i === 0 ? -Infinity : ranges[i - 1].max;
                    const max = range.max;
                    let label = '';
                    if (min === -Infinity) label = `< ${max}°C`;
                    else if (max === Infinity) label = `> ${min}°C`;
                    else label = `${min}°C - ${max}°C`;
                    legend.push({ label: label, color: range.color });
                });
                break;
            case 'default':
            default:
                scheme = this._colorSchemes.default;
                 Object.keys(scheme).forEach(key => {
                    if (key !== 'default') legend.push({ label: this._getEquipmentTypeLabel(key), color: scheme[key] as Color3 });
                });
                break;
        }
        return legend;
    }

    private _getStatusLabel(status: string): string {
        const statusLabels: { [key: string]: string } = {
            'operational': 'Operacional',
            'maintenance': 'Em Manutenção',
            'fault': 'Com Falha',
            'offline': 'Desativado',
            'standby': 'Em Espera',
            'open': 'Aberta',
            'closed': 'Fechada',
            'partial': 'Parcialmente Aberta',
            'available': 'Disponível',
            'loading': 'Em Carregamento'
        };
        return statusLabels[status] || status;
    }

    private _getEquipmentTypeLabel(type: string): string {
        const typeLabels: { [key: string]: string } = {
            'tank': 'Tanques',
            'pipe': 'Tubulações',
            'valve': 'Válvulas',
            'loadingArea': 'Áreas de Carregamento'
        };
        return typeLabels[type] || type;
    }
    
    public dispose(): void {
        this._managedObjects = [];
        console.log("ColorMapper descartado.");
    }
}

// Declaração global para ColorContext e ColorStrategies (definidos em colorStrategy.js)
// Idealmente, estes seriam importados se colorStrategy.js também fosse migrado para TS.
declare var ColorContext: any;
declare var ColorStrategies: any;


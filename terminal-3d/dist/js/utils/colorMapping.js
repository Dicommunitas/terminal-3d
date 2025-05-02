"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorMapper = void 0;
const core_1 = require("@babylonjs/core");
/**
 * ColorMapper - Gerencia a aplicação de esquemas de cores aos objetos da cena.
 * Refatorado para usar o padrão Strategy através do ColorContext.
 * Esta classe agora pode ser simplificada ou removida se ColorContext for usado diretamente.
 * Mantendo por enquanto para compatibilidade e possível refatoração futura.
 */
class ColorMapper {
    constructor(scene) {
        this._currentMode = 'default';
        this._colorSchemes = {
            product: {
                'Diesel S10': new core_1.Color3(0.8, 0.7, 0.1),
                'Diesel Marítimo': new core_1.Color3(0.7, 0.6, 0.1),
                'Gasolina': new core_1.Color3(0.8, 0.4, 0.1),
                'Etanol': new core_1.Color3(0.1, 0.8, 0.3),
                'Óleo Lubrificante': new core_1.Color3(0.5, 0.3, 0.1),
                'GLP': new core_1.Color3(0.3, 0.7, 0.7),
                'Água': new core_1.Color3(0.1, 0.5, 0.8),
                'Vapor': new core_1.Color3(0.8, 0.8, 0.8),
                'Querosene': new core_1.Color3(0.7, 0.7, 0.7),
                'default': new core_1.Color3(0.5, 0.5, 0.5)
            },
            status: {
                'operational': new core_1.Color3(0.1, 0.7, 0.1),
                'maintenance': new core_1.Color3(0.7, 0.7, 0.1),
                'fault': new core_1.Color3(0.7, 0.1, 0.1),
                'offline': new core_1.Color3(0.5, 0.5, 0.5),
                'standby': new core_1.Color3(0.1, 0.5, 0.8),
                // Mapeamento de estados de válvula para status
                'open': new core_1.Color3(0.1, 0.7, 0.1), // Verde (operacional)
                'closed': new core_1.Color3(0.7, 0.1, 0.1), // Vermelho (operacional, mas fechado)
                'partial': new core_1.Color3(0.7, 0.7, 0.1), // Amarelo (operacional, parcial)
                'default': new core_1.Color3(0.3, 0.3, 0.3)
            },
            temperature: {
                ranges: [
                    { max: 0, color: new core_1.Color3(0.0, 0.0, 0.8) },
                    { max: 25, color: new core_1.Color3(0.0, 0.5, 0.8) },
                    { max: 50, color: new core_1.Color3(0.0, 0.8, 0.0) },
                    { max: 75, color: new core_1.Color3(0.8, 0.8, 0.0) },
                    { max: 100, color: new core_1.Color3(0.8, 0.4, 0.0) },
                    { max: Infinity, color: new core_1.Color3(0.8, 0.0, 0.0) }
                ],
                default: new core_1.Color3(0.5, 0.5, 0.5)
            },
            default: {
                'tank': new core_1.Color3(0.0, 0.47, 0.75),
                'pipe': new core_1.Color3(0.5, 0.5, 0.5),
                'valve': new core_1.Color3(0.7, 0.1, 0.1),
                'loadingArea': new core_1.Color3(0.8, 0.5, 0.2),
                'default': new core_1.Color3(0.3, 0.3, 0.3)
            }
        };
        // Referência aos objetos gerenciados (deve ser preenchido externamente)
        this._managedObjects = [];
        this._scene = scene;
        console.log("ColorMapper inicializado.");
    }
    /**
     * Define os objetos que serão gerenciados pelo ColorMapper.
     * @param objects - Array de meshes ou transform nodes.
     */
    setManagedObjects(objects) {
        this._managedObjects = objects;
    }
    /**
     * Aplica um modo de coloração aos objetos gerenciados.
     * IMPORTANTE: Esta função será substituída pelo ColorContext.applyColorMode().
     * @param mode - Modo de coloração ('default', 'product', 'status', 'temperature').
     */
    applyColorMode(mode) {
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
            }
            else {
                console.error(`Estratégia para o modo '${mode}' não encontrada.`);
            }
        }
        else {
            // Fallback para lógica antiga (deve ser removido após integração)
            this._managedObjects.forEach(obj => this._colorizeObject(obj, mode));
        }
    }
    /**
     * Colorize um objeto específico com base no modo.
     * @param objectNode - Nó do objeto a ser colorido.
     * @param mode - Modo de coloração.
     */
    _colorizeObject(objectNode, mode) {
        var _a, _b, _c, _d;
        const metadata = objectNode.metadata;
        if (!metadata)
            return;
        let color = null;
        switch (mode) {
            case 'product':
                color = this._getColorForProduct((_a = metadata.data) === null || _a === void 0 ? void 0 : _a.product);
                break;
            case 'status':
                // Prioriza status, depois state (para válvulas)
                color = this._getColorForStatus((_c = (_b = metadata.data) === null || _b === void 0 ? void 0 : _b.status) !== null && _c !== void 0 ? _c : metadata.state);
                break;
            case 'temperature':
                color = this._getColorForTemperature((_d = metadata.data) === null || _d === void 0 ? void 0 : _d.temperature);
                break;
            case 'default':
            default:
                color = this._getDefaultColor(metadata.type);
                break;
        }
        color = color || this._getDefaultColor(metadata.type); // Fallback para cor padrão do tipo
        this._applyColorToNode(objectNode, color);
    }
    _getColorForProduct(productName) {
        const scheme = this._colorSchemes.product;
        return productName ? (scheme[productName] || scheme.default) : scheme.default;
    }
    _getColorForStatus(status) {
        const scheme = this._colorSchemes.status;
        return status ? (scheme[status.toLowerCase()] || scheme.default) : scheme.default;
    }
    _getColorForTemperature(temperature) {
        const scheme = this._colorSchemes.temperature;
        if (temperature === undefined) {
            return scheme.default;
        }
        const ranges = scheme.ranges;
        for (let i = 0; i < ranges.length; i++) {
            if (temperature <= ranges[i].max) {
                return ranges[i].color;
            }
        }
        return scheme.default;
    }
    _getDefaultColor(equipmentType) {
        const scheme = this._colorSchemes.default;
        return equipmentType ? (scheme[equipmentType.toLowerCase()] || scheme.default) : scheme.default;
    }
    /**
     * Aplica uma cor a todos os meshes relevantes de um nó.
     * @param node - Nó pai.
     * @param color - Cor a aplicar.
     */
    _applyColorToNode(node, color) {
        const meshesToColor = (node instanceof core_1.AbstractMesh) ? [node] : node.getChildMeshes(false);
        meshesToColor.forEach(mesh => {
            // Aplicar apenas às malhas principais, evitar indicadores etc.
            if (mesh.name.includes('_body') || mesh.name.includes('_segment_') ||
                (!mesh.name.includes('_level') && !mesh.name.includes('_indicator') && !mesh.name.includes('_state') && !mesh.name.includes('_wheel') && !mesh.name.includes('_cap') && !mesh.name.includes('_arrow') && !mesh.name.includes('_support') && !mesh.name.includes('_platform') && !mesh.name.includes('_rail') && !mesh.name.includes('_step') && !mesh.name.includes('_conn') && !mesh.name.includes('_valve'))) {
                if (mesh.material) {
                    if (mesh.material instanceof core_1.PBRMaterial) {
                        mesh.material.albedoColor = color;
                    }
                    else if (mesh.material instanceof core_1.StandardMaterial) {
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
    restoreColors(objectId) {
        console.log(`[ColorMapper - Deprecated] Restaurando cores para ${objectId || 'todos os objetos'}`);
        if (objectId) {
            const objectNode = this._findObjectById(objectId);
            if (objectNode) {
                this._colorizeObject(objectNode, this._currentMode);
            }
        }
        else {
            this.applyColorMode(this._currentMode); // Reaplica o modo atual a todos
        }
    }
    _findObjectById(objectId) {
        return this._managedObjects.find(obj => { var _a; return ((_a = obj.metadata) === null || _a === void 0 ? void 0 : _a.id) === objectId; }) || null;
    }
    getCurrentMode() {
        return this._currentMode;
    }
    getLegendForCurrentMode() {
        const legend = [];
        let scheme;
        switch (this._currentMode) {
            case 'product':
                scheme = this._colorSchemes.product;
                Object.keys(scheme).forEach(key => {
                    if (key !== 'default')
                        legend.push({ label: key, color: scheme[key] });
                });
                break;
            case 'status':
                scheme = this._colorSchemes.status;
                Object.keys(scheme).forEach(key => {
                    if (key !== 'default')
                        legend.push({ label: this._getStatusLabel(key), color: scheme[key] });
                });
                break;
            case 'temperature':
                const ranges = this._colorSchemes.temperature.ranges;
                ranges.forEach((range, i) => {
                    const min = i === 0 ? -Infinity : ranges[i - 1].max;
                    const max = range.max;
                    let label = '';
                    if (min === -Infinity)
                        label = `< ${max}°C`;
                    else if (max === Infinity)
                        label = `> ${min}°C`;
                    else
                        label = `${min}°C - ${max}°C`;
                    legend.push({ label: label, color: range.color });
                });
                break;
            case 'default':
            default:
                scheme = this._colorSchemes.default;
                Object.keys(scheme).forEach(key => {
                    if (key !== 'default')
                        legend.push({ label: this._getEquipmentTypeLabel(key), color: scheme[key] });
                });
                break;
        }
        return legend;
    }
    _getStatusLabel(status) {
        const statusLabels = {
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
    _getEquipmentTypeLabel(type) {
        const typeLabels = {
            'tank': 'Tanques',
            'pipe': 'Tubulações',
            'valve': 'Válvulas',
            'loadingArea': 'Áreas de Carregamento'
        };
        return typeLabels[type] || type;
    }
    dispose() {
        this._managedObjects = [];
        console.log("ColorMapper descartado.");
    }
}
exports.ColorMapper = ColorMapper;
//# sourceMappingURL=colorMapping.js.map
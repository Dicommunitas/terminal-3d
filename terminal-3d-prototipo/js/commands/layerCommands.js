/**
 * LayerCommands - Comandos relacionados à visibilidade de camadas
 * 
 * Implementa comandos específicos para mostrar/ocultar camadas de objetos
 * na cena 3D (ex: tanques, tubulações, válvulas).
 */

// --- Comando para Alternar Visibilidade de Camada ---

/**
 * ToggleLayerCommand
 * Comando para mostrar ou ocultar um grupo de objetos (camada).
 * @param {BABYLON.TransformNode} layerGroup - O nó do grupo que representa a camada.
 * @param {boolean} isVisible - O estado de visibilidade desejado (true para mostrar, false para ocultar).
 * @param {string} layerName - Nome da camada (para logging e identificação).
 */
function ToggleLayerCommand(layerGroup, isVisible, layerName) {
    this.layerGroup = layerGroup;
    this.targetVisibility = !!isVisible; // Garantir que seja booleano
    this.layerName = layerName || (layerGroup ? layerGroup.name : "Camada Desconhecida");
    this.previousVisibility = null; // Para armazenar o estado anterior para undo
}

ToggleLayerCommand.prototype.execute = function() {
    if (!this.layerGroup) {
        console.error(`Grupo da camada '${this.layerName}' não definido para ToggleLayerCommand.`);
        return;
    }
    
    // Salvar estado atual para undo
    // Usamos isEnabled() pois controla a renderização do nó e seus filhos
    this.previousVisibility = this.layerGroup.isEnabled();
    
    // Aplicar o estado de visibilidade desejado
    // setEnabled é mais eficiente que iterar e mudar a visibilidade de cada mesh
    this.layerGroup.setEnabled(this.targetVisibility);
    
    console.log(`Comando ToggleLayer executado para '${this.layerName}'. Visibilidade definida para: ${this.targetVisibility}`);
};

ToggleLayerCommand.prototype.undo = function() {
    if (!this.layerGroup || this.previousVisibility === null) {
        console.error(`Não é possível desfazer ToggleLayer para '${this.layerName}': estado anterior não salvo ou grupo inválido.`);
        return;
    }
    
    // Restaurar estado anterior
    this.layerGroup.setEnabled(this.previousVisibility);
    
    console.log(`Comando ToggleLayer desfeito para '${this.layerName}'. Visibilidade restaurada para: ${this.previousVisibility}`);
};

// --- Comando para Definir Múltiplas Camadas (Exemplo) ---
// Pode ser útil para aplicar um preset de visibilidade

/**
 * SetMultipleLayersCommand
 * Comando para definir a visibilidade de múltiplas camadas de uma vez.
 * @param {Array<{group: BABYLON.TransformNode, isVisible: boolean, name: string}>} layersConfig - Array de configurações das camadas.
 */
function SetMultipleLayersCommand(layersConfig) {
    this.layersConfig = layersConfig || [];
    this.previousStates = []; // Para armazenar os estados anteriores para undo
}

SetMultipleLayersCommand.prototype.execute = function() {
    this.previousStates = []; // Limpar estados anteriores antes de executar
    
    this.layersConfig.forEach(config => {
        if (config.group) {
            // Salvar estado atual
            this.previousStates.push({
                group: config.group,
                visibility: config.group.isEnabled()
            });
            // Aplicar novo estado
            config.group.setEnabled(!!config.isVisible);
        } else {
            console.warn(`Grupo inválido para a camada '${config.name}' em SetMultipleLayersCommand.`);
        }
    });
    
    console.log("Comando SetMultipleLayers executado.");
};

SetMultipleLayersCommand.prototype.undo = function() {
    if (this.previousStates.length === 0) {
        console.error("Não é possível desfazer SetMultipleLayers: nenhum estado anterior salvo.");
        return;
    }
    
    // Restaurar estados anteriores na ordem inversa da execução
    this.previousStates.forEach(state => {
        if (state.group) {
            state.group.setEnabled(state.visibility);
        }
    });
    
    console.log("Comando SetMultipleLayers desfeito.");
};


// Exportar os comandos (se estiver usando módulos no futuro)
// module.exports = { ToggleLayerCommand, SetMultipleLayersCommand };


/**
 * CameraCommands - Comandos relacionados à câmera
 * 
 * Implementa comandos específicos para manipulação da câmera,
 * como resetar a posição, focar em objetos, etc.
 */

// --- Comando para Resetar a Câmera ---

/**
 * ResetCameraCommand
 * Comando para redefinir a câmera para sua posição e orientação padrão.
 * @param {BABYLON.ArcRotateCamera} camera - A câmera a ser resetada.
 * @param {Object} defaultSettings - Configurações padrão da câmera (alpha, beta, radius, target).
 */
function ResetCameraCommand(camera, defaultSettings) {
    this.camera = camera;
    this.defaultSettings = defaultSettings;
    this.previousState = null; // Para armazenar o estado anterior para undo
}

ResetCameraCommand.prototype.execute = function() {
    if (!this.camera || !this.defaultSettings) {
        console.error("Câmera ou configurações padrão não definidas para ResetCameraCommand.");
        return;
    }
    
    // Salvar estado atual para undo
    this.previousState = {
        alpha: this.camera.alpha,
        beta: this.camera.beta,
        radius: this.camera.radius,
        target: this.camera.target.clone()
    };
    
    // Aplicar configurações padrão
    this.camera.alpha = this.defaultSettings.alpha;
    this.camera.beta = this.defaultSettings.beta;
    this.camera.radius = this.defaultSettings.radius;
    // Usar setTarget para garantir que a câmera atualize corretamente
    this.camera.setTarget(this.defaultSettings.target.clone()); 
    
    console.log("Comando ResetCamera executado.");
};

ResetCameraCommand.prototype.undo = function() {
    if (!this.camera || !this.previousState) {
        console.error("Não é possível desfazer ResetCamera: estado anterior não salvo.");
        return;
    }
    
    // Restaurar estado anterior
    this.camera.alpha = this.previousState.alpha;
    this.camera.beta = this.previousState.beta;
    this.camera.radius = this.previousState.radius;
    this.camera.setTarget(this.previousState.target.clone());
    
    console.log("Comando ResetCamera desfeito.");
};

// --- Comando para Focar em Objeto ---

/**
 * FocusObjectCommand
 * Comando para focar a câmera em um objeto específico.
 * @param {BABYLON.ArcRotateCamera} camera - A câmera a ser usada.
 * @param {BABYLON.AbstractMesh | BABYLON.TransformNode} targetObject - O objeto a ser focado.
 */
function FocusObjectCommand(camera, targetObject) {
    this.camera = camera;
    this.targetObject = targetObject;
    this.previousState = null; // Para armazenar o estado anterior para undo
}

FocusObjectCommand.prototype.execute = function() {
    if (!this.camera || !this.targetObject) {
        console.error("Câmera ou objeto alvo não definidos para FocusObjectCommand.");
        return;
    }

    // Salvar estado atual para undo
    this.previousState = {
        alpha: this.camera.alpha,
        beta: this.camera.beta,
        radius: this.camera.radius,
        target: this.camera.target.clone()
    };

    // Usar o comportamento de enquadramento se disponível
    const framingBehavior = this.camera.getBehaviorByName("Framing");
    if (framingBehavior) {
        // framingBehavior.zoomOnMesh(this.targetObject, true); // zoomOnMesh não retorna estado anterior facilmente
        // Alternativa: calcular manualmente ou apenas definir o target
        this.camera.setTarget(this.targetObject.getAbsolutePosition().clone());
        // Ajustar o raio (pode precisar de cálculo mais sofisticado)
        const boundingInfo = this.targetObject.getHierarchyBoundingVectors(true);
        const size = boundingInfo.max.subtract(boundingInfo.min);
        const maxDimension = Math.max(size.x, size.y, size.z);
        this.camera.radius = Math.max(maxDimension * 2.5, this.camera.lowerRadiusLimit || 10);

    } else {
        // Fallback se o comportamento não estiver disponível
        this.camera.setTarget(this.targetObject.getAbsolutePosition().clone());
        // Ajustar o raio (simplificado)
        const boundingInfo = this.targetObject.getBoundingInfo();
        if (boundingInfo) {
             this.camera.radius = Math.max(boundingInfo.boundingSphere.radius * 2.5, this.camera.lowerRadiusLimit || 10);
        }
    }
    
    console.log(`Comando FocusObject executado no objeto: ${this.targetObject.name || this.targetObject.id}`);
};

FocusObjectCommand.prototype.undo = function() {
    if (!this.camera || !this.previousState) {
        console.error("Não é possível desfazer FocusObject: estado anterior não salvo.");
        return;
    }
    
    // Restaurar estado anterior
    this.camera.alpha = this.previousState.alpha;
    this.camera.beta = this.previousState.beta;
    this.camera.radius = this.previousState.radius;
    this.camera.setTarget(this.previousState.target.clone());
    
    console.log("Comando FocusObject desfeito.");
};

// Exportar os comandos (se estiver usando módulos no futuro)
// module.exports = { ResetCameraCommand, FocusObjectCommand };


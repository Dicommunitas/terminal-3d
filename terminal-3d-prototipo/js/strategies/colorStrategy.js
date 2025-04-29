/**
 * ColorStrategy - Padrão Strategy para Modos de Coloração
 * 
 * Define uma interface comum para diferentes algoritmos (estratégias)
 * de coloração de objetos na cena 3D e implementa estratégias concretas.
 */

// --- Interface Conceitual da Estratégia ---
// Em JavaScript, podemos usar um objeto base ou apenas convenções.
// Uma estratégia de coloração deve ter um método apply(scene, objects)

// --- Contexto que utiliza a Estratégia ---
const ColorContext = (function() {
    let _currentStrategy = null;
    let _scene = null;
    let _objects = []; // Array ou Map de todos os objetos relevantes (com metadados)

    function initialize(scene, objects) {
        _scene = scene;
        _objects = objects; // Idealmente, uma forma de acessar todos os objetos gerenciados
        // Definir estratégia padrão inicial
        setStrategy(DefaultColorStrategy);
    }

    function setStrategy(strategy) {
        if (strategy && typeof strategy.apply === 'function') {
            _currentStrategy = strategy;
            console.log(`Estratégia de coloração definida para: ${strategy.name || 'Desconhecida'}`);
        } else {
            console.error("Tentativa de definir uma estratégia inválida.");
        }
    }

    function applyColorMode() {
        if (!_currentStrategy) {
            console.error("Nenhuma estratégia de coloração definida.");
            return;
        }
        if (!_scene) {
            console.error("Cena não definida no ColorContext.");
            return;
        }
        
        console.log(`Aplicando estratégia de coloração: ${_currentStrategy.name || 'Desconhecida'}`);
        // Passar a cena e os objetos para a estratégia aplicar a coloração
        // Precisamos de uma forma de obter todos os objetos relevantes (tanques, tubos, válvulas)
        // Esta parte precisará ser integrada com a forma como os objetos são gerenciados (Factory/DB)
        
        // Exemplo: Iterar sobre todos os meshes com metadados
        const relevantMeshes = _scene.meshes.filter(m => m.metadata && m.metadata.id);
        _currentStrategy.apply(_scene, relevantMeshes);
    }

    return {
        initialize,
        setStrategy,
        applyColorMode
    };
})();

// --- Estratégias Concretas ---

/**
 * DefaultColorStrategy: Aplica cores padrão baseadas no tipo de equipamento.
 */
const DefaultColorStrategy = {
    name: "DefaultColorStrategy",
    apply: function(scene, objects) {
        console.log("Aplicando coloração padrão...");
        // Mapeamento de cores padrão (pode ser externalizado)
        const defaultColors = {
            tank: new BABYLON.Color3(0, 0.47, 0.75),      // Azul petróleo
            pipe: new BABYLON.Color3(0.5, 0.5, 0.5),      // Cinza
            valve: new BABYLON.Color3(0.7, 0.1, 0.1),     // Vermelho
            loadingArea: new BABYLON.Color3(1, 0.67, 0) // Laranja
            // Adicionar outras cores padrão conforme necessário
        };

        objects.forEach(mesh => {
            if (mesh.metadata && mesh.metadata.type) {
                const type = mesh.metadata.type.toLowerCase();
                const color = defaultColors[type] || new BABYLON.Color3(0.6, 0.6, 0.6); // Cor padrão genérica
                
                // Encontrar o material e aplicar a cor
                // Isso pode precisar ser mais robusto dependendo de como os materiais são gerenciados
                if (mesh.material) {
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        mesh.material.albedoColor = color;
                    } else if (mesh.material instanceof BABYLON.StandardMaterial) {
                        mesh.material.diffuseColor = color;
                    }
                    // Lógica para MultiMaterial pode ser necessária
                }
            }
        });
    }
};

/**
 * ProductColorStrategy: Colore os equipamentos com base no produto que contêm/transportam.
 */
const ProductColorStrategy = {
    name: "ProductColorStrategy",
    apply: function(scene, objects) {
        console.log("Aplicando coloração por produto...");
        // Mapeamento de produtos para cores (pode ser externalizado)
        const productColors = {
            'Diesel S10': new BABYLON.Color3(0.8, 0.6, 0.1), // Amarelo escuro/Ocre
            'Gasolina': new BABYLON.Color3(0.9, 0.2, 0.1),   // Vermelho claro
            'Diesel Marítimo': new BABYLON.Color3(0.2, 0.2, 0.5), // Azul escuro
            'Óleo Lubrificante': new BABYLON.Color3(0.4, 0.3, 0.1), // Marrom
            'GLP': new BABYLON.Color3(0.7, 0.7, 0.9),       // Azul claro/Lavanda
            'Água': new BABYLON.Color3(0.2, 0.5, 0.9),       // Azul claro
            'Etanol': new BABYLON.Color3(0.5, 0.8, 0.2),     // Verde claro
            'Vapor': new BABYLON.Color3(0.9, 0.9, 0.9),     // Branco/Cinza muito claro
            'default': new BABYLON.Color3(0.6, 0.6, 0.6)    // Cinza para produtos não mapeados
        };

        objects.forEach(mesh => {
            let product = 'default';
            if (mesh.metadata && mesh.metadata.data && mesh.metadata.data.product) {
                product = mesh.metadata.data.product;
            }
            
            const color = productColors[product] || productColors['default'];

            if (mesh.material) {
                if (mesh.material instanceof BABYLON.PBRMaterial) {
                    mesh.material.albedoColor = color;
                } else if (mesh.material instanceof BABYLON.StandardMaterial) {
                    mesh.material.diffuseColor = color;
                }
            }
        });
    }
};

/**
 * StatusColorStrategy: Colore os equipamentos com base no seu status operacional.
 */
const StatusColorStrategy = {
    name: "StatusColorStrategy",
    apply: function(scene, objects) {
        console.log("Aplicando coloração por status...");
        // Mapeamento de status para cores (pode ser externalizado)
        const statusColors = {
            'operational': new BABYLON.Color3(0.1, 0.7, 0.1), // Verde
            'maintenance': new BABYLON.Color3(0.3, 0.3, 0.7), // Azul
            'offline': new BABYLON.Color3(0.5, 0.5, 0.5),     // Cinza
            'fault': new BABYLON.Color3(0.9, 0.1, 0.1),       // Vermelho
            'standby': new BABYLON.Color3(0.8, 0.8, 0.2),     // Amarelo
            'default': new BABYLON.Color3(0.6, 0.6, 0.6)    // Cinza para status não mapeados
        };

        objects.forEach(mesh => {
            let status = 'default';
            if (mesh.metadata && mesh.metadata.data && mesh.metadata.data.status) {
                status = mesh.metadata.data.status.toLowerCase();
            } else if (mesh.metadata && mesh.metadata.state) { // Para válvulas, o estado pode ser o status
                status = mesh.metadata.state.toLowerCase();
                // Mapear estados de válvula para status gerais se necessário
                if (status === 'open' || status === 'closed' || status === 'partial') {
                    status = 'operational'; // Considerar aberto/fechado/parcial como operacional
                }
            }
            
            const color = statusColors[status] || statusColors['default'];

            if (mesh.material) {
                if (mesh.material instanceof BABYLON.PBRMaterial) {
                    mesh.material.albedoColor = color;
                } else if (mesh.material instanceof BABYLON.StandardMaterial) {
                    mesh.material.diffuseColor = color;
                }
            }
        });
    }
};

/**
 * TemperatureColorStrategy: Colore os equipamentos com base na temperatura (exemplo com gradiente).
 */
const TemperatureColorStrategy = {
    name: "TemperatureColorStrategy",
    apply: function(scene, objects) {
        console.log("Aplicando coloração por temperatura...");
        // Exemplo de gradiente: Azul (frio) -> Verde -> Amarelo -> Vermelho (quente)
        const minTemp = 0;    // °C
        const maxTemp = 100;  // °C
        const defaultColor = new BABYLON.Color3(0.6, 0.6, 0.6); // Cinza para objetos sem temp

        objects.forEach(mesh => {
            let color = defaultColor;
            if (mesh.metadata && mesh.metadata.data && typeof mesh.metadata.data.temperature === 'number') {
                const temp = mesh.metadata.data.temperature;
                // Normalizar temperatura para 0-1
                const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
                
                // Interpolar cores (simplificado)
                if (t < 0.33) { // Azul para Verde
                    color = BABYLON.Color3.Lerp(new BABYLON.Color3(0, 0, 1), new BABYLON.Color3(0, 1, 0), t / 0.33);
                } else if (t < 0.66) { // Verde para Amarelo
                    color = BABYLON.Color3.Lerp(new BABYLON.Color3(0, 1, 0), new BABYLON.Color3(1, 1, 0), (t - 0.33) / 0.33);
                } else { // Amarelo para Vermelho
                    color = BABYLON.Color3.Lerp(new BABYLON.Color3(1, 1, 0), new BABYLON.Color3(1, 0, 0), (t - 0.66) / 0.34);
                }
            } else if (mesh.metadata && mesh.metadata.type === 'pipe' && mesh.metadata.materialType === 'highTemp') {
                 // Caso especial para tubulação de vapor sem dado explícito
                 color = new BABYLON.Color3(1, 0, 0); // Vermelho
            }

            if (mesh.material) {
                if (mesh.material instanceof BABYLON.PBRMaterial) {
                    mesh.material.albedoColor = color;
                } else if (mesh.material instanceof BABYLON.StandardMaterial) {
                    mesh.material.diffuseColor = color;
                }
            }
        });
    }
};

// Mapeamento de nomes de modo para estratégias (para uso na UI)
const ColorStrategies = {
    'default': DefaultColorStrategy,
    'product': ProductColorStrategy,
    'status': StatusColorStrategy,
    'temperature': TemperatureColorStrategy
};


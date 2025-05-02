/**
 * Terminal 3D - Aplicação Principal
 * 
 * Este é o ponto de entrada da aplicação que inicializa todos os módulos
 * e gerencia o ciclo de vida da aplicação.
 */

// Namespace global da aplicação
const Terminal3D = {};

// Inicialização da aplicação quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Terminal 3D...');
    
    // Referências aos elementos da interface
    Terminal3D.canvas = document.getElementById('renderCanvas');
    Terminal3D.loadingScreen = document.getElementById('loadingScreen');
    Terminal3D.statusBar = {
        coordinates: document.getElementById('coordinates'),
        fpsCounter: document.getElementById('fpsCounter'),
        selectedObject: document.getElementById('selectedObject')
    };
    
    // Inicialização do motor Babylon.js
    Terminal3D.engine = new BABYLON.Engine(Terminal3D.canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
    });
    
    // Configurar redimensionamento responsivo
    window.addEventListener('resize', function() {
        Terminal3D.engine.resize();
    });
    
    // Inicializar a cena
    Terminal3D.initScene().then(() => {
        // Remover tela de carregamento com fade-out
        Terminal3D.loadingScreen.style.opacity = 0;
        setTimeout(() => {
            Terminal3D.loadingScreen.style.display = 'none';
        }, 500);
        
        // Iniciar o loop de renderização
        Terminal3D.startRenderLoop();
        
        // Configurar eventos de interface
        Terminal3D.setupUIEvents();
        
        console.log('Terminal 3D inicializado com sucesso!');
    }).catch(error => {
        console.error('Erro ao inicializar a cena:', error);
        alert('Ocorreu um erro ao carregar o Terminal 3D. Por favor, recarregue a página.');
    });
});

/**
 * Inicializa a cena e todos os componentes relacionados
 * @returns {Promise} Promessa resolvida quando a cena estiver pronta
 */
Terminal3D.initScene = async function() {
    // Criar a cena
    Terminal3D.scene = new BABYLON.Scene(Terminal3D.engine);
    
    // Configurações iniciais da cena
    Terminal3D.scene.clearColor = new BABYLON.Color4(0.93, 0.96, 0.99, 1);
    Terminal3D.scene.useRightHandedSystem = true;
    
    try {
        // Inicializar o gerenciador de cena (de scene.js)
        await SceneManager.initialize(Terminal3D.scene, Terminal3D.canvas);
        
        // Inicializar o seletor de objetos (de picker.js)
        ObjectPicker.initialize(Terminal3D.scene, Terminal3D.canvas);
        
        // Inicializar o mapeador de cores (de colorMapping.js)
        ColorMapper.initialize(Terminal3D.scene);
        
        // Inicializar os módulos da UI
        LayerPanel.initialize();
        InfoPanel.initialize();
        
        // Criar modelos 3D
        await TanksManager.createTanks();
        await PipesManager.createPipes();
        await ValvesManager.createValves();
        await LoadingAreasManager.createLoadingAreas();
        
        // Aplicar o modo de coloração padrão
        ColorMapper.applyColorMode('default');
        
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * Inicia o loop de renderização principal
 */
Terminal3D.startRenderLoop = function() {
    // Contador para atualização de FPS (a cada 10 frames)
    let fpsUpdateCounter = 0;
    
    // Iniciar o loop de renderização
    Terminal3D.engine.runRenderLoop(() => {
        // Renderizar a cena
        Terminal3D.scene.render();
        

        

        // Atualizar coordenadas da câmera
        const camera = Terminal3D.scene.activeCamera;
        if (camera) {
            Terminal3D.statusBar.coordinates.textContent = 
                `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)}`;
        }
    });
};

/**
 * Configura os eventos da interface do usuário
 */
Terminal3D.setupUIEvents = function() {
    // Botão para resetar a câmera
    document.getElementById('resetCamera').addEventListener('click', function() {
        SceneManager.resetCamera();
    });
    
    // Botão para alternar o inspetor de cena (útil para desenvolvimento)
    document.getElementById('toggleInspector').addEventListener('click', function() {
        if (Terminal3D.scene.debugLayer.isVisible()) {
            Terminal3D.scene.debugLayer.hide();
        } else {
            Terminal3D.scene.debugLayer.show();
        }
    });
    
    // Eventos para controle de camadas
    document.getElementById('layerTanks').addEventListener('change', function(e) {
        LayerPanel.toggleLayer('tanks', e.target.checked);
    });
    
    document.getElementById('layerPipes').addEventListener('change', function(e) {
        LayerPanel.toggleLayer('pipes', e.target.checked);
    });
    
    document.getElementById('layerValves').addEventListener('change', function(e) {
        LayerPanel.toggleLayer('valves', e.target.checked);
    });
    
    document.getElementById('layerLoading').addEventListener('change', function(e) {
        LayerPanel.toggleLayer('loadingAreas', e.target.checked);
    });

    if (document.getElementById('layerGround')) {
        document.getElementById('layerGround').addEventListener('change', function(e) {
            const ground = SceneManager.ground;
            if (ground) {
                ground.setEnabled(e.target.checked);
            }
        });
    }
    
    // Controle do modo de coloração
    document.getElementById('colorMode').addEventListener('change', function(e) {
        ColorMapper.applyColorMode(e.target.value);
    });
    
    // Fechar painel de informações
    document.getElementById('closeInfo').addEventListener('click', function() {
        InfoPanel.hide();
    });
    
    // Botão de detalhes no painel de informações
    document.getElementById('viewDetails').addEventListener('click', function() {
        const selectedId = Terminal3D.selectedObjectId;
        if (selectedId) {
            // Aqui poderia abrir uma janela modal com mais detalhes
            // ou navegar para uma página de detalhes
            alert(`Detalhes completos do equipamento ${selectedId} seriam exibidos aqui.`);
        }
    });
    
    // Adicionar eventos de teclado globais
    window.addEventListener('keydown', function(e) {
        // Tecla ESC fecha painéis
        if (e.key === 'Escape') {
            InfoPanel.hide();
        }
        
        // Tecla I mostra/esconde o inspetor (útil para desenvolvimento)
        if (e.key === 'i' && e.ctrlKey) {
            if (Terminal3D.scene.debugLayer.isVisible()) {
                Terminal3D.scene.debugLayer.hide();
            } else {
                Terminal3D.scene.debugLayer.show();
            }
        }
    });
};

/**
 * Exporta informações sobre a versão e data de build
 */
Terminal3D.version = {
    number: '0.1.0',
    buildDate: '2023-10-30',
    name: 'Protótipo Inicial'
};

console.log(`Terminal 3D v${Terminal3D.version.number} - ${Terminal3D.version.name}`);

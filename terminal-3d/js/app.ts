// Importações necessárias do Babylon.js
import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials"; // Importar GridMaterial corretamente
import { SceneManager } from "./scene";
import { ObjectPicker } from "./utils/picker";
import { ColorMapper } from "./utils/colorMapping";
// Você precisará importar ou definir esses módulos
// import { TanksManager } from "./models/tanks";
// import { PipesManager } from "./models/pipes";
// import { ValvesManager } from "./models/valves";
// import { LoadingAreasManager } from "./models/loadingAreas";
// import { LayerPanel } from "./ui/layerPanel";
// import { InfoPanel } from "./ui/infoPanel";

// Namespace global da aplicação
interface Terminal3DInterface {
    canvas: HTMLCanvasElement | null;
    loadingScreen: HTMLElement | null;
    statusBar: {
        coordinates: HTMLElement | null;
        fpsCounter: HTMLElement | null;
        selectedObject: HTMLElement | null;
    };
    engine: BABYLON.Engine | null;
    scene: BABYLON.Scene | null;
    selectedObjectId?: string | null;
    initScene: () => Promise<void>;
    startRenderLoop: () => void;
    setupUIEvents: () => void;
    version: {
        number: string;
        buildDate: string;
        name: string;
    };
}

// Criar e exportar o objeto Terminal3D
const Terminal3D: Terminal3DInterface = {
    canvas: null,
    loadingScreen: null,
    statusBar: {
        coordinates: null,
        fpsCounter: null,
        selectedObject: null
    },
    engine: null,
    scene: null,
    initScene: async function() {
        // Criar a cena
        if (!this.engine) return Promise.reject("Engine não inicializado");
        
        this.scene = new BABYLON.Scene(this.engine);
        
        // Configurações iniciais da cena
        this.scene.clearColor = new BABYLON.Color4(0.93, 0.96, 0.99, 1);
        this.scene.useRightHandedSystem = true;
        
        try {
            // Crie uma cena básica por enquanto
            // Você pode adicionar mais componentes conforme necessário
            
            // Criar câmera
            const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, 
                BABYLON.Vector3.Zero(), this.scene);
            if (this.canvas) camera.attachControl(this.canvas, true);
            
            // Criar luz
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
            light.intensity = 0.7;
            
            // Criar um grid básico para visualização
            const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, this.scene);
            const gridMaterial = new GridMaterial("gridMaterial", this.scene);
            gridMaterial.majorUnitFrequency = 5;
            gridMaterial.minorUnitVisibility = 0.5;
            gridMaterial.gridRatio = 1;
            gridMaterial.mainColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            ground.material = gridMaterial;
            
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    startRenderLoop: function() {
        if (!this.engine || !this.scene) return;
        
        // Iniciar o loop de renderização
        this.engine.runRenderLoop(() => {
            // Renderizar a cena
            this.scene?.render();
            
            // Atualizar coordenadas da câmera
            const camera = this.scene?.activeCamera;
            if (camera && this.statusBar.coordinates) {
                this.statusBar.coordinates.textContent = 
                    `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)}`;
            }
        });
    },
    setupUIEvents: function() {
        // Botão para resetar a câmera
        document.getElementById('resetCamera')?.addEventListener('click', function() {
            // SceneManager.resetCamera();
            console.log('Reset camera clicked');
        });
        
        // Botão para alternar o inspetor de cena
        document.getElementById('toggleInspector')?.addEventListener('click', () => {
            if (this.scene?.debugLayer.isVisible()) {
                this.scene.debugLayer.hide();
            } else {
                this.scene?.debugLayer.show();
            }
        });
        
        // Eventos para controle de camadas (simplificado)
        document.getElementById('layerTanks')?.addEventListener('change', function(e) {
            console.log('Toggle tanks', (e.target as HTMLInputElement).checked);
        });
        
        document.getElementById('layerPipes')?.addEventListener('change', function(e) {
            console.log('Toggle pipes', (e.target as HTMLInputElement).checked);
        });
        
        document.getElementById('layerValves')?.addEventListener('change', function(e) {
            console.log('Toggle valves', (e.target as HTMLInputElement).checked);
        });
        
        document.getElementById('layerLoading')?.addEventListener('change', function(e) {
            console.log('Toggle loading areas', (e.target as HTMLInputElement).checked);
        });
        
        document.getElementById('layerGround')?.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            const groundMesh = this.scene?.getMeshByName("ground");
            if (groundMesh) {
                groundMesh.setEnabled(isChecked);
            }
        });
        
        // Controle do modo de coloração
        document.getElementById('colorMode')?.addEventListener('change', function(e) {
            console.log('Color mode changed', (e.target as HTMLSelectElement).value);
        });
        
        // Fechar painel de informações
        document.getElementById('closeInfo')?.addEventListener('click', function() {
            const infoPanel = document.getElementById('infoPanel');
            if (infoPanel) infoPanel.style.display = 'none';
        });
        
        // Adicionar eventos de teclado globais
        window.addEventListener('keydown', (e) => {
            // Tecla ESC fecha painéis
            if (e.key === 'Escape') {
                const infoPanel = document.getElementById('infoPanel');
                if (infoPanel) infoPanel.style.display = 'none';
            }
            
            // Tecla I mostra/esconde o inspetor
            if (e.key === 'i' && e.ctrlKey) {
                if (this.scene?.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene?.debugLayer.show();
                }
            }
        });
    },
    version: {
        number: '0.1.0',
        buildDate: '2023-10-30',
        name: 'Protótipo Inicial'
    }
};

// Inicialização da aplicação quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Terminal 3D...');
    
    // Referências aos elementos da interface
    Terminal3D.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
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
        Terminal3D.engine?.resize();
    });
    
    // Inicializar a cena
    Terminal3D.initScene().then(() => {
        // Remover tela de carregamento com fade-out
        if (Terminal3D.loadingScreen) {
            Terminal3D.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                if (Terminal3D.loadingScreen) {
                    Terminal3D.loadingScreen.style.display = 'none';
                }
            }, 500);
        }
        
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

console.log(`Terminal 3D v${Terminal3D.version.number} - ${Terminal3D.version.name}`);

// Exportar para uso global (compatibilidade com código não modular)
(window as any).Terminal3D = Terminal3D;

// Exportar para uso como módulo ES
export { Terminal3D };

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Importações necessárias do Babylon.js
import * as BABYLON from "@babylonjs/core";
import { SceneManager } from "./scene";
import { ObjectPicker } from "./utils/picker";
import { ColorMapper } from "./utils/colorMapping";
// Importar os gerenciadores
import { TanksManager } from "./models/tanks";
import { PipesManager } from "./models/pipes";
import { ValvesManager } from "./models/valves";
import { LoadingAreasManager } from "./models/loadingAreas";
// Criar e exportar o objeto Terminal3D
const Terminal3D = {
    canvas: null,
    loadingScreen: null,
    statusBar: {
        coordinates: null,
        fpsCounter: null,
        selectedObject: null
    },
    engine: null,
    scene: null,
    initScene: function () {
        return __awaiter(this, void 0, void 0, function* () {
            // Criar a cena
            if (!this.engine)
                return Promise.reject("Engine não inicializado");
            this.scene = new BABYLON.Scene(this.engine);
            // Configurações iniciais da cena
            this.scene.clearColor = new BABYLON.Color4(0.93, 0.96, 0.99, 1);
            this.scene.useRightHandedSystem = true;
            try {
                // Inicializar o SceneManager
                yield SceneManager.initialize(this.scene, this.canvas);
                // Inicializar o seletor de objetos
                ObjectPicker.initialize(this.scene, this.canvas);
                // Inicializar o mapeador de cores
                ColorMapper.initialize(this.scene);
                // Criar modelos 3D
                try {
                    yield TanksManager.createTanks();
                    console.log("Tanques criados com sucesso");
                }
                catch (error) {
                    console.error("Erro ao criar tanques:", error);
                }
                try {
                    yield PipesManager.createPipes();
                    console.log("Tubulações criadas com sucesso");
                }
                catch (error) {
                    console.error("Erro ao criar tubulações:", error);
                }
                try {
                    yield ValvesManager.createValves();
                    console.log("Válvulas criadas com sucesso");
                }
                catch (error) {
                    console.error("Erro ao criar válvulas:", error);
                }
                try {
                    yield LoadingAreasManager.createLoadingAreas();
                    console.log("Áreas de carregamento criadas com sucesso");
                }
                catch (error) {
                    console.error("Erro ao criar áreas de carregamento:", error);
                }
                // Aplicar o modo de coloração padrão
                ColorMapper.applyColorMode('default');
                return Promise.resolve();
            }
            catch (error) {
                console.error("Erro na inicialização da cena:", error);
                return Promise.reject(error);
            }
        });
    },
    startRenderLoop: function () {
        if (!this.engine || !this.scene)
            return;
        // Iniciar o loop de renderização
        this.engine.runRenderLoop(() => {
            var _a, _b;
            // Renderizar a cena
            (_a = this.scene) === null || _a === void 0 ? void 0 : _a.render();
            // Atualizar coordenadas da câmera
            const camera = (_b = this.scene) === null || _b === void 0 ? void 0 : _b.activeCamera;
            if (camera && this.statusBar.coordinates) {
                this.statusBar.coordinates.textContent =
                    `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)}`;
            }
        });
    },
    setupUIEvents: function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // Botão para resetar a câmera
        (_a = document.getElementById('resetCamera')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            // SceneManager.resetCamera();
            console.log('Reset camera clicked');
        });
        // Botão para alternar o inspetor de cena
        (_b = document.getElementById('toggleInspector')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            var _a, _b;
            if ((_a = this.scene) === null || _a === void 0 ? void 0 : _a.debugLayer.isVisible()) {
                this.scene.debugLayer.hide();
            }
            else {
                (_b = this.scene) === null || _b === void 0 ? void 0 : _b.debugLayer.show();
            }
        });
        // Eventos para controle de camadas (simplificado)
        (_c = document.getElementById('layerTanks')) === null || _c === void 0 ? void 0 : _c.addEventListener('change', function (e) {
            console.log('Toggle tanks', e.target.checked);
        });
        (_d = document.getElementById('layerPipes')) === null || _d === void 0 ? void 0 : _d.addEventListener('change', function (e) {
            console.log('Toggle pipes', e.target.checked);
        });
        (_e = document.getElementById('layerValves')) === null || _e === void 0 ? void 0 : _e.addEventListener('change', function (e) {
            console.log('Toggle valves', e.target.checked);
        });
        (_f = document.getElementById('layerLoading')) === null || _f === void 0 ? void 0 : _f.addEventListener('change', function (e) {
            console.log('Toggle loading areas', e.target.checked);
        });
        (_g = document.getElementById('layerGround')) === null || _g === void 0 ? void 0 : _g.addEventListener('change', (e) => {
            var _a;
            const isChecked = e.target.checked;
            const groundMesh = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.getMeshByName("ground");
            if (groundMesh) {
                groundMesh.setEnabled(isChecked);
            }
        });
        // Controle do modo de coloração
        (_h = document.getElementById('colorMode')) === null || _h === void 0 ? void 0 : _h.addEventListener('change', function (e) {
            console.log('Color mode changed', e.target.value);
        });
        // Fechar painel de informações
        (_j = document.getElementById('closeInfo')) === null || _j === void 0 ? void 0 : _j.addEventListener('click', function () {
            const infoPanel = document.getElementById('infoPanel');
            if (infoPanel)
                infoPanel.style.display = 'none';
        });
        // Adicionar eventos de teclado globais
        window.addEventListener('keydown', (e) => {
            var _a, _b;
            // Tecla ESC fecha painéis
            if (e.key === 'Escape') {
                const infoPanel = document.getElementById('infoPanel');
                if (infoPanel)
                    infoPanel.style.display = 'none';
            }
            // Tecla I mostra/esconde o inspetor
            if (e.key === 'i' && e.ctrlKey) {
                if ((_a = this.scene) === null || _a === void 0 ? void 0 : _a.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                }
                else {
                    (_b = this.scene) === null || _b === void 0 ? void 0 : _b.debugLayer.show();
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
document.addEventListener('DOMContentLoaded', function () {
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
    window.addEventListener('resize', function () {
        var _a;
        (_a = Terminal3D.engine) === null || _a === void 0 ? void 0 : _a.resize();
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
window.Terminal3D = Terminal3D;
// Exportar para uso como módulo ES
export { Terminal3D };
//# sourceMappingURL=app.js.map
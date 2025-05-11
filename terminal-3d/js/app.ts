import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";

const Terminal3D = {
    canvas: null as HTMLCanvasElement | null,
    engine: null as BABYLON.Engine | null,
    scene: null as BABYLON.Scene | null,
    loadingScreen: null as HTMLElement | null,  // Adicione esta linha
    
    init() {
        console.log("Iniciando Terminal3D...");
        
        // Capturar referência à tela de carregamento
        this.loadingScreen = document.getElementById('loadingScreen');
        console.log("Elemento de carregamento encontrado:", !!this.loadingScreen);
        
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Erro global capturado:', message, source, lineno, colno, error);
            return false;
        };

        // Corrigido para garantir que é um HTMLCanvasElement
        const canvasElement = document.getElementById('renderCanvas');
        if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
            console.error("Canvas element not found or is not a canvas element");
            this.hideLoadingScreen();  // Esconder tela de carregamento mesmo em caso de erro
            return;
        }
        
        this.canvas = canvasElement;
        console.log("Canvas configurado");
        
        try {
            this.engine = new BABYLON.Engine(this.canvas, true);
            this.scene = new BABYLON.Scene(this.engine);
            console.log("Engine e cena criados");
            
            // Create a basic scene
            const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, 
                BABYLON.Vector3.Zero(), this.scene);
            camera.attachControl(this.canvas, true);
            
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
            light.intensity = 0.7;
            
            const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, this.scene);
            const gridMaterial = new GridMaterial("gridMaterial", this.scene);
            gridMaterial.majorUnitFrequency = 5;
            gridMaterial.minorUnitVisibility = 0.5;
            gridMaterial.gridRatio = 1;
            gridMaterial.mainColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            ground.material = gridMaterial;
            console.log("Objetos da cena criados");
            
            // Render loop
            this.engine.runRenderLoop(() => {
                this.scene?.render();
            });
            
            window.addEventListener('resize', () => {
                this.engine?.resize();
            });
            
            console.log("Inicialização concluída, escondendo tela de carregamento...");
            // Remover a tela de carregamento após pequeno delay para garantir que a cena esteja pronta
            setTimeout(() => this.hideLoadingScreen(), 500);
            
        } catch (error) {
            console.error("Erro durante a inicialização:", error);
            this.hideLoadingScreen();  // Esconder tela de carregamento mesmo em caso de erro
        }
    },
    
    // Método para esconder a tela de carregamento
    hideLoadingScreen() {
        console.log("Tentando esconder tela de carregamento...");
        if (this.loadingScreen) {
            console.log("Aplicando fade-out na tela de carregamento");
            this.loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                if (this.loadingScreen) {
                    console.log("Removendo tela de carregamento do DOM");
                    this.loadingScreen.style.display = 'none';
                }
            }, 500); // 500ms para a animação de fade-out
        } else {
            console.warn("Elemento loadingScreen não encontrado");
        }
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando Terminal3D");
    Terminal3D.init();
});

// Make available globally
(window as any).Terminal3D = Terminal3D;
export { Terminal3D };

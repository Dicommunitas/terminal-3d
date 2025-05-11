import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";

const Terminal3D = {
    canvas: null as HTMLCanvasElement | null,
    engine: null as BABYLON.Engine | null,
    scene: null as BABYLON.Scene | null,
    loadingScreen: null as HTMLElement | null,
    // Adicionar rastreamento para objetos selecionados e grupos
    selectedMesh: null as BABYLON.AbstractMesh | null,
    groups: {} as Record<string, BABYLON.TransformNode>,

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
            this.hideLoadingScreen(); // Esconder tela de carregamento mesmo em caso de erro
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
            
            // Criar grupos para organização
            this.createGroups();
            
            // Criar o terreno/grid
            this.createGround();
            
            // Configurar os eventos da UI
            this.setupUIEvents();
            
            // Configurar interatividade básica (seleção de objetos)
            this.setupInteractivity();
            
            // Atualizar barra de status
            this.setupStatusBar();
            
            // Render loop
            this.engine.runRenderLoop(() => {
                this.scene?.render();
                
                // Atualizar FPS na barra de status
                this.updateFPS();
            });
            
            window.addEventListener('resize', () => {
                this.engine?.resize();
            });
            
            console.log("Inicialização concluída, escondendo tela de carregamento...");
            // Remover a tela de carregamento após pequeno delay para garantir que a cena esteja pronta
            setTimeout(() => this.hideLoadingScreen(), 500);
            
        } catch (error) {
            console.error("Erro durante a inicialização:", error);
            this.hideLoadingScreen(); // Esconder tela de carregamento mesmo em caso de erro
        }
    },

    // Criar grupos para organizar objetos na cena
    createGroups() {
        if (!this.scene) return;
        
        // Criar grupos para cada tipo de objeto
        const groupNames = ['tanks', 'pipes', 'valves', 'loadingAreas'];
        
        groupNames.forEach(name => {
            const group = new BABYLON.TransformNode(`${name}Group`, this.scene);
            this.groups[name] = group;
            console.log(`Grupo criado: ${name}Group`);
        });
    },
    
    // Criar o terreno com grid
    createGround() {
        if (!this.scene) return;
        
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            {width: 50, height: 50}, 
            this.scene
        );
        
        const gridMaterial = new GridMaterial("gridMaterial", this.scene);
        gridMaterial.majorUnitFrequency = 5;
        gridMaterial.minorUnitVisibility = 0.5;
        gridMaterial.gridRatio = 1;
        gridMaterial.mainColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        ground.material = gridMaterial;
        
        console.log("Terreno criado com material de grade");
        return ground;
    },

    // Configurar eventos da interface do usuário
    setupUIEvents() {
        // Botão para resetar a câmera
        document.getElementById('resetCamera')?.addEventListener('click', () => {
            if (this.scene && this.scene.activeCamera) {
                const camera = this.scene.activeCamera as BABYLON.ArcRotateCamera;
                camera.alpha = -Math.PI / 2;
                camera.beta = Math.PI / 3;
                camera.radius = 15;
                camera.target = BABYLON.Vector3.Zero();
                console.log("Câmera resetada para posição inicial");
            }
        });

        // Botão para alternar o inspetor de cena
        document.getElementById('toggleInspector')?.addEventListener('click', () => {
            if (this.scene?.debugLayer.isVisible()) {
                this.scene.debugLayer.hide();
                console.log("Inspetor de cena escondido");
            } else {
                this.scene?.debugLayer.show();
                console.log("Inspetor de cena mostrado");
            }
        });

        // Controles de camadas
        this.setupLayerControls();
        
        // Fechar painel de informações
        document.getElementById('closeInfo')?.addEventListener('click', () => {
            const infoPanel = document.getElementById('infoPanel');
            if (infoPanel) {
                infoPanel.style.display = 'none';
                console.log("Painel de informações fechado");
            }
        });
        
        // Teclas de atalho
        window.addEventListener('keydown', (e) => {
            // ESC para fechar painéis
            if (e.key === 'Escape') {
                const infoPanel = document.getElementById('infoPanel');
                if (infoPanel) infoPanel.style.display = 'none';
            }
            
            // I para inspetor (com Ctrl)
            if (e.key === 'i' && e.ctrlKey) {
                if (this.scene?.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene?.debugLayer.show();
                }
            }
        });
        
        console.log("Eventos de UI configurados");
    },
    
    // Configurar controles de camadas
    setupLayerControls() {
        // Terreno
        document.getElementById('layerGround')?.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            const ground = this.scene?.getMeshByName("ground");
            if (ground) {
                ground.setEnabled(isChecked);
                console.log(`Camada terreno ${isChecked ? 'ativada' : 'desativada'}`);
            }
        });
        
        // Outros grupos
        const layerIds = {
            'layerTanks': 'tanks',
            'layerPipes': 'pipes',
            'layerValves': 'valves',
            'layerLoading': 'loadingAreas'
        };
        
        Object.entries(layerIds).forEach(([elementId, groupName]) => {
            document.getElementById(elementId)?.addEventListener('change', (e) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                const group = this.groups[groupName];
                if (group) {
                    group.setEnabled(isChecked);
                    console.log(`Camada ${groupName} ${isChecked ? 'ativada' : 'desativada'}`);
                }
            });
        });
        
        // Modo de coloração
        document.getElementById('colorMode')?.addEventListener('change', (e) => {
            const mode = (e.target as HTMLSelectElement).value;
            console.log(`Modo de coloração alterado para: ${mode}`);
            // Implementação futura do sistema de coloração
        });
    },
    
    // Configurar interatividade básica
    setupInteractivity() {
        if (!this.scene) return;
        
        // Quando o usuário clica em um objeto
        this.scene.onPointerDown = (evt, pickResult) => {
            if (pickResult.hit && pickResult.pickedMesh) {
                this.selectObject(pickResult.pickedMesh);
            } else {
                this.clearSelection();
            }
        };
        
        console.log("Interatividade básica configurada");
    },
    
    // Selecionar um objeto
    selectObject(mesh: BABYLON.AbstractMesh) {
        // Limpar seleção anterior
        this.clearSelection();
        
        console.log(`Objeto selecionado: ${mesh.name}`);
        
        // Destacar o objeto selecionado (uma forma simples)
        const originalMaterial = mesh.material;
        if (originalMaterial && originalMaterial instanceof BABYLON.StandardMaterial) {
            const highlightMaterial = originalMaterial.clone(`${originalMaterial.name}_highlight`);
            highlightMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.1);
            mesh.material = highlightMaterial;
            
            // Armazenar o material original para restaurar depois
            (mesh as any)._originalMaterial = originalMaterial;
        }
        
        // Atualizar o painel de informações
        const infoPanel = document.getElementById('infoPanel');
        const infoTitle = document.getElementById('infoTitle');
        const infoContent = document.getElementById('infoContent');
        
        if (infoPanel && infoTitle && infoContent) {
            infoPanel.style.display = 'block';
            infoTitle.textContent = mesh.name || 'Objeto Selecionado';
            
            // Criar conteúdo com informações do objeto
            let html = '<table class="info-table">';
            html += `<tr><td>Nome:</td><td>${mesh.name || 'Sem nome'}</td></tr>`;
            html += `<tr><td>Tipo:</td><td>${mesh.id.split('_')[0] || 'Desconhecido'}</td></tr>`;
            html += `<tr><td>Posição:</td><td>X: ${mesh.position.x.toFixed(2)}, Y: ${mesh.position.y.toFixed(2)}, Z: ${mesh.position.z.toFixed(2)}</td></tr>`;
            
            // Adicionar metadados se disponíveis
            if (mesh.metadata) {
                for (const key in mesh.metadata) {
                    if (typeof mesh.metadata[key] !== 'object') {
                        html += `<tr><td>${key}:</td><td>${mesh.metadata[key]}</td></tr>`;
                    }
                }
            }
            
            html += '</table>';
            infoContent.innerHTML = html;
        }
        
        // Atualizar barra de status
        const selectedObject = document.getElementById('selectedObject');
        if (selectedObject) {
            selectedObject.textContent = `Selecionado: ${mesh.name || 'Objeto sem nome'}`;
        }
        
        // Armazenar referência ao objeto selecionado
        this.selectedMesh = mesh;
    },
    
    // Limpar seleção
    clearSelection() {
        if (this.selectedMesh) {
            // Restaurar material original
            const originalMaterial = (this.selectedMesh as any)._originalMaterial;
            if (originalMaterial) {
                this.selectedMesh.material = originalMaterial;
            }
            
            console.log("Seleção anterior limpa");
        }
        
        // Esconder painel de informações
        const infoPanel = document.getElementById('infoPanel');
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
        
        // Limpar barra de status
        const selectedObject = document.getElementById('selectedObject');
        if (selectedObject) {
            selectedObject.textContent = 'Nenhum objeto selecionado';
        }
        
        // Limpar referência
        this.selectedMesh = null;
    },
    
    // Configurar barra de status
    setupStatusBar() {
        const camera = this.scene?.activeCamera as BABYLON.ArcRotateCamera;
        if (camera) {
            const coordinatesElement = document.getElementById('coordinates');
            if (coordinatesElement) {
                coordinatesElement.textContent = 
                    `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)}`;
            }
            
            // Atualizar coordenadas quando a câmera se move
            camera.onViewMatrixChangedObservable.add(() => {
                if (coordinatesElement) {
                    coordinatesElement.textContent = 
                        `X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)}`;
                }
            });
        }
        
        console.log("Barra de status configurada");
    },
    
    // Atualizar contador de FPS
    updateFPS() {
        if (!this.engine) return;
        
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${this.engine.getFps().toFixed(0)}`;
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

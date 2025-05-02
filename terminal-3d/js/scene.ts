import { 
    Scene, 
    Engine, 
    Vector3, 
    ArcRotateCamera, 
    HemisphericLight, 
    DirectionalLight, 
    MeshBuilder, 
    StandardMaterial, 
    CubeTexture, 
    Texture, 
    Color3, 
    TransformNode, 
    AbstractMesh, 
    Nullable, 
    Camera, 
    FramingBehavior, 
    Mesh, 
    Light, 
    Material, 
    DefaultRenderingPipeline 
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";

/**
 * Interface for the groups holding different types of meshes.
 */
interface SceneGroups {
    tanks: Nullable<TransformNode>;
    pipes: Nullable<TransformNode>;
    valves: Nullable<TransformNode>;
    loadingAreas: Nullable<TransformNode>;
    [key: string]: Nullable<TransformNode>; // Index signature
}

/**
 * SceneManager - Gerenciamento da cena 3D
 * 
 * Responsável por configurar e gerenciar a cena 3D,
 * incluindo câmeras, luzes, ambiente e navegação.
 */
const SceneManager = (function() {
    // Variáveis privadas
    let _scene: Nullable<Scene> = null;
    let _canvas: Nullable<HTMLCanvasElement> = null;
    let _camera: Nullable<ArcRotateCamera> = null;
    let _light: Nullable<DirectionalLight> = null;
    let _skybox: Nullable<Mesh> = null;
    let _ground: Nullable<Mesh> = null;
    
    // Grupos para organização dos objetos
    const _groups: SceneGroups = {
        tanks: null,
        pipes: null,
        valves: null,
        loadingAreas: null
    };
    
    // Configurações de câmera
    const _cameraSettings = {
        default: {
            alpha: -Math.PI / 2,  // rotação horizontal
            beta: Math.PI / 3,     // rotação vertical
            radius: 50,            // distância
            target: new Vector3(0, 0, 0)
        },
        limits: {
            radiusMin: 10,
            radiusMax: 150,
            betaMin: 0.1,
            betaMax: Math.PI / 2.2
        }
    };
    
    /**
     * Inicializa o gerenciador de cena
     * @param scene - Cena Babylon.js
     * @param canvas - Elemento canvas para renderização
     * @returns Promessa resolvida quando a inicialização estiver completa
     */
    function initialize(scene: Scene, canvas: HTMLCanvasElement): Promise<void> {
        _scene = scene;
        _canvas = canvas;
        
        return new Promise<void>((resolve, reject) => {
            try {
                _setupCamera();
                _setupLights();
                _setupEnvironment();
                _createGroups();
                resolve(); // Resolve without arguments for Promise<void>
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Configura a câmera principal
     */
    function _setupCamera(): void {
        if (!_scene || !_canvas) return;
        // Criar câmera Arc Rotate (estilo órbita)
        _camera = new ArcRotateCamera(
            "mainCamera", 
            _cameraSettings.default.alpha, 
            _cameraSettings.default.beta, 
            _cameraSettings.default.radius, 
            _cameraSettings.default.target, 
            _scene
        );
        
        console.log("Câmera configurada: alpha=", _cameraSettings.default.alpha, 
          "beta=", _cameraSettings.default.beta,
          "radius=", _cameraSettings.default.radius,
          "target=", _cameraSettings.default.target.toString());

        // Anexar controles ao canvas
        _camera.attachControl(_canvas, true, true);
        
        // Configurar limites da câmera
        _camera.lowerRadiusLimit = _cameraSettings.limits.radiusMin;
        _camera.upperRadiusLimit = _cameraSettings.limits.radiusMax;
        _camera.lowerBetaLimit = _cameraSettings.limits.betaMin;
        _camera.upperBetaLimit = _cameraSettings.limits.betaMax;
        
        // Configurações adicionais
        _camera.wheelPrecision = 2;  // Sensibilidade do zoom
        _camera.panningSensibility = 50;  // Sensibilidade do panning
        _camera.useFramingBehavior = true;  // Permitir enquadramento de objetos
        
        // Configurar inércia para movimento mais suave
        _camera.inertia = 0.7;
        
        // Definir como câmera ativa
        _scene.activeCamera = _camera;
    }
    
    /**
     * Configura as luzes da cena
     */
    function _setupLights(): void {
        if (!_scene) return;
        // Luz ambiente para iluminação base
        const ambientLight = new HemisphericLight(
            "ambientLight", 
            new Vector3(0, 1, 0), 
            _scene
        );
        ambientLight.intensity = 0.5;
        ambientLight.diffuse = new Color3(0.9, 0.9, 1.0);
        ambientLight.groundColor = new Color3(0.5, 0.5, 0.6);
        
        // Luz direcional principal (simula o sol)
        _light = new DirectionalLight(
            "mainLight", 
            new Vector3(-0.5, -1, -0.5), 
            _scene
        );
        _light.intensity = 0.8;
        _light.diffuse = new Color3(1, 0.95, 0.85);
        
        // Gerar sombras (opcional, desativado no protótipo inicial por desempenho)
        /*
        const shadowGenerator = new ShadowGenerator(1024, _light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
        */
    }
    
    /**
     * Configura o ambiente da cena (céu, terreno)
     */
    function _setupEnvironment(): void {
        if (!_scene) return;
        // Skybox para simular o céu
        _skybox = MeshBuilder.CreateBox("skyBox", {size: 1000.0}, _scene);
        const skyboxMaterial = new StandardMaterial("skyBoxMaterial", _scene);
        skyboxMaterial.backFaceCulling = false;
        // Ensure CubeTexture is imported
        skyboxMaterial.reflectionTexture = new CubeTexture("https://assets.babylonjs.com/textures/skybox", _scene);
        if (skyboxMaterial.reflectionTexture) {
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        _skybox.material = skyboxMaterial;
        _skybox.infiniteDistance = true;
        
        // Terreno/chão
        _ground = MeshBuilder.CreateGround(
            "ground", 
            { 
                width: 100, 
                height: 100, 
                subdivisions: 4,
                updatable: false
            }, 
            _scene
        );
        const groundMaterial = new StandardMaterial("groundMaterial", _scene);
        groundMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
        groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        groundMaterial.wireframe = false;
        
        // Adicionar grid ao chão para referência visual
        // Ensure GridMaterial is imported from @babylonjs/materials
        const gridMaterial = new GridMaterial("gridMaterial", _scene);
        gridMaterial.majorUnitFrequency = 5;
        gridMaterial.minorUnitVisibility = 0.3;
        gridMaterial.gridRatio = 1;
        gridMaterial.backFaceCulling = false;
        gridMaterial.mainColor = new Color3(0.2, 0.2, 0.2);
        gridMaterial.lineColor = new Color3(0.2, 0.2, 0.4);
        gridMaterial.opacity = 0.8;
        
        _ground.material = gridMaterial;
        _ground.position.y = -0.01; // Ligeiramente abaixo para evitar z-fighting
        _ground.receiveShadows = true;
    }
    
    /**
     * Cria grupos para organizar os objetos na cena
     */
    function _createGroups(): void {
        if (!_scene) return;
        // Criar grupos para cada tipo de objeto
        Object.keys(_groups).forEach((key: string) => {
            // Use index signature to access _groups[key]
            _groups[key] = new TransformNode(key + "Group", _scene);
            const group = _groups[key];
            if (group) {
                console.log(`Grupo criado: ${key}Group, Posição:`, group.position);
            }
        });
    }
    
    /**
     * Redefine a câmera para a posição padrão
     */
    function resetCamera(): void {
        if (!_camera) return;
        _camera.alpha = _cameraSettings.default.alpha;
        _camera.beta = _cameraSettings.default.beta;
        _camera.radius = _cameraSettings.default.radius;
        _camera.target = _cameraSettings.default.target.clone();
    }
    
    /**
     * Foca a câmera em um objeto específico
     * @param mesh - O objeto a ser focado
     */
    function focusOnObject(mesh: Nullable<AbstractMesh>): void {
        if (!mesh || !_camera) return;
        
        // Usar o comportamento de enquadramento para focar no objeto
        const framingBehavior = _camera.getBehaviorByName("Framing") as Nullable<FramingBehavior>; // Cast to FramingBehavior
        if (framingBehavior) {
            framingBehavior.zoomOnMesh(mesh, true);
        } else {
            // Fallback se o comportamento não estiver disponível
            _camera.target = mesh.getAbsolutePosition().clone();
            _camera.radius = Math.max(mesh.getBoundingInfo().boundingSphere.radius * 2.5, 10);
        }
    }
    
    /**
     * Retorna um grupo de objetos específico
     * @param groupName - Nome do grupo
     * @returns O grupo solicitado
     */
    function getGroup(groupName: string): Nullable<TransformNode> {
        // Use index signature to access _groups[groupName]
        return _groups[groupName];
    }
    
    /**
     * Adiciona efeitos pós-processamento à cena
     * Desativado no protótipo inicial, mas disponível para expansão futura
     */
    function addPostProcessingEffects(): void {
        if (!_scene || !_camera) return;
        // Pipeline de pós-processamento
        // Ensure DefaultRenderingPipeline is imported
        const pipeline = new DefaultRenderingPipeline(
            "defaultPipeline", 
            true, 
            _scene, 
            [_camera] // Pass camera in an array
        );
        
        // Configurar efeitos
        pipeline.fxaaEnabled = true;
        pipeline.samples = 4; // MSAA
        
        // Bloom para brilho
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.8;
        pipeline.bloomWeight = 0.3;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.5;
        
        // Correção de cor
        pipeline.imageProcessingEnabled = true;
        if (pipeline.imageProcessing) {
            pipeline.imageProcessing.contrast = 1.1;
            pipeline.imageProcessing.exposure = 1.0;
        }
        
        // Profundidade de campo (desativado por padrão)
        pipeline.depthOfFieldEnabled = false;
    }
    
    // API pública
    return {
        initialize,
        resetCamera,
        focusOnObject,
        getGroup,
        addPostProcessingEffects,
        
        // Getter para acessar a cena
        get scene(): Nullable<Scene> {
            return _scene;
        },
        
        // Getter para acessar a câmera
        get camera(): Nullable<ArcRotateCamera> {
            return _camera;
        },
        
        // Getter para acessar o terreno
        get ground(): Nullable<Mesh> {
            return _ground;
        }
    };
})();

// Export SceneManager if needed elsewhere, otherwise it's self-contained
// export default SceneManager; 


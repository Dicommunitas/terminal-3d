import { Scene, Vector3, TransformNode, Mesh, MeshBuilder, PBRMaterial, StandardMaterial, Color3, Quaternion, Nullable, InstancedMesh } from "@babylonjs/core";
import { db, PipeData as DbPipeData } from "../database/inMemoryDb"; // Importar o DB e a interface de dados

// Interface para metadados internos do mesh
interface EquipmentMetadata {
    id: string;
    type: string; // Sempre 'pipe'
    size?: string;
    materialType?: string;
    data: DbPipeData; // Referência aos dados completos do DB
}

// Interface para configuração de tubulações (mantida para geometria)
interface PipeConfig {
    materials: {
        [key: string]: {
            color: Color3;
            roughness: number;
            metallic: number;
        }
    };
    diameters: {
        [key: string]: number;
    };
    tessellation: {
        [key: string]: number;
        lodSmall: number;
        lodMedium: number;
        lodLarge: number;
        lodExtraLarge: number;
    };
    lodDistance: number;
}

// Declaração para SceneManager (será importado posteriormente)
declare var SceneManager: {
    scene: Scene;
    getGroup(name: string): TransformNode;
    camera: any; // Referência à câmera para LOD
};

/**
 * PipesManager - Gerenciador de tubulações
 * 
 * Responsável por criar, modificar e gerenciar as tubulações
 * na cena 3D do terminal, buscando dados do InMemoryDatabase.
 * Com otimizações de performance (LOD, Instancing).
 */
export class PipesManager {
    private static _instance: PipesManager;
    private _pipesGroup: Nullable<TransformNode> = null;
    private _pipeMeshes: Map<string, TransformNode> = new Map(); // Usar Map para acesso rápido por ID
    
    // Meshes fonte para instancing
    private _sourceMeshes: { [key: string]: Mesh } = {};
    private _instanceMaterials: { [key: string]: PBRMaterial | StandardMaterial } = {};
    
    // Configurações para as tubulações (mantida para geometria)
    private readonly _pipeConfig: PipeConfig = {
        materials: {
            standard: {
                color: new Color3(0.5, 0.5, 0.5), // Cinza
                roughness: 0.6,
                metallic: 0.7
            },
            insulated: {
                color: new Color3(0.8, 0.8, 0.8), // Cinza claro
                roughness: 0.8,
                metallic: 0.2
            },
            highTemp: {
                color: new Color3(0.6, 0.3, 0.3), // Vermelho escuro
                roughness: 0.5,
                metallic: 0.6
            }
        },
        
        // Diâmetros padrão de tubulações (em unidades de cena)
        diameters: {
            small: 0.15,     // 2-4 polegadas
            medium: 0.3,     // 6-8 polegadas
            large: 0.5,      // 10-12 polegadas
            extraLarge: 0.8  // 16+ polegadas
        },
        
        // Segmentos para detalhamento dos tubos
        tessellation: {
            small: 8,
            medium: 12,
            large: 16,
            extraLarge: 20,
            // Segmentos reduzidos para LOD
            lodSmall: 6,
            lodMedium: 8,
            lodLarge: 10,
            lodExtraLarge: 12
        },
        
        // Distância para ativar LOD
        lodDistance: 50
    };
    
    /**
     * Obtém a instância única do PipesManager (Singleton)
     */
    public static getInstance(): PipesManager {
        if (!PipesManager._instance) {
            PipesManager._instance = new PipesManager();
        }
        return PipesManager._instance;
    }
    
    /**
     * Construtor privado (Singleton)
     */
    private constructor() {}
    
    /**
     * Inicializa o gerenciador de tubulações e cria meshes fonte
     */
    public async initialize(): Promise<void> {
        this._pipesGroup = SceneManager.getGroup("pipes");
        if (!this._pipesGroup) {
            console.error("Grupo de tubulações não encontrado na cena");
            throw new Error("Grupo de tubulações não encontrado");
        }
        
        // Criar materiais para instâncias
        this._createInstanceMaterials();
        
        // Criar meshes fonte para instancing
        this._createSourceMeshes();
    }
    
    /**
     * Cria materiais para instâncias
     */
    private _createInstanceMaterials(): void {
        const scene = SceneManager.scene;
        
        // Criar materiais para cada tipo de tubulação
        for (const materialType in this._pipeConfig.materials) {
            const config = this._pipeConfig.materials[materialType];
            const material = new PBRMaterial(`${materialType}PipeMat_instance`, scene);
            material.albedoColor = config.color;
            material.metallic = config.metallic;
            material.roughness = config.roughness;
            this._instanceMaterials[materialType] = material;
        }
        
        // Material para suportes
        this._instanceMaterials.support = this._createMaterial("supportMat_instance", new Color3(0.3, 0.3, 0.3));
    }
    
    /**
     * Cria meshes fonte para instancing
     */
    private _createSourceMeshes(): void {
        const scene = SceneManager.scene;
        
        // Criar meshes fonte para cada tamanho de tubulação
        for (const size in this._pipeConfig.diameters) {
            const diameter = this._pipeConfig.diameters[size];
            const tessellation = this._pipeConfig.tessellation[size];
            
            // Fonte para segmento de tubo
            this._sourceMeshes[`pipe_${size}`] = MeshBuilder.CreateCylinder(
                `pipe_${size}_source`,
                {
                    height: 1, // Será escalado
                    diameter: diameter,
                    tessellation: tessellation
                },
                scene
            );
            this._sourceMeshes[`pipe_${size}`].setEnabled(false);
            
            // Fonte para conexão
            this._sourceMeshes[`connection_${size}`] = MeshBuilder.CreateSphere(
                `connection_${size}_source`,
                {
                    diameter: diameter * 1.2,
                    segments: tessellation
                },
                scene
            );
            this._sourceMeshes[`connection_${size}`].setEnabled(false);
        }
        
        // Fonte para suporte de tubulação
        this._sourceMeshes.pipeSupport = MeshBuilder.CreateCylinder(
            "pipeSupport_source",
            {
                height: 1, // Será escalado
                diameter: 0.1,
                tessellation: 8
            },
            scene
        );
        this._sourceMeshes.pipeSupport.material = this._instanceMaterials.support;
        this._sourceMeshes.pipeSupport.setEnabled(false);
    }
    
    /**
     * Cria as tubulações na cena buscando dados do InMemoryDatabase.
     */
    public async createPipes(): Promise<void> {
        try {
            await this.initialize();
            console.log("PipesManager inicializado. Buscando dados de tubulações...");
            
            // Buscar dados das tubulações do banco de dados em memória
            const pipeDataList = db.getEquipmentByType("pipe") as DbPipeData[];
            
            if (pipeDataList.length === 0) {
                console.warn("Nenhum dado de tubulação encontrado no InMemoryDatabase.");
                return;
            }
            
            // Criar tubulações a partir dos dados do DB
            pipeDataList.forEach(pipeData => this.createPipeFromData(pipeData));
            
            console.log(`Total de tubulações criadas: ${this._pipeMeshes.size}`);
        } catch (error) {
            console.error("Erro ao criar tubulações:", error);
            throw error;
        }
    }
    
    /**
     * Cria uma tubulação a partir de dados do InMemoryDatabase, com otimizações.
     * @param pipeData - Dados da tubulação (DbPipeData).
     */
    public createPipeFromData(pipeData: DbPipeData): Nullable<TransformNode> {
        // Verificar se temos os pontos necessários
        if (!pipeData.points || pipeData.points.length < 2) {
            console.warn(`Tubulação ${pipeData.id} não tem pontos suficientes`);
            return null;
        }
        
        // Determinar o tamanho da tubulação
        const size = pipeData.size || "medium";
        const diameter = this._pipeConfig.diameters[size] || this._pipeConfig.diameters.medium;
        const tessellation = this._pipeConfig.tessellation[size] || this._pipeConfig.tessellation.medium;
        
        // Determinar o tipo de material
        const materialType = pipeData.materialType || "standard";
        
        // Criar o nó principal para esta tubulação
        const pipeNode = new TransformNode(pipeData.id, SceneManager.scene);
        pipeNode.parent = this._pipesGroup;
        
        // Converter os pontos para Vector3 se necessário
        const points = (pipeData.points as any[]).map(p => 
            p instanceof Vector3 ? p : new Vector3(p.x, p.y, p.z)
        );
        
        // Criar segmentos de tubulação entre pontos consecutivos
        for (let i = 0; i < points.length - 1; i++) {
            const segmentId = `${pipeData.id}_segment_${i}`;
            const segment = this._createPipeSegmentOptimized(
                segmentId,
                points[i],
                points[i + 1],
                size,
                materialType
            );
            
            segment.parent = pipeNode;
            
            // Se não for o último segmento, adicionar uma conexão/curva
            if (i < points.length - 2) {
                const connectionId = `${pipeData.id}_connection_${i}`;
                const connection = this._createPipeConnectionOptimized(
                    connectionId,
                    points[i + 1],
                    points[i],
                    points[i + 2],
                    size,
                    materialType
                );
                
                connection.parent = pipeNode;
            }
        }
        
        // Configurar metadados para interação
        (pipeNode as any).metadata = {
            id: pipeData.id,
            type: "pipe",
            size: size,
            materialType: materialType,
            data: pipeData // Referência direta aos dados do DB
        } as EquipmentMetadata;
        
        // Adicionar à lista de malhas de tubulações
        this._pipeMeshes.set(pipeData.id, pipeNode);
        
        // Criar suportes se necessário (exemplo para tubulação elevada)
        if (pipeData.id === "PIPE-ELEV-01") { // Exemplo específico
            this._createPipeSupportsOptimized(pipeData, 4);
        }
        
        return pipeNode;
    }
    
    // createDemoPipes removido, pois os dados vêm do DB
    
    /**
     * Cria um segmento de tubulação otimizado entre dois pontos usando instancing e LOD
     * @param id - Identificador do segmento
     * @param start - Ponto inicial
     * @param end - Ponto final
     * @param size - Tamanho da tubulação
     * @param materialType - Tipo de material
     * @returns O mesh do segmento criado
     */
    private _createPipeSegmentOptimized(id: string, start: Vector3, end: Vector3, size: string, materialType: string): Mesh | InstancedMesh {
        const scene = SceneManager.scene;
        
        // Calcular direção e comprimento
        const direction = end.subtract(start);
        const distance = direction.length();
        
        // Verificar se temos um mesh fonte para este tamanho
        const sourceMeshKey = `pipe_${size}`;
        if (this._sourceMeshes[sourceMeshKey]) {
            // Criar instância do mesh fonte
            const pipeInstance = this._sourceMeshes[sourceMeshKey].createInstance(id);
            
            // Escalar para o comprimento correto
            pipeInstance.scaling.y = distance;
            
            // Posicionar e orientar o tubo
            this._positionCylinder(pipeInstance, start, end);
            
            // Aplicar material
            if (this._instanceMaterials[materialType]) {
                pipeInstance.material = this._instanceMaterials[materialType];
            }
            
            // Tornar selecionável
            pipeInstance.isPickable = true;
            
            return pipeInstance;
        } else {
            // Fallback para criação direta se não houver mesh fonte
            console.warn(`Mesh fonte ${sourceMeshKey} não encontrado, criando segmento diretamente.`);
            const diameter = this._pipeConfig.diameters[size] || this._pipeConfig.diameters.medium;
            const tessellation = this._pipeConfig.tessellation[size] || this._pipeConfig.tessellation.medium;
            const lodTessellation = this._pipeConfig.tessellation[`lod${size.charAt(0).toUpperCase() + size.slice(1)}`] || tessellation / 2;
            
            // Criar cilindro para representar o segmento
            const pipe = MeshBuilder.CreateCylinder(
                id, 
                { 
                    height: distance, 
                    diameter: diameter, 
                    tessellation: tessellation 
                }, 
                scene
            );
            
            // Posicionar e orientar o tubo
            this._positionCylinder(pipe, start, end);
            
            // Criar LOD
            const pipeLOD = MeshBuilder.CreateCylinder(
                `${id}_lod`, 
                { 
                    height: distance, 
                    diameter: diameter, 
                    tessellation: lodTessellation 
                }, 
                scene
            );
            pipeLOD.setEnabled(false);
            this._positionCylinder(pipeLOD, start, end);
            pipe.addLODLevel(this._pipeConfig.lodDistance, pipeLOD);
            
            // Aplicar material
            const materialConfig = this._pipeConfig.materials[materialType] || this._pipeConfig.materials.standard;
            const material = this._createPBRMaterial(`${id}_material`, materialConfig);
            pipe.material = material;
            pipeLOD.material = material;
            
            // Tornar selecionável
            pipe.isPickable = true;
            
            return pipe;
        }
    }
    
    /**
     * Cria uma conexão (curva/esfera) otimizada em um ponto usando instancing
     * @param id - Identificador da conexão
     * @param center - Ponto central da conexão
     * @param prev - Ponto anterior (para orientação, se necessário)
     * @param next - Próximo ponto (para orientação, se necessário)
     * @param size - Tamanho da tubulação
     * @param materialType - Tipo de material
     * @returns O mesh da conexão criada
     */
    private _createPipeConnectionOptimized(id: string, center: Vector3, prev: Vector3, next: Vector3, size: string, materialType: string): Mesh | InstancedMesh {
        const scene = SceneManager.scene;
        
        // Verificar se temos um mesh fonte para este tamanho
        const sourceMeshKey = `connection_${size}`;
        if (this._sourceMeshes[sourceMeshKey]) {
            // Criar instância do mesh fonte
            const connectionInstance = this._sourceMeshes[sourceMeshKey].createInstance(id);
            connectionInstance.position = center;
            
            // Aplicar material
            if (this._instanceMaterials[materialType]) {
                connectionInstance.material = this._instanceMaterials[materialType];
            }
            
            // Tornar selecionável
            connectionInstance.isPickable = true;
            
            return connectionInstance;
        } else {
            // Fallback para criação direta
            console.warn(`Mesh fonte ${sourceMeshKey} não encontrado, criando conexão diretamente.`);
            const diameter = this._pipeConfig.diameters[size] || this._pipeConfig.diameters.medium;
            const tessellation = this._pipeConfig.tessellation[size] || this._pipeConfig.tessellation.medium;
            
            const connection = MeshBuilder.CreateSphere(
                id, 
                { 
                    diameter: diameter * 1.2, // Um pouco maior que o tubo
                    segments: tessellation 
                }, 
                scene
            );
            connection.position = center;
            
            // Aplicar material
            const materialConfig = this._pipeConfig.materials[materialType] || this._pipeConfig.materials.standard;
            const material = this._createPBRMaterial(`${id}_material`, materialConfig);
            connection.material = material;
            
            // Tornar selecionável
            connection.isPickable = true;
            
            return connection;
        }
    }
    
    /**
     * Cria suportes otimizados para uma tubulação usando instancing
     * @param pipeData - Dados da tubulação
     * @param spacing - Espaçamento entre suportes
     */
    private _createPipeSupportsOptimized(pipeData: DbPipeData, spacing: number): void {
        if (!this._sourceMeshes.pipeSupport) return;
        
        const points = (pipeData.points as any[]).map(p => 
            p instanceof Vector3 ? p : new Vector3(p.x, p.y, p.z)
        );
        
        let totalLength = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const segmentLength = Vector3.Distance(start, end);
            const direction = end.subtract(start).normalize();
            
            // Calcular número de suportes para este segmento
            const numSupports = Math.floor(segmentLength / spacing);
            
            for (let j = 1; j <= numSupports; j++) {
                const supportPosition = start.add(direction.scale(j * spacing));
                
                // Criar instância do suporte
                const supportInstance = this._sourceMeshes.pipeSupport.createInstance(`${pipeData.id}_support_${totalLength + j}`);
                supportInstance.parent = this._pipesGroup; // Adicionar ao grupo principal
                
                // Posicionar e escalar
                const supportHeight = supportPosition.y; // Assumindo que o suporte vai do chão (y=0) até a tubulação
                supportInstance.scaling.y = supportHeight;
                supportInstance.position = new Vector3(supportPosition.x, supportHeight / 2, supportPosition.z);
            }
            totalLength += numSupports;
        }
    }
    
    /**
     * Posiciona e orienta um cilindro entre dois pontos
     * @param cylinder - O mesh do cilindro
     * @param start - Ponto inicial
     * @param end - Ponto final
     */
    private _positionCylinder(cylinder: Mesh | InstancedMesh, start: Vector3, end: Vector3): void {
        const direction = end.subtract(start);
        const distance = direction.length();
        
        // Posicionar no ponto médio
        cylinder.position = start.add(direction.scale(0.5));
        
        // Orientar o cilindro
        const up = new Vector3(0, 1, 0);
        const axis = Vector3.Cross(up, direction).normalize();
        const angle = Math.acos(Vector3.Dot(up, direction.normalize()));
        cylinder.rotationQuaternion = Quaternion.RotationAxis(axis, angle);
    }
    
    /**
     * Cria um material PBR
     */
    private _createPBRMaterial(name: string, config: { color: Color3, roughness: number, metallic: number }): PBRMaterial {
        const scene = SceneManager.scene;
        const material = new PBRMaterial(name, scene);
        material.albedoColor = config.color;
        material.metallic = config.metallic;
        material.roughness = config.roughness;
        return material;
    }
    
    /**
     * Cria um material standard simples
     */
    private _createMaterial(name: string, color: Color3): StandardMaterial {
        const scene = SceneManager.scene;
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = color;
        return material;
    }
    
    /**
     * Obtém todos os nós de tubulações
     */
    public getPipeNodes(): TransformNode[] {
        return Array.from(this._pipeMeshes.values());
    }
    
    /**
     * Obtém um nó de tubulação específico por ID
     */
    public getPipeNodeById(id: string): Nullable<TransformNode> {
        return this._pipeMeshes.get(id) || null;
    }
    
    /**
     * Atualiza o status de uma tubulação (no DB e visualmente se necessário)
     */
    public updatePipeStatus(id: string, status: string): boolean {
        const pipeNode = this.getPipeNodeById(id);
        if (!pipeNode) return false;
        
        const metadata = (pipeNode as any).metadata as EquipmentMetadata;
        if (!metadata || !metadata.data) return false;
        
        // Atualizar no DB
        const pipeData = metadata.data;
        pipeData.status = status;
        db.upsertEquipment(pipeData); // Atualiza o registro no DB
        
        // TODO: Implementar mudança visual baseada no status (ex: cor, transparência)
        console.log(`Status da tubulação ${id} atualizado para ${status} no DB.`);
        return true;
    }
    
    /**
     * Limpa todas as tubulações da cena e meshes fonte
     */
    public clearPipes(): void {
        this._pipeMeshes.forEach(pipe => pipe.dispose(false, true)); // Dispose nós e filhos
        this._pipeMeshes.clear();
        
        // Limpar meshes fonte (opcional)
        Object.values(this._sourceMeshes).forEach(mesh => mesh.dispose());
        this._sourceMeshes = {};
        Object.values(this._instanceMaterials).forEach(mat => mat.dispose());
        this._instanceMaterials = {};
        console.log("Tubulações e meshes fonte limpos.");
    }
}

// Criar instância global para compatibilidade (se necessário)
// (window as any).PipesManager = PipesManager.getInstance();
//export { PipesManager };

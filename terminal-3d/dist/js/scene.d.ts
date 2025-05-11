import { Scene, ArcRotateCamera, TransformNode, AbstractMesh, Nullable, Mesh } from "@babylonjs/core";
/**
 * SceneManager - Gerenciamento da cena 3D
 *
 * Responsável por configurar e gerenciar a cena 3D,
 * incluindo câmeras, luzes, ambiente e navegação.
 */
declare const SceneManager: {
    initialize: (scene: Scene, canvas: HTMLCanvasElement) => Promise<void>;
    resetCamera: () => void;
    focusOnObject: (mesh: Nullable<AbstractMesh>) => void;
    getGroup: (groupName: string) => Nullable<TransformNode>;
    addPostProcessingEffects: () => void;
    readonly scene: Nullable<Scene>;
    readonly camera: Nullable<ArcRotateCamera>;
    readonly ground: Nullable<Mesh>;
};
export { SceneManager };

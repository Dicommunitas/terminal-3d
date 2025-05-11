import * as BABYLON from "@babylonjs/core";
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
declare const Terminal3D: Terminal3DInterface;
export { Terminal3D };

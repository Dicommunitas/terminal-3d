// js/interfaces/index.ts
export interface Terminal3DInterface {
    canvas: HTMLCanvasElement | null;
    loadingScreen: HTMLElement | null;
    statusBar: {
        coordinates: HTMLElement | null;
        fpsCounter: HTMLElement | null;
        selectedObject: HTMLElement | null;
    };
    engine: any; // Use o tipo apropriado do Babylon.js
    scene: any; // Use o tipo apropriado do Babylon.js
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

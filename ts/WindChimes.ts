//WunderVision 2023
//www.wundervisionengineering.com
import HavokPhysics, { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
import {
    Mesh, Scene, Engine,
    Camera, HemisphericLight, Vector3, AssetsManager,
    ArcRotateCamera, KeyboardInfo, KeyboardEventTypes,
    EventState, WebXRState, MeshBuilder, HavokPlugin, PhysicsViewer, EquiRectangularCubeTexture, PBRMaterial, Texture
} from "@babylonjs/core";
import { WindChime, WindChimeEventData } from "./WindChime";
import { WindChimeRod } from "./WindChimeRod";
import { WindChimeAudio } from "./WindChimeAudio";

export class WindChimes {
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: Camera;
    private _audioContext: AudioContext;
    private _windChimeAudios: Array<WindChimeAudio>;
    private _windChime: WindChime | null;
    private _windBlowing: boolean;
    private _windEnabled: boolean;
    private _windLocation: Vector3;
    private _windTimer: any;
    private _uiTexture: AdvancedDynamicTexture;
    private _windButton: Button;
    constructor(canvasID: string) {
        this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
        if (this._canvas == null) { throw "Could not find canvas"; }

        this._audioContext = new AudioContext();

        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        const backgroundTexture = new EquiRectangularCubeTexture('360view_low.jpg', this._scene, 512);
        this._scene.createDefaultSkybox(backgroundTexture, true);

        this._windChimeAudios = new Array<WindChimeAudio>();
        this._windChime = null;
        this._windBlowing = false;
        this._windEnabled = false;
        this._windTimer = null;
        this._windLocation = new Vector3(0.5, 0, 0.5);
        HavokPhysics().then(this.initializePhysics.bind(this));

        const light: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);

        const camera = new ArcRotateCamera("Camera", 0, Math.PI / 4, 35, Vector3.Zero(), this._scene);
        camera.setTarget(new Vector3(0, 0, 0));
        camera.attachControl(this._canvas, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 40;
        this._camera = camera;

        window.addEventListener('resize', () => { this._engine.resize(); })
        this._engine.runRenderLoop(() => {
            this._scene.render();
            this.applyWind();
        });

        this._uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("ui");
        this._windButton = Button.CreateSimpleButton('activateWind', 'Start Wind!');
        this._windButton.onPointerClickObservable.add(() => { 
            this.enableWind(true);
            this._windButton.isVisible = false;
        });
        this._windButton.width = "160px";
        this._windButton.height = "80px";
        this._windButton.top = "30%";
        this._windButton.color = 'white';
        this._windButton.background = 'green';
        this._uiTexture.addControl(this._windButton);

    }

    private initializePhysics(havok: HavokPhysicsWithBindings) {
        const gravityVector = new Vector3(0, -9.81, 0);
        const physicsPlugin = new HavokPlugin(true, havok);
        this._scene.enablePhysics(gravityVector, physicsPlugin);

        this._windChime = new WindChime(new Vector3(0, 1, 0), 1, 5, this._scene);
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(5), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(6), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(7), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(8), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(9), this._audioContext));
        this._windChime?.addEventListener("impact", this.onRodImpact.bind(this));
        this._canvas.addEventListener('pointerdown', () => {
            this._audioContext.resume();
        });

        // const physicsViewer = new PhysicsViewer();
        // for (const mesh of this._scene.rootNodes) {
        //     const body = (mesh as Mesh).physicsBody;
        //     if (body != null) {
        //         const debugMesh = physicsViewer.showBody(body);
        //     }
        // }
    }


    private onRodImpact(event: Event) {
    }

    public applyWind() {
        if (this._windBlowing) {
            this._windChime?.applyWind(25, this._windLocation);
        }
    }

    public enableWind(enabled: boolean) {
        this._windBlowing = false;
        this._windEnabled = enabled;
        if (!this._windEnabled) {
            clearTimeout(this._windTimer);
        }
        else {
            this.timerToggleWind();
        }
    }

    public timerToggleWind() {
        if (this._windEnabled) {
            let timeout = 0;
            if (this._windBlowing) {
                this._windBlowing = false;
                timeout = Math.random() * 1000 + 5000;
            }
            else {
                this._windBlowing = true;
                this.setRandomWindLocation();
                timeout = Math.random() * 5000 + 5000;
            }
            this._windTimer = setTimeout(this.timerToggleWind.bind(this), timeout);
        }
    }

    public setRandomWindLocation() {
        const radial = Math.random() * 2 * Math.PI;
        this._windLocation.set(10 * Math.cos(radial), 0, 10 * Math.sin(radial));
    }

}
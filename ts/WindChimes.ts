//WunderVision 2023
//www.wundervisionengineering.com
import HavokPhysics, { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
import {
    Mesh, Scene, Engine,
    Camera, HemisphericLight, Vector3, AssetsManager,
    ArcRotateCamera, KeyboardInfo, KeyboardEventTypes,
    EventState, WebXRState, MeshBuilder, HavokPlugin, PhysicsViewer, EquiRectangularCubeTexture, PBRMaterial, Texture, WebXRDefaultExperience, WebXRBackgroundRemover, SphereBuilder, WebXRHitTest, Quaternion
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
    private _xrExperience: WebXRDefaultExperience | null;
    private _setPosition: boolean;
    private _skyBox: Mesh | null;
    constructor(canvasID: string) {
        this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
        if (this._canvas == null) { throw "Could not find canvas"; }

        this._audioContext = new AudioContext();
        this._setPosition = false;
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        const backgroundTexture = new EquiRectangularCubeTexture('360view_low.jpg', this._scene, 512);
        this._skyBox = this._scene.createDefaultSkybox(backgroundTexture, true);

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
        this._windButton.left = "-80px"
        this._windButton.color = 'white';
        this._windButton.background = 'green';

        this._uiTexture.addControl(this._windButton);
        
        this._xrExperience = null;
        this.initializeXR();
    }

    private async initializeXR(){
        this._xrExperience = await this._scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: 'immersive-ar'
            },
            optionalFeatures: true
        });
        this._xrExperience.baseExperience.featuresManager.enableFeature(WebXRBackgroundRemover, "latest", {
            backgroundMeshes:[this._skyBox],
            environmentHelperRemovalFlags:{
                skyBox:true, ground:true
            }
        });

        this._xrExperience.baseExperience.sessionManager.onXRSessionInit.addOnce(()=>{
            this._windChime?.dispose();
            this._windChime = null;
            this._setPosition = true;

            const positionChime = Button.CreateSimpleButton('positionWindChime', 'Set Position');
            positionChime.onPointerClickObservable.add(() => { 
                this._setPosition = true;
            });
            positionChime.width = "160px";
            positionChime.height = "80px";
            positionChime.top = "30%";
            positionChime.left = "80px"
            positionChime.color = 'white';
            positionChime.background = 'green';
            this._uiTexture.addControl(positionChime);
        })




        const hitTest = this._xrExperience.baseExperience.featuresManager.enableFeature(WebXRHitTest, 'latest',{
            disablePermanentHitTest:true,
            enableTransientHitTest:true
        }) as WebXRHitTest

        hitTest.onHitTestResultObservable.add((results) => {
            if (this._setPosition && results.length) {
                let position = new Vector3();
                results[0].transformationMatrix.decompose(undefined, undefined, position);
                position.y += 2;
                this.makeWindchime(position, 0.1);
                this._setPosition = false;
            }
        });

        return;
    }

    private initializePhysics(havok: HavokPhysicsWithBindings) {
        const gravityVector = new Vector3(0, -9.81, 0);
        const physicsPlugin = new HavokPlugin(true, havok);
        
        this._scene.enablePhysics(gravityVector, physicsPlugin);
        this.makeWindchime(new Vector3(0, 1, 0), 0.1);
        this._canvas.addEventListener('pointerdown', () => {
            this._audioContext.resume();
        },{once:true});

        // const physicsViewer = new PhysicsViewer();
        // for (const mesh of this._scene.rootNodes) {
        //     const body = (mesh as Mesh).physicsBody;
        //     if (body != null) {
        //         const debugMesh = physicsViewer.showBody(body);
        //     }
        // }
    }

    private makeWindchime(position:Vector3, scale:number){
        if(this._windChime != null){
            this._windChime.dispose();
            this._windChimeAudios.forEach(audio=>audio.dispose());
        }
        this._windChime = new WindChime(position, scale, 5, this._scene);
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(5), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(6), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(7), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(8), this._audioContext));
        this._windChimeAudios.push(new WindChimeAudio(this._windChime.addNewRod(9), this._audioContext));
        this._windChime?.addEventListener("impact", this.onRodImpact.bind(this));
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
        this._windLocation.set(5 * Math.cos(radial), 0, 5 * Math.sin(radial));
    }

}
import HavokPhysics from "@babylonjs/havok";
import { Mesh, Scene, Engine, 
    Camera, HemisphericLight, Vector3, AssetsManager,
    ArcRotateCamera, KeyboardInfo, KeyboardEventTypes, 
    EventState, WebXRState, MeshBuilder, HavokPlugin } from "@babylonjs/core";
import { WindChime } from "./WindChime";
import { WindChimeRod } from "./WindChimeRod";
import { WindChimeAudio } from "./WindChimeAudio";

export class WindChimes{
    private _canvas:HTMLCanvasElement;
    private _engine:Engine;
    private _scene:Scene;
    private _camera:Camera;
    private _audioContext:AudioContext;
    private _windChimeAudioMap:Map<number, WindChimeAudio>
    private _windChime:WindChime | null;
    private _windBlowing: boolean;
    private _windLocation: Vector3;
    constructor(canvasID:string){
        this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
        if (this._canvas == null) { throw "Could not find canvas"; }

        this._audioContext = new AudioContext();

        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);
        this._windChimeAudioMap = new Map();
        this._windChime = null;
        this._windBlowing = false;
        this._windLocation = new Vector3(0.5, 0, 0.5);
        HavokPhysics().then((havok) => {
            const gravityVector = new Vector3(0, -9.81, 0);
            const physicsPlugin = new HavokPlugin(true, havok);
            this._scene.enablePhysics(gravityVector, physicsPlugin);

            this._windChime = new WindChime(new Vector3(0, 1, 0), 1, 5, this._scene);
            this._windChimeAudioMap.set(6, new WindChimeAudio(this._windChime.addNewRod(6), this._audioContext));
            this._windChimeAudioMap.set(7, new WindChimeAudio(this._windChime.addNewRod(7), this._audioContext));
            this._windChimeAudioMap.set(8, new WindChimeAudio(this._windChime.addNewRod(8), this._audioContext));
            this._windChimeAudioMap.set(9, new WindChimeAudio(this._windChime.addNewRod(9), this._audioContext));
            this._windChimeAudioMap.set(10, new WindChimeAudio(this._windChime.addNewRod(10), this._audioContext));

            this._canvas.addEventListener('pointerdown',()=>{
                this._audioContext.resume();
                this._windChime?.onRodImpact(this.onRodImpact.bind(this));
            });

            setTimeout(this.applyWind.bind(this), 1000);
            
          });



        const light: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);

        const camera = new ArcRotateCamera("Camera", 0, Math.PI/4, 35, Vector3.Zero(), this._scene);
        camera.setTarget(new Vector3(0,0,0));
        camera.attachControl(this._canvas, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 40;
        this._camera = camera;

        window.addEventListener('resize', () => { this._engine.resize(); })
        this._engine.runRenderLoop(() => {
            this._scene.render();
            if(this._windBlowing){
                this._windChime?.applyWind(10, this._windLocation);
            }
            
        });
    }


    private onRodImpact(windChime:WindChime, windChimeRod:WindChimeRod){
        const audio = this._windChimeAudioMap.get(windChimeRod.length);
        audio?.play();
    }

    public applyWind(){
        this._windBlowing = true;
        const radial = Math.random()*2*Math.PI;
        this._windLocation.set(10*Math.cos(radial), 0, 10*Math.sin(radial));
        setTimeout(this.removeWind.bind(this), Math.random()*5000+5000);
    }

    public removeWind(){
        this._windBlowing = false;
        setTimeout(this.applyWind.bind(this), Math.random()*1000+5000);
    }

}
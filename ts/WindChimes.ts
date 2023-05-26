import { Mesh, Scene, Engine, 
    Camera, HemisphericLight, Vector3, AssetsManager,
    ArcRotateCamera, KeyboardInfo, KeyboardEventTypes, 
    EventState, WebXRState, MeshBuilder } from "@babylonjs/core";
import { WindChime } from "./WindChime";
export class WindChimes{
    private _canvas:HTMLCanvasElement;
    private _engine:Engine;
    private _scene:Scene;
    private _camera:Camera;
    constructor(canvasID:string){
        this._canvas = document.getElementById(canvasID) as HTMLCanvasElement;
        if (this._canvas == null) { throw "Could not find canvas"; }


        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        const light: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);

        const camera = new ArcRotateCamera("Camera", 0, Math.PI/4, 35, Vector3.Zero(), this._scene);
        camera.setTarget(new Vector3(0,0,0));
        camera.attachControl(this._canvas, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 40;
        this._camera = camera;


        const testChime = new WindChime(new Vector3(0, 1, 0), 1, this._scene);




        window.addEventListener('resize', () => { this._engine.resize(); })

        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }    

}
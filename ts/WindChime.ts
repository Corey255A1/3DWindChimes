import { WindChimeRod } from "./WindChimeRod";
import { Color3, LinesMesh, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
export class WindChime {
    private _radius: number;
    private _rods: Array<WindChimeRod>;
    private _body: Mesh;
    private _knocker: Mesh;
    private _blower: Mesh;
    private _mainRope: LinesMesh;
    constructor(position: Vector3, radius: number, scene: Scene) {
        this._radius = radius;
        this._rods = new Array<WindChimeRod>();
        this._body = this.createBody(position, radius, scene);
        const ropeLength = 10;
        this._mainRope = this.createMainRope(position, ropeLength, scene);
        this._knocker = this.createKnocker(position.add(new Vector3(0, position.y - ropeLength / 2, 0)), 
                                    radius / 2, scene);
        this._blower = this.createBlower(position.add(new Vector3(0, position.y - ropeLength, 0)), 
                                radius / 2, scene);
    }

    private createBody(position: Vector3, radius: number, scene: Scene): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: 0.25,
            diameter: radius * 2
        }, scene);

        body.position.copyFrom(position);
        return body;
    }

    private createMainRope(position: Vector3, ropeLength: number, scene: Scene): LinesMesh {
        const ropeSegments = 10;
        const segments = new Array<Vector3>();

        for (let i = 0; i < ropeSegments; i++) {
            segments.push(new Vector3(position.x, position.y - ropeLength * i / ropeSegments, position.z));
        }

        //Create lines  
        const rope: LinesMesh = MeshBuilder.CreateLines("lines", { points: segments }, scene);
        rope.color = Color3.Black();

        return rope;
    }

    private createKnocker(position: Vector3, radius: number, scene: Scene): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: 0.25,
            diameter: radius * 2
        }, scene);

        body.position = position;
        return body;
    }

    private createBlower(position: Vector3, radius: number, scene: Scene): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: 0.25,
            diameter: radius * 2
        }, scene);
        body.addRotation(Math.PI/2,0,0);
        body.position = position;
        return body;
    }





    private distributeRods() {

    }

    public addRod(rod: WindChimeRod) {
        this._rods.push(rod);
        this.distributeRods();
    }

    public removeRod(rod: WindChimeRod) {
        const rodIndex: number = this._rods.findIndex(r => r == rod);
        if (rodIndex < 0) { return; }

        this._rods.splice(rodIndex, 1);
        this.distributeRods();
    }
}
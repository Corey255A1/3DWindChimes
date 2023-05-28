import { Mesh, MeshBuilder, PhysicsAggregate, PhysicsBody, PhysicsShapeType, Scene, Vector3 } from "@babylonjs/core";

export class WindChimeRod{
    private _length:number;
    private _radius:number;
    private _rod:Mesh;
    private _rodPhysics:PhysicsAggregate;
    constructor(position:Vector3, length:number, radius:number, scene:Scene){
        this._length = length;
        this._radius = radius;
        this._rod = MeshBuilder.CreateCylinder('rod', {
            height: length,
            diameter: radius * 2
        }, scene);

        this._rod.position = position;

        this._rodPhysics = new PhysicsAggregate(this._rod, PhysicsShapeType.CYLINDER, { mass: length, restitution: 1 }, scene);
    }

    public get body():PhysicsBody{
        return this._rodPhysics.body;
    }

    public get length():number{
        return this._length;
    }
    public get position():Vector3{
        return this._rod.position;
    }

    public impact(){
        //generate tone
    }
}
//WunderVision 2023
//www.wundervisionengineering.com
import { Color3, EventState, IPhysicsCollisionEvent, Mesh, MeshBuilder, PhysicsAggregate, PhysicsBody, PhysicsShapeType, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

export class WindChimeRod extends EventTarget{
    private _length: number;
    private _radius: number;
    private _rod: Mesh;
    private _rodPhysics: PhysicsAggregate;
    constructor(position: Vector3, length: number, radius: number, scene: Scene) {
        super()
        this._length = length;
        this._radius = radius;
        this._rod = MeshBuilder.CreateCylinder('rod', {
            height: length,
            diameter: radius * 2
        }, scene);

        const material = new StandardMaterial('rod_material', scene);
        material.diffuseColor = new Color3(0.1, 0.1, 0.1);
        material.specularColor = new Color3(0.1, 0.1, 0.2);
        this._rod.material = material;
        this._rod.position = position;

        this._rodPhysics = new PhysicsAggregate(this._rod, PhysicsShapeType.CYLINDER, { mass: length, restitution: 1 }, scene);
        this._rodPhysics.body.setCollisionCallbackEnabled(true);
        this._rodPhysics.body.getCollisionObservable().add(this.processCollision.bind(this))
    }

    private processCollision(event: IPhysicsCollisionEvent, state: EventState) {
        this.dispatchEvent(new CustomEvent<WindChimeRod>("impact", {detail:this}));
    }

    public get body(): PhysicsBody {
        return this._rodPhysics.body;
    }

    public get length(): number {
        return this._length;
    }

    public get position(): Vector3 {
        return this._rod.position;
    }
}
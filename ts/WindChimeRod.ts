//WunderVision 2023
//www.wundervisionengineering.com
import { EventState, IPhysicsCollisionEvent, Mesh, MeshBuilder, PhysicsAggregate, PhysicsBody, PhysicsShapeType, Scene, Vector3 } from "@babylonjs/core";

export class WindChimeRod {
    private _length: number;
    private _radius: number;
    private _rod: Mesh;
    private _rodPhysics: PhysicsAggregate;
    private _impactCallback: null | ((windChimeRod: WindChimeRod) => void);
    constructor(position: Vector3, length: number, radius: number, scene: Scene) {
        this._length = length;
        this._radius = radius;
        this._rod = MeshBuilder.CreateCylinder('rod', {
            height: length,
            diameter: radius * 2
        }, scene);

        this._rod.position = position;

        this._rodPhysics = new PhysicsAggregate(this._rod, PhysicsShapeType.CYLINDER, { mass: length, restitution: 1 }, scene);
        this._rodPhysics.body.setCollisionCallbackEnabled(true);
        this._rodPhysics.body.getCollisionObservable().add(this.processCollision.bind(this))
        this._impactCallback = null;
    }

    private processCollision(event: IPhysicsCollisionEvent, state: EventState) {
        if (this._impactCallback != null) { this._impactCallback(this); }
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

    public onImpact(impactCallback: (windChimeRod: WindChimeRod) => void) {
        this._impactCallback = impactCallback;
    }
}
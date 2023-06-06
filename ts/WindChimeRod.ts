//WunderVision 2023
//www.wundervisionengineering.com
import { Color3, EventState, IPhysicsCollisionEvent, Mesh, MeshBuilder, Observable, PBRMaterial, PhysicsAggregate, PhysicsBody, PhysicsShapeType, Scene, StandardMaterial, Texture, Vector3, VertexBuffer } from "@babylonjs/core";
export interface WindChimeRodCollision{
    windChimeRod:WindChimeRod,
    impactValue:number
}
export class WindChimeRod extends EventTarget{
    private _length: number;
    private _radius: number;
    private _rod: Mesh;
    private _rodPhysics: PhysicsAggregate;
    public readonly onCollisionEvent: Observable<WindChimeRodCollision>;
    constructor(position: Vector3, length: number, radius: number, scene: Scene) {
        super()
        this._length = length;
        this._radius = radius;
        this.onCollisionEvent = new Observable<WindChimeRodCollision>();
        const halfLength = length/2;
        this._rod = MeshBuilder.CreateTube('rod', {
            path:[new Vector3(0,halfLength,0), new Vector3(0,-halfLength,0)], 
            sideOrientation:Mesh.DOUBLESIDE, radius:radius});

        // this._rod = MeshBuilder.CreateCylinder('rod', {
        //     height: length,
        //     diameter: radius * 2
        // }, scene);

        // const material = new StandardMaterial('rod_material', scene);
        // material.diffuseColor = new Color3(0.1, 0.1, 0.1);
        // material.specularColor = new Color3(0.1, 0.1, 0.2);
        
        const material = new PBRMaterial('rodMaterial');
        material.roughness = 1;
        material.metallic = 1;
        material.albedoColor = new Color3(0,0,0);
        //material.albedoTexture = new Texture('reinforced-metal_albedo.png');
        material.bumpTexture = new Texture('reinforced-metal_normal.png');
        material.metallicTexture = new Texture('reinforced-metal_roughness.png');
        this._rod.material = material;
        this._rod.position = position;

        this._rodPhysics = new PhysicsAggregate(this._rod, PhysicsShapeType.CYLINDER, { mass: length, restitution: 1 }, scene);
        this._rodPhysics.body.setCollisionCallbackEnabled(true);
        this._rodPhysics.body.getCollisionObservable().add(this.processCollision.bind(this))
    }

    private processCollision(event: IPhysicsCollisionEvent, state: EventState) {
        const v = new Vector3();
        const v2 = new Vector3();
        event.collider.getLinearVelocityToRef(v);
        event.collidedAgainst.getLinearVelocityToRef(v2);
        let impactValue:number = 0;
        if(event.normal){
            v.multiplyInPlace(event.normal);
            v2.multiplyInPlace(event.normal);
            impactValue = Math.abs(v.lengthSquared() - v2.lengthSquared());
        }
        this.onCollisionEvent.notifyObservers({windChimeRod:this, impactValue});
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
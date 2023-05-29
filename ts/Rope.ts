import { BallAndSocketConstraint, Color3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

export class Rope {
    private _scene: Scene;
    private _segments: Array<Mesh>;
    private _physicsSegments: Array<PhysicsAggregate>;
    private _segmentLength: number;
    constructor(position: Vector3, length: number, segmentLength: number, scene: Scene) {
        this._scene = scene;
        this._segmentLength = segmentLength
        const ropeSegments = length / segmentLength - 1;
        this._segments = new Array<Mesh>();
        let ropePosition = position.add(new Vector3(0, -segmentLength / 2, 0));
        const material = new StandardMaterial('rope_material', scene);
        material.diffuseColor = new Color3(0.0, 0.0, 0.0);
        material.specularColor = new Color3(0.0, 0.0, 0.0);
        for (let i = 0; i < ropeSegments; i++) {
            const ropeSegments = MeshBuilder.CreateCylinder('rope_segment', {
                height: segmentLength,
                diameter: 0.01
            }, this._scene);
            ropeSegments.position = ropePosition;
            ropeSegments.material = material;
            ropePosition = ropePosition.add(new Vector3(0, -segmentLength, 0));
            this._segments.push(ropeSegments);
        }

        this._physicsSegments = this.makePhysics();
    }

    private makePhysics():Array<PhysicsAggregate>{
        const physicsSegments = this._segments.map(mesh => {
            return new PhysicsAggregate(mesh, PhysicsShapeType.CYLINDER, { mass: 0.1, restitution: 0 }, this._scene);
        });
        const bottomOffset = new Vector3(0, -this._segmentLength / 2, 0);
        const topOffset = new Vector3(0, this._segmentLength / 2, 0);
        physicsSegments.forEach((ropeSegment, index) => {
            if (index == 0) {
                return;
            }
            let joint = new BallAndSocketConstraint(
                topOffset,
                bottomOffset,
                new Vector3(0, 1, 0),
                new Vector3(0, 1, 0),
                this._scene
            );
            ropeSegment.body.addConstraint(physicsSegments[index - 1].body, joint);
        });

        return physicsSegments;
    }

    public get segmentCount():number{
        return this._segments.length;
    }

    // Makes an assumption that the rope is straight up and down parallel with the Y Axis
    // if need more flexibility, will have to account for segment orientation
    public get top(): Vector3 {
        return this._segments[0].position.add(new Vector3(0, this._segmentLength / 2, 0));
    }

    public get bottom(): Vector3 {
        return this._segments[this._segments.length - 1].position.add(new Vector3(0, -this._segmentLength / 2, 0));
    }

    public getPhysicsSegment(index:number):PhysicsAggregate{
        return this._physicsSegments[index];
    }
}
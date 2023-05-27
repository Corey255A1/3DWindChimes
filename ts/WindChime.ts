import { WindChimeRod } from "./WindChimeRod";
import { Axis, BallAndSocketConstraint, Color3, LinesMesh, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, Vector3 } from "@babylonjs/core";
export class WindChime {
    private _radius: number;
    private _rods: Array<WindChimeRod>;
    private _body: Mesh;
    // private _knocker: Mesh;
    private _blower: Mesh;
    private _mainRope: Array<Mesh>;
    constructor(position: Vector3, radius: number, scene: Scene) {
        this._radius = radius;
        this._rods = new Array<WindChimeRod>();
        this._body = this.createBody(position, radius, scene);
        const physicsBody = new PhysicsAggregate(this._body, PhysicsShapeType.CYLINDER, { mass: 0, restitution: 1 }, scene);
        const ropeLength = 10;
        this._mainRope = this.createRope(position, ropeLength, scene);
        const rope = this.makePhysicsRope(this._mainRope, physicsBody);
        const lastRopeSegment = rope[rope.length - 1];
        //rope[rope.length-1].body.applyImpulse(Axis.X.scale(1), rope[rope.length-1].transformNode.position);
        //this._knocker = this.createKnocker(position.add(new Vector3(0, position.y - ropeLength / 2, 0)), radius / 4, scene);
        this._blower = this.createBlower(lastRopeSegment.transformNode.position.add(new Vector3(0, -radius / 2, 0)), radius / 2, scene);
        const physicsBlower = new PhysicsAggregate(this._blower, PhysicsShapeType.CYLINDER, { mass: 10, restitution: 1 }, scene);
        let joint = new BallAndSocketConstraint(
            new Vector3(0, -0.25, 0),
            new Vector3(0, radius/2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        lastRopeSegment.body.addConstraint(physicsBlower.body, joint);
        physicsBlower.body.applyImpulse(new Vector3(0,0,20), physicsBlower.transformNode.position.add(new Vector3(0,0,-1)));

    }



    private createBody(position: Vector3, radius: number, scene: Scene): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: 0.25,
            diameter: radius * 2
        }, scene);

        body.position.copyFrom(position);
        return body;
    }

    private makePhysicsRope(rope: Array<Mesh>, mountObject: PhysicsAggregate): Array<PhysicsAggregate> {
        const scene = rope[0].getScene();
        const ropePhysics = rope.map(mesh => {
            return new PhysicsAggregate(mesh, PhysicsShapeType.CAPSULE, { mass: 0.1, restitution: 1 }, scene);
        });
        const bottomOffset = new Vector3(0, -0.25, 0);
        const topOffset = new Vector3(0, 0.25, 0);
        ropePhysics.forEach((ropeSegment, index) => {
            let mount: PhysicsAggregate;
            if (index == 0) {
                mount = mountObject;
            } else {
                mount = ropePhysics[index - 1];
            }
            let joint = new BallAndSocketConstraint(
                topOffset,
                bottomOffset,
                new Vector3(0, 1, 0),
                new Vector3(0, 1, 0),
                scene
            );
            ropeSegment.body.addConstraint(mount.body, joint);
        })

        return ropePhysics;
    }

    private createRope(position: Vector3, ropeLength: number, scene: Scene): Array<Mesh> {
        const ropeSegmentLength = 0.5
        const ropeSegments = ropeLength / ropeSegmentLength - 1;
        const segments = new Array<Mesh>();
        let ropePosition = position.add(new Vector3(0, -ropeSegmentLength * 2, 0));;
        for (let i = 0; i < ropeSegments; i++) {
            const body = MeshBuilder.CreateCylinder('rope', {
                height: ropeSegmentLength,
                diameter: 0.1
            }, scene);
            body.position = ropePosition;
            ropePosition = ropePosition.add(new Vector3(0, -ropeSegmentLength, 0));
            console.log(body.position)
            segments.push(body);
        }
        return segments;
    }

    private createKnocker(position: Vector3, radius: number, scene: Scene): Mesh {
        const body = MeshBuilder.CreateCylinder('knocker', {
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
        body.addRotation(Math.PI / 2, 0, 0);
        body.bakeCurrentTransformIntoVertices();
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
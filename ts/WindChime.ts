import { WindChimeRod } from "./WindChimeRod";
import { Axis, BallAndSocketConstraint, Color3, LinesMesh, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, Vector3 } from "@babylonjs/core";
export class WindChime {
    private _radius: number;
    private _numberOfRods: number;
    private _rods: Array<WindChimeRod>;
    private _body: Mesh;
    private _bodyPhysics: PhysicsAggregate;
    private _knocker: Mesh;
    private _blower: Mesh;
    private _blowerPhyiscs: PhysicsAggregate;
    private _mainRope: Array<Mesh>;
    private _secondaryRope: Array<Mesh>;
    private _impactCallback: null | ((windChime: WindChime, windChimeRod: WindChimeRod) => void);
    private _scene: Scene;

    constructor(position: Vector3, radius: number, numberOfRods: number, scene: Scene) {
        this._radius = radius;
        this._numberOfRods = numberOfRods;
        this._rods = new Array<WindChimeRod>();
        this._scene = scene;


        // //Clean this craziness up
        this._body = this.createBody(position, radius);
        this._bodyPhysics = new PhysicsAggregate(this._body, PhysicsShapeType.CYLINDER, { mass: 0, restitution: 0 });
        const knockerOffset = 4;
        const blowerOffset = 10;
        const ropeSegmentLength = 1;
        this._mainRope = this.createRope(position.add(new Vector3(0, -0.1, 0)), knockerOffset, ropeSegmentLength);
        let lastRopeMesh = this._mainRope[this._mainRope.length - 1];
        this._knocker = this.createKnocker(lastRopeMesh.position.add(new Vector3(0, -(0.1 + ropeSegmentLength / 2), 0)), radius / 4);
        this._secondaryRope = this.createRope(this._knocker.position.add(new Vector3(0, -0.1, 0)), blowerOffset, ropeSegmentLength);
        const mainRopePhysics = this.makePhysicsRope(this._mainRope, ropeSegmentLength);

        let joint = new BallAndSocketConstraint(
            new Vector3(0, -0.1, 0),
            new Vector3(0, ropeSegmentLength / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        let ropeSegmentPhysics = mainRopePhysics[0];
        this._bodyPhysics.body.addConstraint(ropeSegmentPhysics.body, joint)

        const physicsKnocker = new PhysicsAggregate(this._knocker, PhysicsShapeType.CYLINDER, { mass: 2, restitution: 0 }, scene);
        joint = new BallAndSocketConstraint(
            new Vector3(0, -ropeSegmentLength / 2, 0),
            new Vector3(0, 0.1, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = mainRopePhysics[mainRopePhysics.length - 1];
        ropeSegmentPhysics.body.addConstraint(physicsKnocker.body, joint);
        const secondaryRopePhysics = this.makePhysicsRope(this._secondaryRope, ropeSegmentLength);
        joint = new BallAndSocketConstraint(
            new Vector3(0, -0.1, 0),
            new Vector3(0, ropeSegmentLength / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = secondaryRopePhysics[0];
        physicsKnocker.body.addConstraint(ropeSegmentPhysics.body, joint);

        lastRopeMesh = this._secondaryRope[this._secondaryRope.length - 1];
        this._blower = this.createBlower(lastRopeMesh.position.add(new Vector3(0, -radius, 0)), radius);
        this._blowerPhyiscs = new PhysicsAggregate(this._blower, PhysicsShapeType.CYLINDER, { mass: 10, restitution: 0 }, scene);
        joint = new BallAndSocketConstraint(
            new Vector3(0, -ropeSegmentLength / 2, 0),
            new Vector3(0, radius / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = secondaryRopePhysics[secondaryRopePhysics.length - 1];
        ropeSegmentPhysics.body.addConstraint(this._blowerPhyiscs.body, joint);
        //physicsBlower.body.applyImpulse(new Vector3(0, 0, 50), physicsBlower.transformNode.position.add(new Vector3(0, 0, -2)));

        this._impactCallback = null;
    }

    private processRodImpact(windChimeRod: WindChimeRod) {
        if (this._impactCallback != null) { this._impactCallback(this, windChimeRod) }
    }


    private createBody(position: Vector3, radius: number): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: 0.2,
            diameter: radius * 2
        }, this._scene);

        body.position.copyFrom(position);
        return body;
    }

    private makePhysicsRope(rope: Array<Mesh>, ropeSegmentLength: number): Array<PhysicsAggregate> {
        const ropePhysics = rope.map(mesh => {
            return new PhysicsAggregate(mesh, PhysicsShapeType.CYLINDER, { mass: 0.1, restitution: 0 }, this._scene);
        });
        const bottomOffset = new Vector3(0, -ropeSegmentLength / 2, 0);
        const topOffset = new Vector3(0, ropeSegmentLength / 2, 0);
        ropePhysics.forEach((ropeSegment, index) => {
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
            ropeSegment.body.addConstraint(ropePhysics[index - 1].body, joint);
        })

        return ropePhysics;
    }

    private createRope(position: Vector3, ropeLength: number, ropeSegmentLength: number): Array<Mesh> {
        const ropeSegments = ropeLength / ropeSegmentLength - 1;
        const segments = new Array<Mesh>();
        let ropePosition = position.add(new Vector3(0, -ropeSegmentLength / 2, 0));
        for (let i = 0; i < ropeSegments; i++) {
            const body = MeshBuilder.CreateCylinder('rope', {
                height: ropeSegmentLength,
                diameter: 0.05
            }, this._scene);
            body.position = ropePosition;
            ropePosition = ropePosition.add(new Vector3(0, -ropeSegmentLength, 0));
            segments.push(body);
        }
        return segments;
    }

    private createKnocker(position: Vector3, radius: number): Mesh {
        const body = MeshBuilder.CreateCylinder('knocker', {
            height: 0.2,
            diameter: radius * 2
        }, this._scene);

        body.position = position;
        return body;
    }

    private createBlower(position: Vector3, radius: number): Mesh {
        const body = MeshBuilder.CreateCylinder('blower', {
            height: 0.2,
            diameter: radius * 2
        }, this._scene);
        body.addRotation(Math.PI / 2, 0, 0);
        body.bakeCurrentTransformIntoVertices();
        body.position = position;
        return body;
    }

    private distributeRods() {

    }

    public addNewRod(length: number): WindChimeRod {
        const radius = this._radius - 0.2;
        const currentRod = this._rods.length * (2 * Math.PI / this._numberOfRods);
        const x = radius * Math.cos(currentRod);
        const z = radius * Math.sin(currentRod);
        const ropeSegmentLength = 0.2;
        const rodRope = this.createRope(this._body.position.add(new Vector3(x, -0.1, z)), 1, ropeSegmentLength);
        const rod = new WindChimeRod(new Vector3(x, (rodRope[rodRope.length - 1].position.y - ropeSegmentLength / 2) - length / 2, z), length, 0.2, this._scene);
        const rodRopePhyiscs = this.makePhysicsRope(rodRope, ropeSegmentLength);

        let joint = new BallAndSocketConstraint(
            new Vector3(x, -0.1, z),
            new Vector3(0, ropeSegmentLength / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            this._scene
        );
        let ropeSegmentPhysics = rodRopePhyiscs[0];
        this._bodyPhysics.body.addConstraint(ropeSegmentPhysics.body, joint)

        joint = new BallAndSocketConstraint(
            new Vector3(0, -ropeSegmentLength / 2, 0),
            new Vector3(0, length / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            this._scene
        );
        ropeSegmentPhysics = rodRopePhyiscs[rodRopePhyiscs.length - 1];
        ropeSegmentPhysics.body.addConstraint(rod.body, joint);

        this.addRod(rod);

        return rod;
    }

    public onRodImpact(rodImpactCallback:(windChime:WindChime, windChimeRod:WindChimeRod)=>void){
        this._impactCallback = rodImpactCallback;
    }

    public applyWind(magnitude:number, location:Vector3){
        const windLocation = this._blowerPhyiscs.transformNode.getAbsolutePosition().add(location);
        const windDirection = windLocation.clone().normalize().scale(magnitude);
        this._blowerPhyiscs.body.applyForce(windDirection, windLocation);
    }

    public addRod(rod: WindChimeRod) {
        rod.onImpact(this.processRodImpact.bind(this));
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
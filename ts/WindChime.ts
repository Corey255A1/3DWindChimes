//WunderVision 2023
//www.wundervisionengineering.com
import { Rope } from "./Rope";
import { WindChimeRod } from "./WindChimeRod";
import { Axis, BallAndSocketConstraint, Color3, LinesMesh, Material, Mesh, MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

export interface WindChimeEventData {
    windChime: WindChime,
    windChimeRod: WindChimeRod
}

export class WindChime extends EventTarget {
    private _radius: number;
    private _numberOfRods: number;
    private _rods: Array<WindChimeRod>;
    private _discThickness: number;
    private _discMaterial: Material;
    private _body: Mesh;
    private _bodyPhysics: PhysicsAggregate;
    private _knocker: Mesh;
    private _blower: Mesh;
    private _blowerPhyiscs: PhysicsAggregate;
    private _mainRope: Rope;
    private _secondaryRope: Rope;
    private _scene: Scene;
    
    constructor(position: Vector3, radius: number, numberOfRods: number, scene: Scene) {
        super();
        this._radius = radius;
        this._numberOfRods = numberOfRods;
        this._rods = new Array<WindChimeRod>();
        this._scene = scene;

        const knockerOffset = 4;
        const blowerOffset = 10;
        const ropeSegmentLength = 1;
        const halfRopeSegmentLenght = ropeSegmentLength / 2;
        this._discThickness = 0.2;
        const halfDiscThickness = this._discThickness / 2;

        // const material = new StandardMaterial('disc_material', scene);
        // material.diffuseColor = new Color3(0.4, 0.4, 0.3);
        // material.specularColor = new Color3(0.3, 0.3, 0.2);

        const material = new PBRMaterial('disc_material', scene);
        material.roughness = 1;
        material.metallic = 1;
        //https://freepbr.com/materials/bamboo-wood-pbr-material/
        material.albedoTexture = new Texture('bamboo-wood-semigloss-albedo.png');
        material.bumpTexture = new Texture('bamboo-wood-semigloss-normal.png');
        material.metallicTexture = new Texture('bamboo-wood-semigloss-roughness.png');
        this._discMaterial = material;

        this._body = this.createBody(position, radius, this._discThickness);
        this._body.material = this._discMaterial;
        this._bodyPhysics = new PhysicsAggregate(this._body, PhysicsShapeType.CYLINDER, { mass: 0, restitution: 0 });

        this._mainRope = new Rope(position.add(new Vector3(0, -halfDiscThickness, 0)), knockerOffset, ropeSegmentLength, this._scene);

        this._knocker = this.createKnocker(this._mainRope.bottom.add(new Vector3(0, -halfDiscThickness, 0)), radius * 0.4, this._discThickness);
        this._knocker.material = this._discMaterial;
        const physicsKnocker = new PhysicsAggregate(this._knocker, PhysicsShapeType.CYLINDER, { mass: 2, restitution: 0 }, scene);

        this._secondaryRope = new Rope(this._knocker.position.add(new Vector3(0, -halfDiscThickness, 0)), blowerOffset, ropeSegmentLength, this._scene);

        this._blower = this.createBlower(this._secondaryRope.bottom.add(new Vector3(0, -radius, 0)), radius / 2, this._discThickness);
        this._blower.material = this._discMaterial;
        this._blowerPhyiscs = new PhysicsAggregate(this._blower, PhysicsShapeType.CYLINDER, { mass: 10, restitution: 0 }, scene);


        // Top of Rope to Body
        let joint = new BallAndSocketConstraint(
            new Vector3(0, -halfDiscThickness, 0),
            new Vector3(0, halfRopeSegmentLenght, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        let ropeSegmentPhysics = this._mainRope.getPhysicsSegment(0);
        this._bodyPhysics.body.addConstraint(ropeSegmentPhysics.body, joint)

        // First Rope to Knocker
        joint = new BallAndSocketConstraint(
            new Vector3(0, -halfRopeSegmentLenght, 0),
            new Vector3(0, halfDiscThickness, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = this._mainRope.getPhysicsSegment(this._mainRope.segmentCount - 1);
        ropeSegmentPhysics.body.addConstraint(physicsKnocker.body, joint);

        // Knocker to Second Rope
        joint = new BallAndSocketConstraint(
            new Vector3(0, -halfDiscThickness, 0),
            new Vector3(0, halfRopeSegmentLenght, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = this._secondaryRope.getPhysicsSegment(0);
        physicsKnocker.body.addConstraint(ropeSegmentPhysics.body, joint);

        // Second Rope to blower
        joint = new BallAndSocketConstraint(
            new Vector3(0, -halfRopeSegmentLenght, 0),
            new Vector3(0, 0, -radius / 2),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            scene
        );
        ropeSegmentPhysics = this._secondaryRope.getPhysicsSegment(this._secondaryRope.segmentCount - 1);
        ropeSegmentPhysics.body.addConstraint(this._blowerPhyiscs.body, joint);
    }

    private processRodImpact(event: Event) {
        const rod = (event as CustomEvent<WindChimeRod>).detail;
        this.dispatchEvent(new CustomEvent<WindChimeEventData>("impact", { detail: { windChime: this, windChimeRod: rod } }));
    }


    private createBody(position: Vector3, radius: number, thickness: number): Mesh {
        const body = MeshBuilder.CreateCylinder('windchime', {
            height: thickness,
            diameter: radius * 2
        }, this._scene);

        body.position.copyFrom(position);
        return body;
    }

    private createKnocker(position: Vector3, radius: number, thickness: number): Mesh {
        const body = MeshBuilder.CreateCylinder('knocker', {
            height: thickness,
            diameter: radius * 2
        }, this._scene);

        body.position = position;
        return body;
    }

    private createBlower(position: Vector3, radius: number, thickness: number): Mesh {
        const body = MeshBuilder.CreateCylinder('blower', {
            height: thickness,
            diameter: radius * 2
        }, this._scene);
        body.addRotation(Math.PI / 2, 0, 0);
        //body.bakeCurrentTransformIntoVertices();
        body.position = position;
        return body;
    }

    public addNewRod(length: number): WindChimeRod {
        const radius = this._radius - 0.2;
        const currentRod = this._rods.length * (2 * Math.PI / this._numberOfRods);
        const x = radius * Math.cos(currentRod);
        const z = radius * Math.sin(currentRod);
        const ropeSegmentLength = 0.2;
        const rodRope = new Rope(this._body.position.add(new Vector3(x, -this._discThickness / 2, z)), 1, ropeSegmentLength, this._scene);
        const rod = new WindChimeRod(new Vector3(x, (rodRope.bottom.y - ropeSegmentLength / 2) - length / 2, z), length, 0.2, this._scene);

        let joint = new BallAndSocketConstraint(
            new Vector3(x, -this._discThickness / 2, z),
            new Vector3(0, ropeSegmentLength / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            this._scene
        );
        let ropeSegmentPhysics = rodRope.getPhysicsSegment(0);
        this._bodyPhysics.body.addConstraint(ropeSegmentPhysics.body, joint)

        joint = new BallAndSocketConstraint(
            new Vector3(0, -ropeSegmentLength / 2, 0),
            new Vector3(0, length / 2, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, 0),
            this._scene
        );
        ropeSegmentPhysics = rodRope.getPhysicsSegment(rodRope.segmentCount - 1);
        ropeSegmentPhysics.body.addConstraint(rod.body, joint);

        this.addRod(rod);

        return rod;
    }

    public addRod(rod: WindChimeRod) {
        rod.addEventListener("impact", this.processRodImpact.bind(this));
        this._rods.push(rod);
    }

    public removeRod(rod: WindChimeRod) {
        const rodIndex: number = this._rods.findIndex(r => r == rod);
        if (rodIndex < 0) { return; }

        this._rods.splice(rodIndex, 1);
    }


    public applyWind(magnitude: number, location: Vector3) {
        const windLocation = this._blowerPhyiscs.transformNode.getAbsolutePosition().add(location);
        const windDirection = windLocation.clone().normalize().scale(-magnitude);
        this._blowerPhyiscs.body.applyForce(windDirection, this._blowerPhyiscs.transformNode.getAbsolutePosition());
    }
}
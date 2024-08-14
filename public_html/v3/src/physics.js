import Ammo from "./ammo.js";

class Physics{
    constructor(game) {
		this.game = game;
		this.rigidBodies = [];
    }
    
	initAmmo(){
		Ammo().then( (Ammo) => {
			Ammo = Ammo;
			this.ammoClone = Ammo;
			this.createAmmo(Ammo);
		});

	}

	createAmmo(Ammo = this.ammoClone){
		this.tempTransform = new Ammo.btTransform();
		this.setupPhysicsWorld(Ammo);
		this.createPlane(Ammo);
		this.createBall(Ammo);
	}

	setupPhysicsWorld(Ammo = this.ammoClone){
		let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		let overlappingPairCache = new Ammo.btDbvtBroadphase();
		let solver = new Ammo.btSequentialImpulseConstraintSolver();

		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
		this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));
	}

	createPlane(Ammo = this.ammoClone){
		let pos = {x: 0, y: 1, z: 0};
		let scale = {x: 3000, y: 2, z: 3000};
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 0;

		// plane in 3js
		let blockPlane = new THREE.Mesh(
			new THREE.BoxGeometry(scale.x, scale.y, scale.z),
			new THREE.MeshPhongMaterial({color: 0xff00ff})
		);
		blockPlane.position.set(pos.x, pos.y, pos.z);
		blockPlane.castShadow = true;
		blockPlane.receiveShadow = true;

		this.game.scene.add(blockPlane);

		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

		let motionState = new Ammo.btDefaultMotionState(transform);
		let localInertia = new Ammo.btVector3(0, 0, 0);
		let shape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
		shape.setMargin(0.05);
		shape.calculateLocalInertia(mass, localInertia);

		let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		let rBody = new Ammo.btRigidBody(rigidBodyInfo);
		this.physicsWorld.addRigidBody(rBody);
	}

	createBall(Ammo = this.ammoClone){
		let pos = {x: 0, y: 20, z: 0};
		let radius = 200;
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 1;

		// ball in 3js
		let ball = new THREE.Mesh(
			new THREE.SphereGeometry(radius),
			new THREE.MeshPhongMaterial({color: 0x00ff00})
		);
		ball.position.set(pos.x, pos.y, pos.z);
		ball.castShadow = true;
		ball.receiveShadow = true;

		this.game.scene.add(ball);

		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

		let motionState = new Ammo.btDefaultMotionState(transform);
		let localInertia = new Ammo.btVector3(0, 0, 0);
		let shape = new Ammo.btSphereShape(radius);
		shape.setMargin(0.05);
		shape.calculateLocalInertia(mass, localInertia);

		let rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		let rBody = new Ammo.btRigidBody(rigidBodyInfo);
		this.physicsWorld.addRigidBody(rBody);
		ball.userData.physicsBody = rBody;
		this.rigidBodies.push(ball);
	}

	updatePhysics(delta){
		this.physicsWorld.stepSimulation(delta, 10);
		
		for (let i = 0; i < this.rigidBodies.length; i++) {
			let threeObject = this.rigidBodies[i];
			let ammoObject = threeObject.userData.physicsBody;
			let ms = ammoObject.getMotionState();

			if (ms) {
				ms.getWorldTransform(this.tempTransform);
				let pos = this.tempTransform.getOrigin();
				let quat = this.tempTransform.getRotation();
				threeObject.position.set(pos.x(), pos.y(), pos.z());
				threeObject.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
			}
		}
	}
}

export default Physics;
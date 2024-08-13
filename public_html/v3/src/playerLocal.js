import Player from "./player.js";

class PlayerLocal extends Player{
	constructor(game, model){
		super(game, model);
		
		const player = this;

        //#region Socket stuff
		const socket = io();
		socket.on('setId', function(data){
			player.id = data.id;
		});
		socket.on('remoteData', function(data){
			game.remoteData = data;
		});
		socket.on('deletePlayer', function(data){
			const players = game.remotePlayers.filter(function(player){
				if (player.id == data.id){
					return player;
				}
			});
			if (players.length>0){
				let index = game.remotePlayers.indexOf(players[0]);
				if (index!=-1){
					game.remotePlayers.splice( index, 1 );
					game.scene.remove(players[0].object);
				}else{
					index = game.initialisingPlayers.indexOf(data.id);
					if (index!=-1){
						const player = game.initialisingPlayers[index];
						player.deleted = true;
						game.initialisingPlayers.splice(index, 1);
					}
				}
			}
		})
		socket.on('chat message', function(data){
			document.getElementById('chat').style.bottom = '0px';
			const player = game.getRemotePlayerById(data.id);
			game.speechBubble.player = player;
			game.chatSocketId = player.id;
			game.activeCamera = game.cameras.chat;
			game.speechBubble.update(data.message);
		});
		$('#msg-form').submit(function(e){
			socket.emit('chat message', { id:game.chatSocketId, message:$('#m').val() });
			$('#m').val('');
			return false;
		});
		
		this.socket = socket;
        //#endregion

		// Movement based stuff
		this.velocity = new THREE.Vector3(0, 0, 0);
		this.XZinput = new THREE.Vector2(0, 0);
		this.forward = new THREE.Vector3(0, 0, 0);
		this.up = new THREE.Vector3(0, 0, 0);
		this.right = new THREE.Vector3(0, 0, 0);
	}
	
	initSocket(){
		//console.log("PlayerLocal.initSocket");
		this.socket.emit('init', { 
			model:this.model, 
			colour: this.colour,
			x: this.object.position.x,
			y: this.object.position.y,
			z: this.object.position.z,
			h: this.object.rotation.y,
			pb: this.object.rotation.x
		});
	}
	
	updateSocket(){
		if (this.socket !== undefined){
			//console.log(`PlayerLocal.updateSocket - rotation(${this.object.rotation.x.toFixed(1)},${this.object.rotation.y.toFixed(1)},${this.object.rotation.z.toFixed(1)})`);
			this.socket.emit('update', {
				x: this.object.position.x,
				y: this.object.position.y,
				z: this.object.position.z,
				h: this.object.rotation.y,
				pb: this.object.rotation.x,
				action: this.action
			})
		}
	}

    update(dt) {
        const colliders = this.game.colliders;
		if (colliders==undefined){ return; }

		// Get player input and normalize it
		this.XZinput = this.XZinput.normalize();

		// Update the forward, up and right 
		this.object.getWorldDirection(this.forward);
		this.up.copy( this.object.up ).applyMatrix4( this.object.matrixWorld ).normalize();
		this.right.crossVectors( this.forward, this.up ).normalize();

		// Move object
		this.object.translateZ(dt*500*this.XZinput.y);
		this.object.translateX(dt*500*this.XZinput.x);


		// pre-calculate movement
		// normalize direction of velocity
		// raycast in direction of movement - if hitting a bounding box
    }

	moveXZ(dt, playerXZ) {
		const colliders = this.game.colliders;
		if (colliders==undefined){ return; }

		// Get player input and normalize it
		playerXZInput = playerXZInput.normalize();
		const pos = this.object.position.clone();
		pos.y += 60;
		
		// Raycast forward/backward
		let dir = new THREE.Vector3();
		this.object.getWorldDirection(dir);
		if (playerXZInput.y<0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;

		const intersect = raycaster.intersectObjects(colliders);
		if (intersect.length>0){
			if (intersect[0].distance<50) blocked = true;
		}

		if (!blocked){
			this.object.translateZ(dt*500*playerXZInput.y);
			this.object.translateX(dt*500*playerXZInput.x);
		}
	
		
		
		if (colliders!==undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(100-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(intersect[0].distance-100);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.object.position.y){
					//Going up
					this.object.position.y = 0.8 * this.object.position.y + 0.2 * targetY;
					this.velocityY = 0;
				}else if (targetY < this.object.position.y){
					//Falling
					if (this.velocityY==undefined) this.velocityY = 0;
					this.velocityY += dt * gravity;
					this.object.position.y -= this.velocityY;
					if (this.object.position.y < targetY){
						this.velocityY = 0;
						this.object.position.y = targetY;
					}
				}
			}
		}
		
		
		this.updateSocket();
	}
	
	move(dt){
		const pos = this.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.object.getWorldDirection(dir);
		if (this.motion.forward<0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.game.colliders;
	
		if (colliders!==undefined){ 
			const intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) blocked = true;
			}
		}
		
		if (!blocked){
			if (this.motion.forward>0){
				const speed = (this.action=='Running') ? 500 : 150;
				this.object.translateZ(dt*speed);
			}else{
				this.object.translateZ(-dt*30);
			}
		}
		
		if (colliders!==undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(100-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(intersect[0].distance-100);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.object.position.y){
					//Going up
					this.object.position.y = 0.8 * this.object.position.y + 0.2 * targetY;
					this.velocityY = 0;
				}else if (targetY < this.object.position.y){
					//Falling
					if (this.velocityY==undefined) this.velocityY = 0;
					this.velocityY += dt * gravity;
					this.object.position.y -= this.velocityY;
					if (this.object.position.y < targetY){
						this.velocityY = 0;
						this.object.position.y = targetY;
					}
				}
			}
		}
		
		this.object.rotateY(this.motion.turn*dt);
		
		this.updateSocket();
	}
}

export default PlayerLocal;
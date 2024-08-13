class Input{

    constructor(game) {
		// Keyboard/input stuff
		this.game = game;
		this.keyboard;
		this.keyboardEventsList = [];
		this.playerXZ = new THREE.Vector2(0, 0);
        this.renderer;
    }

    init(input_renderer) {
        this.renderer = input_renderer;
		this.keyboard = new THREEx.KeyboardState(this.renderer.domElement);
		this.renderer.domElement.setAttribute("tabIndex", "0");
		this.renderer.domElement.focus();
		this.keyboard.domElement.addEventListener('keydown', (event) => this.onKeyDown(event));
		this.keyboard.domElement.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown( event ) {
		if ( this.keyboardEventsList.includes(event.key) ) { // If the key is being held down
			this.onKeyPressed( event );
		}
		else { // If the button has been pressed for the first time
			this.keyboardEventsList.push(event.key);
			if ( ['w','a','s','d'].includes(event.key) ) {
				this.checkWASDInputs();
			}
		}
	}

	onKeyUp( event ) {
		if ( this.keyboardEventsList.includes(event.key) ) { // If the key is being held down
			const index = this.keyboardEventsList.indexOf(event.key); // get index of key in list
			if (index > -1) { // only splice array when item is found
				this.keyboardEventsList.splice(index, 1); // 2nd parameter means remove one item only
			}
			// console.log("Key up: " + event.key);
		}

		if ( ['w','a','s','d'].includes(event.key) ) {
			this.checkWASDInputs();
		}
	}

	onKeyPressed( event ) {
		if (this.keyboardEventsList.some(r=> ['w','a','s','d'].includes(r))) {
			this.checkWASDInputs();
		}
	}

	checkWASDInputs() {
		// WASD INPUTS
        // w/s = y vector
		if ( this.keyboardEventsList.includes('w') && this.keyboardEventsList.includes('s') ) {
			this.playerXZ.setY(0);
		}
		else if ( this.keyboardEventsList.includes('w') ) {
			this.playerXZ.setY(1);
		}
		else if ( this.keyboardEventsList.includes('s') ) {
			this.playerXZ.setY(-1);
		}
		else {
			this.playerXZ.setY(0);
		}
        // a/d = x vector
		if ( this.keyboardEventsList.includes('a') && this.keyboardEventsList.includes('d') ) {
			this.playerXZ.setX(0);
		}
		else if ( this.keyboardEventsList.includes('a') ) {
			this.playerXZ.setX(1);
		}
		else if ( this.keyboardEventsList.includes('d') ) {
			this.playerXZ.setX(-1);
		}
		else {
			this.playerXZ.setX(0);
		}

		this.game.player.XZinput = this.playerXZ;
	}

}


export default Input;
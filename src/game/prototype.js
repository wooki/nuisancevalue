const PIXI = require('pixi.js');
const uiStyles = require('./scss/ui.scss');
const globalStyles = require('./styles.js');
const Utils = require('./gameUtils.js');

// prototype station for viewing and controlling a player ship
module.exports = function() {

	return {
		images: {
			starfury: require('../assets/starfury.png'),
			ship: require('../assets/ship.png'),
			asteroid: require('../assets/asteroid.png'),
			sol: require('../assets/sol.png'),
			earth: require('../assets/earth.png')
		},
		Colors: {
			Black: 0x000000,
			Grid: 0x161616,
			GridDark: 0x090909,
			White: 0xFFFFFF,
			Red: 0xFF0000,
			Dashboard: 0x444444
		},
		zIndex: { // does this even work?
			grid: 1,
			asteroid: 10,
			ship: 50,
			dashboard: 100
		},

		pixiApp: null,
		loadedSprites: false,
		sprites: {},
		// baseUrl: "http://localhost:5000/", // not needed
		baseUrl: "/",
		UiWidth: window.innerWidth,
		UiHeight: window.innerHeight,
		narrowUi: window.innerHeight, // updated in init
		scale: 1, // updated in init
		grid: false,
		gridText: [],
		stationRoot: null,
		gridSize: 1024, // updated based on scale, in init
		stationData: null,
		serverX: 0,
		serverY: 0,
		engineOnEl: null,
		engineOffEl: null,
		lastServerData: null,
		mapObjects: {},

		// update includes scaling of offset, so nothing else should scale (except size) of player ship
		// additional objects position will need to be scaled (player ship is always centre)
		updateGrid: function(shipX, shipY) {

			if (this.sprites.gridSprite) {

				// rorate the xy to match the rotation of the ship (otherwise we)
				// plot this without including the rotation of the grid
				let positionChange = new PIXI.Point(shipX * this.scale, shipY * this.scale);
				let positionMatrix = new PIXI.Matrix();
				// positionMatrix.rotate(Utils.degreesToRadians(0 - (angle % 360)));
				positionChange = positionMatrix.apply(positionChange);

				// this.sprites.gridSprite.tileTransform.rotation = 0 - Utils.degreesToRadians(angle % 360);
				this.sprites.gridSprite.tilePosition.x = Math.floor(this.UiWidth / 2) - positionChange.x;
				this.sprites.gridSprite.tilePosition.y = Math.floor(this.UiHeight / 2) - positionChange.y;
			}
		},

		tick: function() {
			let elapsedMS = this.pixiApp.ticker.elapsedMS; // since last tick

			// since last server update
			let timestamp = performance.now();
			if (this.lastServerData) {
				elapsedMS = timestamp - this.lastServerData;
			}

			// predict movement since last tick
			if (this.stationData && this.stationData.gameState == 'running' &&
				this.stationData.shipData && this.sprites.gridSprite) {

				let dX = elapsedMS * (this.stationData.shipData.dX);
				let dY = elapsedMS * (this.stationData.shipData.dY);

				if (this.stationData.commands && this.stationData.commands.engine == 'active') {
					// add acceleration to delta
					let acceleration = new PIXI.Point(0, 0 - (elapsedMS * this.stationData.shipData.acceleration));
					let accelerationMatrix = new PIXI.Matrix();
					accelerationMatrix.rotate(Utils.degreesToRadians(this.stationData.shipData.angle));
					acceleration = accelerationMatrix.apply(acceleration);
					// dX = dX + acceleration.x;
					// dY = dY + acceleration.y;
					dX = dX + (elapsedMS * acceleration.x);
					dY = dY + (elapsedMS * acceleration.y);
				}

				// apply objects vector to it's position
				let x = this.serverX;
				let y = this.serverY;

				if ((dX != 0) || (dY != 0)) {

					x = x + dX;
					y = y + dY;
				}

				// if we are firing port/starboard then add angular velocity once
				let dAngle = (elapsedMS * this.stationData.shipData.angularVelocity);

				if (this.stationData.commands && this.stationData.commands.port == 'active') {
					dAngle = dAngle - this.stationData.shipData.angularAcceleration;
				}
				if (this.stationData.commands && this.stationData.commands.starboard == 'active') {
					dAngle = dAngle + this.stationData.shipData.angularAcceleration;
				}

				// rotare according to angular velocity
				let angle = (this.stationData.shipData.angle + dAngle) % 360;
				if (this.sprites && this.sprites.ship) {
					this.sprites.ship.angle = angle;
				}

				// update grid tile
				if ((dX != 0) || (dY != 0) || dAngle != 0) {
					this.updateGrid(x, y);
				}

				// remove any objects no longer in the data, update or add others
				let objGuids = [];
				if (this.stationData.objects) {
					this.stationData.objects.forEach((obj) => {
						objGuids.push(obj.guid); // remmeber so we can remove any not in latest data

						let sprite = this.mapObjects[obj.guid];

						// if we have this object, update it
						if (!sprite) {
							// add it
							sprite = new PIXI.Sprite(this.resources[this.baseUrl+this.images[obj.texture]].texture);
							sprite.anchor.set(0.5);
							sprite.width = obj.size * this.scale;
							sprite.height = obj.size * this.scale;
							sprite.zIndex = this.zIndex.asteroid;
							sprite.angle = obj.angle || 0;
						}

						// objects have their own timestamp so try and figure out elapsed time
						let objTimestamp = new Date(obj.updatedAt).getTime();
						let objTimestampNow = new Date().getTime();
						let objDifference = objTimestampNow - objTimestamp;
						let objElapsedMS = (performance.now() - objDifference) + this.serverOffset;

						// TODO: adjust for it's acceleration

						// adjust for its vector and rotation
						let objX = obj.x;
						let objY = obj.y;
						if ((obj.dX != 0) || (obj.dY != 0)) {
							objX = objX + (objElapsedMS * obj.dX);
							objY = objY + (objElapsedMS * obj.dY);
						}

						if (obj.angularVelocity) {
							sprite.angle = ((obj.angle || 0) + (objElapsedMS * obj.angularVelocity)) % 360;
						}

						// set it's position relative to the ship (centre of screen)
						let spritePos = Utils.relativeScreenCoord(objX, objY, x, y, this.UiWidth, this.UiHeight, 0, this.scale);
						sprite.x = spritePos.x;
						sprite.y = spritePos.y;

						// only add at the end (so the props are right)
						if (!this.mapObjects[obj.guid]) {
							this.mapObjects[obj.guid] = sprite;
							this.pixiApp.stage.addChild(sprite);
						}
					});
				}

				// remove any we haven't got in the latest data
				Object.keys(this.mapObjects).forEach((guid) => {
					if (this.mapObjects[guid] && !objGuids.includes(guid)) {
						this.mapObjects[guid].destroy();
						this.mapObjects[guid] = null;
					}
				});

			}
		},

		loadResources: function(loader, resources) {

			this.loadedSprites = true;
			this.resources = resources;

			// create a texture for the grid background
			let gridGraphics = new PIXI.Graphics();
			gridGraphics.lineStyle(1, this.Colors.Grid);
			gridGraphics.drawRect(0, 0, this.gridSize, this.gridSize);
			gridGraphics.lineStyle(1, this.Colors.GridDark);
			gridGraphics.moveTo((this.gridSize / 2), 10);
			gridGraphics.lineTo((this.gridSize / 2), (this.gridSize - 10));
			gridGraphics.moveTo(10, (this.gridSize / 2));
			gridGraphics.lineTo((this.gridSize - 10), (this.gridSize / 2));
			let gridTexture = this.pixiApp.renderer.generateTexture(gridGraphics);
			this.sprites.gridSprite = new PIXI.TilingSprite(gridTexture, this.gridSize, this.gridSize);
			this.sprites.gridSprite.anchor.set(0.5);
			this.sprites.gridSprite.x = Math.floor(this.UiWidth / 2);
			this.sprites.gridSprite.y = Math.floor(this.UiHeight / 2);
			this.sprites.gridSprite.width = this.UiWidth;
			this.sprites.gridSprite.height = this.UiHeight;
			this.sprites.gridSprite.zIndex = this.zIndex.grid;
			this.pixiApp.stage.addChild(this.sprites.gridSprite);
			this.updateGrid(0, 0);

			// player ship
			this.sprites.ship = new PIXI.Sprite(resources[this.baseUrl+this.images.starfury].texture);
			this.sprites.ship.anchor.set(0.5);
			this.sprites.ship.scale.x = this.scale; // scale the ship
			this.sprites.ship.scale.y = this.scale;
			this.sprites.ship.x = Math.floor(this.pixiApp.screen.width / 2);
			this.sprites.ship.y = Math.floor(this.pixiApp.screen.height / 2);
			this.sprites.zIndex = this.zIndex.ship;
			this.pixiApp.stage.addChild(this.sprites.ship);

			// UI create a texture to overlay on top of the background
			let dashboardGraphics = new PIXI.Graphics();
			dashboardGraphics.beginFill(this.Colors.Dashboard, 1);
			dashboardGraphics.drawRect(0, 0, this.UiWidth, this.UiHeight);
			dashboardGraphics.endFill();
			let dashboardTexture = this.pixiApp.renderer.generateTexture(dashboardGraphics);
			this.sprites.dashboardSprite = new PIXI.Sprite(dashboardTexture);
			this.sprites.dashboardSprite.anchor.set(0.5);
			this.sprites.dashboardSprite.x = Math.floor(this.UiWidth / 2);
			this.sprites.dashboardSprite.y = Math.floor(this.UiHeight / 2);
			this.sprites.dashboardSprite.width = this.UiWidth;
			this.sprites.dashboardSprite.height = this.UiHeight;
			this.sprites.dashboardSprite.zIndex = this.zIndex.dashboard;

			let dashboardMaskGraphics = new PIXI.Graphics();
			dashboardMaskGraphics.beginFill(this.Colors.Black, 1);
			dashboardMaskGraphics.drawRect(0, 0, this.UiWidth, this.UiHeight);
			dashboardMaskGraphics.endFill();
			dashboardMaskGraphics.beginHole();
			dashboardMaskGraphics.drawCircle(this.sprites.dashboardSprite.x, this.sprites.dashboardSprite.y, Math.floor(this.narrowUi / 2));
			dashboardMaskGraphics.endHole();
			this.sprites.dashboardSprite.invertMask = true;
			this.sprites.dashboardSprite.mask = dashboardMaskGraphics;
			this.pixiApp.stage.addChild(this.sprites.dashboardSprite);

			// add ui might as well use html for the stuff it's good at
			this.drawUi(this.body, this.stationRoot);

			// make changes to scene in tick
			this.pixiApp.ticker.add(this.tick.bind(this));

			// re-run server if this runs after initial update
			this.update(this.stationData);

		},

		setSizes: function() {

			// get the smaller of the two dimensions, work to that
			// size for the map etc. so we can draw a circle
			this.narrowUi = this.UiWidth;
			if (this.UiHeight < this.narrowUi) {
				this.narrowUi = this.UiHeight;
			}

			// decide how much "game space" is represented by the narrowUI dimension
			this.scale = (this.narrowUi / 2000);

			// grid is always 1024 but scaled
			this.gridSize = Math.floor(1000 * this.scale);
		},

		init: function(body, stationRoot, serverOffset) {

			this.body = body;
			this.stationRoot = stationRoot;
			this.serverOffset = serverOffset;

			this.setSizes();

			// create pixie app
			this.pixiApp = new PIXI.Application({
				width: this.UiWidth,
				height: this.UiHeight,
				backgroundColor: this.Colors.Black,
				resolution: window.devicePixelRatio || 1
			});
			this.pixiApp.stage.sortableChildren = true;
			this.body.appendChild(this.pixiApp.view);

			// prepare to load resources
			const loader = PIXI.Loader.shared;

			// load sprites
			this.pixiApp.loader.add(this.baseUrl+this.images.starfury);
			this.pixiApp.loader.add(this.baseUrl+this.images.ship);
			this.pixiApp.loader.add(this.baseUrl+this.images.asteroid);
			this.pixiApp.loader.add(this.baseUrl+this.images.sol);
			this.pixiApp.loader.add(this.baseUrl+this.images.earth);

			// manage loading of resources
			this.pixiApp.loader.load(this.loadResources.bind(this));

		},

		createButton: function(container, id, innerHTML, onClick) {

			let button = document.createElement("button");
			button.id = id;
			button.classList.add(uiStyles.button);
			button.innerHTML = innerHTML;
			button.addEventListener('click', onClick);
			container.appendChild(button);
			return button;
		},

		createLabel: function(container, id, innerHTML) {

			let label = document.createElement("label");
			label.id = id;
			label.classList.add(uiStyles.label);
			label.innerHTML = innerHTML;
			container.appendChild(label);
			return label;
		},

		// draw some controls
		drawUi: function(container, stationRoot) {
			let uiContainer = document.createElement("div");
			uiContainer.classList.add(uiStyles.ui);
			container.appendChild(uiContainer);

			this.speedEl = this.createLabel(uiContainer, "speedEl", "Speed: ?");
			this.vectorEl = this.createLabel(uiContainer, "vectorEl", "Vector: ?");
			this.angleEl = this.createLabel(uiContainer, "angleEl", "Angle: ?");
			this.rotationEl = this.createLabel(uiContainer, "rotationEl", "Rotation: ?");

			this.engineOnEl = this.createButton(uiContainer, "engineOnBtn", "Engine Burn", () => {
				if (!this.engineOnEl.classList.contains("disabled")) {
					stationRoot.child('commands').child('engine').set("active");
				}
			});

			this.engineOffEl = this.createButton(uiContainer, "engineOffBtn", "Cease Burn", () => {
				if (!this.engineOffEl.classList.contains("disabled")) {
					stationRoot.child('commands').child('engine').set("inactive");
				}
			});

			let uiManeuverContainer = document.createElement("div");
			uiManeuverContainer.classList.add(uiStyles.maneuver);
			uiContainer.appendChild(uiManeuverContainer);

			this.manPortEl = this.createButton(uiManeuverContainer, "manPortBtn", "<", () => {
				if (!this.manPortEl.classList.contains("disabled")) {
					this.manPortEl.classList.add("disabled")
					stationRoot.child('commands').child('port').set("active");
				}
			});

			this.manStarboardEl = this.createButton(uiManeuverContainer, "manStarboardBtn", ">", () => {
				if (!this.manStarboardEl.classList.contains("disabled")) {
					this.manStarboardEl.classList.add("disabled")
					stationRoot.child('commands').child('starboard').set("active");
				}
			});

		},

		// data from the server
		update: function(stationData) {

			// store the data
			this.stationData = stationData;

			// // before we have loaded we can't do anything
			if (!this.loadedSprites || !this.stationData) {
				return;
			}

			// set a timestamp for lastServerData and position of ship so that all local
			// updates can be based from there
			if (this.stationData.shipData) {

				let timestamp = new Date(this.stationData.shipData.updatedAt).getTime();
				let timestampNow = new Date().getTime();
				let difference = timestampNow - timestamp;
				this.lastServerData = (performance.now() - difference) + this.serverOffset;

				if (this.engineOnEl && this.engineOffEl && this.stationData.shipData.engine == "active") {
					// this.stationData.commands && this.stationData.commands.engine == "active") {
					this.engineOnEl.classList.add("disabled");
					this.engineOffEl.classList.remove("disabled");
				} else {
					this.engineOnEl.classList.remove("disabled");
					this.engineOffEl.classList.add("disabled");
				}

				if (this.manPortEl && this.stationData.shipData.port == "inactive") {
					this.manPortEl.classList.remove("disabled");
				} else {
					this.manPortEl.classList.add("disabled");
				}

				if (this.manStarboardEl && this.stationData.shipData.starboard == "inactive") {
					this.manStarboardEl.classList.remove("disabled");
				} else {
					this.manStarboardEl.classList.add("disabled");
				}

				// get distance of vector as thousand pixels per second
				if (this.speedEl) {
					let dX = this.stationData.shipData.dX;
					let dY = this.stationData.shipData.dY;
					let distance = Math.hypot(dX, dY);
					this.speedEl.innerHTML = "Speed: " + (Math.round(distance * 10000)/10000) + " K/S";
				}
				if (this.vectorEl) {
					let dX = this.stationData.shipData.dX;
					let dY = this.stationData.shipData.dY;
					let radians = Math.atan2(dX, -1 * dY);
					if (radians < 0) { radians = radians + (2*Math.PI); }
					this.vectorEl.innerHTML = "Vector: " + Math.round(Utils.radiansToDegrees(radians)) + " °";
				}

				if (this.angleEl) {
					this.angleEl.innerHTML = "Angle: " + Math.round(this.stationData.shipData.angle) + "°";
				}

				if (this.rotationEl) {
					this.rotationEl.innerHTML = "Rotation: " + Math.round(this.stationData.shipData.angularVelocity * 1000) + "°/S";
				}

				this.serverX = this.stationData.shipData.x;
				this.serverY = this.stationData.shipData.y;

				// rotate the ship
				if (this.sprites && this.sprites.ship) {
					this.sprites.ship.angle = this.stationData.shipData.angle;
				}

				this.updateGrid(this.serverX, this.serverY);

			}



		}



	}


}();
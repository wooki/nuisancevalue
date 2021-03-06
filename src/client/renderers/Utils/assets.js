module.exports = {
	Sounds: {
		cannon: 'assets/sounds/cannon.mp3',
		click: 'assets/sounds/click.mp3',
		collision: 'assets/sounds/collision.mp3',
		engine: 'assets/sounds/engine.mp3',
		torp: 'assets/sounds/torp.mp3',
		explosion: 'assets/sounds/explosion.mp3',
		theme: 'assets/sounds/theme.mp3'
	},
	Images: {
		asteroid0: 'assets/asteroid-0.png',
		asteroid1: 'assets/asteroid-1.png',
		asteroid2: 'assets/asteroid-2.png',
		asteroid3: 'assets/asteroid-3.png',
		asteroid4: 'assets/asteroid-4.png',
		asteroid5: 'assets/asteroid-5.png',
		sol: 'assets/sol.png',
		mercury: 'assets/mercury.png',
		venus: 'assets/venus.png',
		earth: 'assets/earth.png',
		moon: 'assets/moon.png',
		mars: 'assets/mars.png',
		jupiter: 'assets/jupiter.png',
		saturn: 'assets/saturn.png',
		uranus: 'assets/uranus.png',
		neptune: 'assets/neptune.png',
		pluto: 'assets/pluto.png',
		explosion: 'assets/explosion.json',
		dashboard: 'assets/bg.png',
		arrow: 'assets/arrow.png',
		target: 'assets/target.png',
		selection: 'assets/selection.png',
		select: 'assets/select.png',
		focus: 'assets/focus.png',
		waypoint: 'assets/waypoint.png',
		orbitwaypoint: 'assets/orbitwaypoint.png',
		pdchud: 'assets/pdchud.png',
		// space: 'assets/space.png',
		// black: 'assets/black.png',
		spaceblack: 'assets/spaceblack.png',
		exhaust: 'assets/exhaust.json',
		exhaustflame: 'assets/exhaustflame.json',
		powergridBackground: 'assets/powergrid.jpg',
		powerlines: 'assets/powerlines.json',
		scanAnimation: 'assets/scanning.gif',
		scan: 'assets/scan.png'
	},
	Colors: {
		Black: 0x000000,
		SpaceBlack: 0x392d37,
		Grid: 0x4B1E44,
		GridSmall: 0x392d37,
		Dial: 0xbcbdad,
		DialRGB: [0.74, 0.74, 0.68],
		White: 0xFFFFFF,
		Red: 0xFF0000,
		Dashboard: 0x392d37,
		Friend: 0x75EE10,
		Neutral: 0x1499C5,
		Enemy: 0xEF1053,
		EnemyRGB: [0.94, 0.06, 0.33],
		Paths: {
			Other: 0xEF1053,
			Gravity: 0x2966C0,
			Heading: 0x1DD634,
			Target: 0xF8004B,
			Torp: 0x222222,
			Waypoint: 0xFFAE22,
			Bearing: 0xFF8300,
			GravityRGB: [0.16, 0.40, 0.75],
			BearingRGB: [1, 0.54, 0],
			HeadingRGB: [0.11, 0.84, 0.20],
			WaypointRGB: [1, 0.68, 0.13],
			TargetRGB: [0.97, 0, 0.29],
			BearingHex: '#FF8300',
			GravityHex: '#2966C0',
			HeadingHex: '#1DD634',
			WaypointHex: '#FFAE22',
			TargetHex: '#F8004B'
		},
		ForTexture: {
			sol: 0xfed25b,
			mercury: 0x46436d,
			venus: 0xd4b07c,
			earth: 0x809ad1,
			mars: 0xbf593a,
			jupiter: 0xcf9764,
			saturn: 0xdcc983,
			uranus: 0xcef4f5,
			neptune: 0x3e59d8,
			pluto: 0xdbcebb
		},
		Systems: {
			0: 0x392d37, // reactor
			2: 0xF8004B, // SYS__SENSORS
			4: 0x2966C0, // SYS_ENGINE
			8: 0x1DD634, // SYS_MANEUVER
			16: 0x5944E0, // SYS_TORPS
			32: 0x75EE10, // SYS_PDC
			64: 0x1499C5, // SYS_LIFE
			128: 0xFFAE22, // SYS_CONSOLES
			256: 0x4B1E44, // SYS_NAV
			512: 0xEF1053, // SYS_RELOAD
			1024: 0xFF8300, // SYS_FUEL
		}
	},

	Fonts: {
		Mono: "\"Electrolize\",\"Lucida Console\",\"Lucida Sans Typewriter\",\"Bitstream Vera Sans Mono\",monospace",
		Regular: "\"Oswald\",\"Lucida Console\",\"Lucida Sans Typewriter\",\"Bitstream Vera Sans Mono\",sans-serif"
	},
	Units: {
		speed: ' Mm/s',
		distance: ' Mm',
		force: ' N',
		mass: ' kg',
		time: ' s'
	},
}

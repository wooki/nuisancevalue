// hard-coded reference data
export default class Factions {

	// set up all the factions - these can't be changed in game
  constructor() {

		this.friendly = 0;
		this.neutral = 1;
		this.hostile = 2;

		this.independentIndex = 0;
		this.spaceForceIndex = 1;
		this.piratesIndex = 2;

		this.factions = [];

		this.factions[independentIndex] = {
			name: 'Independent',
			relations: [1, 1, 2]
		}

		this.factions[spaceForceIndex] = {
			name: 'Space Force',
			relations: [1, 0, 2]
		}

		this.factions[piratesIndex] = {
			name: 'Pirates',
			relations: [1, 2, 2]
		}
	}

	getFaction(id) {
		return this.factions[id];
	}

	isFriendly(faction1Id, faction2Id) {
		return (this.factions[faction1Id][faction2Id] == this.friendly && this.factions[faction2Id][faction1Id] == this.friendly);
	}

	isHostile(faction1Id, faction2Id) {
		return (this.factions[faction1Id][faction2Id] == this.hostile || this.factions[faction2Id][faction1Id] == this.hostile);
	}


}

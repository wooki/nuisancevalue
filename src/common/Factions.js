// hard-coded reference data
export default class Factions {

	// set up all the factions
  constructor() {

		this.friendly = 0;
		this.neutral = 1;
		this.hostile = 2;

		this.independent = Math.pow(2, 0); // often the player - usualy neutral/friendly to all
		this.spaceForce = Math.pow(2, 1); // galactic police
		this.pirates = Math.pow(2, 2); // enemy to all
    this.colonists = Math.pow(2, 3); // often preyed on by corps or pirates
    this.russian = Math.pow(2, 4); // national, at war with ferrous
    this.russianWar = Math.pow(2, 5); // national, at war with commonwealth & ferrous
    this.chinese = Math.pow(2, 6); // national
    this.chineseWar = Math.pow(2, 7); // national, at war with corporations
    this.commonwealth = Math.pow(2, 8); // national, at war with colonists
    this.mikkei = Math.pow(2, 9); // corporation, Mikkei Combine at war with ferrous and russian
    this.jupiter = Math.pow(2, 10); // corporation, JMC Jupiter Mining Corp
    this.ferrous = Math.pow(2, 11); // corporation, FC Ferrous Corp, at war with colonists and mikkei
    this.defaultFaction = 1;

    this.factions = {};
    this.defaultRelations = {};
    this.defaultRelations[this.independent] = 1;
    this.defaultRelations[this.spaceForce] = 1;
    this.defaultRelations[this.pirates] = 1;
    this.defaultRelations[this.colonists] = 1;
    this.defaultRelations[this.russian] = 1;
    this.defaultRelations[this.russianWar] = 1;
    this.defaultRelations[this.chinese] = 1;
    this.defaultRelations[this.chineseWar] = 1;
    this.defaultRelations[this.commonwealth] = 1;
    this.defaultRelations[this.mikkei] = 1;
    this.defaultRelations[this.jupiter] = 1;
    this.defaultRelations[this.ferrous] = 1;


		this.factions[this.independent] = {
			name: 'Independent',
      color: 0x3d43b4,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.independent].relations[this.colonists] = this.friendly;


		this.factions[this.spaceForce] = {
			name: 'Space Force',
      color: 0x0016ee,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.spaceForce].relations[this.spaceForce] = this.friendly;
    this.factions[this.spaceForce].relations[this.russianWar] = this.hostile;
    this.factions[this.spaceForce].relations[this.chineseWar] = this.hostile;


    this.factions[this.pirates] = {
			name: 'Pirates',
      color: 0xff184c,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.pirates].relations[this.independent] = this.hostile;
    this.factions[this.pirates].relations[this.spaceForce] = this.hostile;
    this.factions[this.pirates].relations[this.pirates] = this.hostile;
    this.factions[this.pirates].relations[this.colonists] = this.hostile;
    this.factions[this.pirates].relations[this.russian] = this.hostile;
    this.factions[this.pirates].relations[this.russianWar] = this.hostile;
    this.factions[this.pirates].relations[this.chinese] = this.hostile;
    this.factions[this.pirates].relations[this.chineseWar] = this.hostile;
    this.factions[this.pirates].relations[this.commonwealth] = this.hostile;
    this.factions[this.pirates].relations[this.mikkei] = this.hostile;
    this.factions[this.pirates].relations[this.jupiter] = this.hostile;
    this.factions[this.pirates].relations[this.ferrous] = this.hostile;

    this.factions[this.colonists] = {
			name: 'Colonists',
      color: 0x083e12,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.colonists].relations[this.colonists] = this.friendly;
    this.factions[this.colonists].relations[this.independent] = this.friendly;
    this.factions[this.colonists].relations[this.commonwealth] = this.hostile;
    this.factions[this.colonists].relations[this.ferrous] = this.hostile;

    this.factions[this.russian] = {
			name: 'Russian Federation',
      color: 0x860029,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.russian].relations[this.russian] = this.friendly;
    this.factions[this.russian].relations[this.russianWar] = this.friendly;
    this.factions[this.russian].relations[this.ferrous] = this.hostile;

    this.factions[this.russianWar] = {
			name: 'Russian Federation',
      color: 0x860029,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.russianWar].relations[this.russian] = this.friendly;
    this.factions[this.russianWar].relations[this.russianWar] = this.friendly;
    this.factions[this.russianWar].relations[this.ferrous] = this.hostile;
    this.factions[this.russianWar].relations[this.commonwealth] = this.hostile;

    this.factions[this.chinese] = {
			name: 'People\'s Republic of China',
      color: 0xff124f,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.chinese].relations[this.chinese] = this.friendly;
    this.factions[this.chinese].relations[this.chineseWar] = this.friendly;

    this.factions[this.chineseWar] = {
			name: 'People\'s Republic of China',
      color: 0xff124f,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.chineseWar].relations[this.chinese] = this.friendly;
    this.factions[this.chineseWar].relations[this.chineseWar] = this.friendly;
    this.factions[this.chineseWar].relations[this.mikkei] = this.hostile;
    this.factions[this.chineseWar].relations[this.jupiter] = this.hostile;
    this.factions[this.chineseWar].relations[this.ferrous] = this.hostile;

    this.factions[this.commonwealth] = {
			name: 'Commonwealth of Nations',
      color: 0xff6e27,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.commonwealth].relations[this.commonwealth] = this.friendly;
    this.factions[this.commonwealth].relations[this.colonists] = this.hostile;
    this.factions[this.commonwealth].relations[this.russianWar] = this.hostile;

    this.factions[this.mikkei] = {
			name: 'Mikkei Combine',
      color: 0x65dc98,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.mikkei].relations[this.mikkei] = this.friendly;
    this.factions[this.mikkei].relations[this.chineseWar] = this.hostile;
    this.factions[this.mikkei].relations[this.ferrous] = this.hostile;

    this.factions[this.jupiter] = {
			name: 'Jupiter Mining Corporation',
      color: 0xffe69d,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.jupiter].relations[this.jupiter] = this.friendly;
    this.factions[this.mikkei].relations[this.chineseWar] = this.hostile;

    this.factions[this.ferrous] = {
			name: 'Ferrous Corp',
      color: 0xff2a6d,
			relations: Object.assign({}, this.defaultRelations)
		}
    this.factions[this.ferrous].relations[this.ferrous] = this.friendly;
    this.factions[this.ferrous].relations[this.russian] = this.hostile;
    this.factions[this.ferrous].relations[this.russianWar] = this.hostile;
    this.factions[this.ferrous].relations[this.chineseWar] = this.hostile;
    this.factions[this.ferrous].relations[this.mikkei] = this.hostile;

	}

	getFaction(id) {
		return this.factions[id];
	}

	isFriendly(faction1Id, faction2Id) {
    if (!this.factions[faction1Id] || !this.factions[faction2Id]) {
      console.log("Missing Faction Info:"+faction1Id+"/"+faction2Id);
      console.dir(this.factions);
      console.trace();
      return false;
    }
    return (this.factions[faction1Id].relations[faction2Id] == this.friendly && this.factions[faction2Id].relations[faction1Id] == this.friendly);
	}

	isHostile(faction1Id, faction2Id) {
    if (!this.factions[faction1Id] || !this.factions[faction2Id]) {
      console.log("Missing Faction Info:"+faction1Id+"/"+faction2Id);
      console.dir(this.factions);
      console.trace();
      return false;
    }
		return (this.factions[faction1Id].relations[faction2Id] == this.hostile || this.factions[faction2Id].relations[faction1Id] == this.hostile);
	}


}

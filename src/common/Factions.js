// hard-coded reference data
export default class Factions {

	// set up all the factions
  constructor() {

		this.friendly = 0;
		this.neutral = 1;
		this.hostile = 2;

		this.independent = 1; // often the player - usualy neutral/friendly to all
		this.spaceForce = 2; // galactic police
		this.pirates = 3; // enemy to all
    this.colonists = 4; // often preyed on by corps or pirates
    this.russian = 5; // national, at war with ferrous
    this.russianWar = 6; // national, at war with commonwealth & ferrous
    this.chinese = 7; // national
    this.chineseWar = 8; // national, at war with corporations
    this.commonwealth = 9; // national, at war with colonists
    this.mikkei = 10; // corporation, Mikkei Combine at war with ferrous and russian
    this.jupiter = 11; // corporation, JMC Jupiter Mining Corp
    this.ferrous = 12; // corporation, FC Ferrous Corp, at war with colonists and mikkei
    this.defaultFaction = 1;

    this.defaultRelations = [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		this.factions = [];

		this.factions[this.independent] = {
			name: 'Independent',
			relations: this.defaultRelations.slice()
		}
    this.factions[this.independent].relations[this.colonists] = this.friendly;


		this.factions[this.spaceForce] = {
			name: 'Space Force',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.spaceForce].relations[this.spaceForce] = this.friendly;
    this.factions[this.spaceForce].relations[this.russianWar] = this.hostile;
    this.factions[this.spaceForce].relations[this.chineseWar] = this.hostile;


    this.factions[this.pirates] = {
			name: 'Pirates',
      relations: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
		}

    this.factions[this.colonists] = {
			name: 'Colonists',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.colonists].relations[this.colonists] = this.friendly;
    this.factions[this.colonists].relations[this.independent] = this.friendly;
    this.factions[this.colonists].relations[this.commonwealth] = this.hostile;
    this.factions[this.colonists].relations[this.ferrous] = this.hostile;

    this.factions[this.russian] = {
			name: 'Russian Federation',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.russian].relations[this.russian] = this.friendly;
    this.factions[this.russian].relations[this.russianWar] = this.friendly;
    this.factions[this.russian].relations[this.ferrous] = this.hostile;

    this.factions[this.russianWar] = {
			name: 'Russian Federation',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.russianWar].relations[this.russian] = this.friendly;
    this.factions[this.russianWar].relations[this.russianWar] = this.friendly;
    this.factions[this.russianWar].relations[this.ferrous] = this.hostile;
    this.factions[this.russianWar].relations[this.commonwealth] = this.hostile;

    this.factions[this.chinese] = {
			name: 'People\'s Republic of China',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.chinese].relations[this.chinese] = this.friendly;
    this.factions[this.chinese].relations[this.chineseWar] = this.friendly;

    this.factions[this.chineseWar] = {
			name: 'People\'s Republic of China',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.chineseWar].relations[this.chinese] = this.friendly;
    this.factions[this.chineseWar].relations[this.chineseWar] = this.friendly;
    this.factions[this.chineseWar].relations[this.mikkei] = this.hostile;
    this.factions[this.chineseWar].relations[this.jupiter] = this.hostile;
    this.factions[this.chineseWar].relations[this.ferrous] = this.hostile;

    this.factions[this.commonwealth] = {
			name: 'Commonwealth of Nations',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.commonwealth].relations[this.commonwealth] = this.friendly;
    this.factions[this.commonwealth].relations[this.colonists] = this.hostile;
    this.factions[this.commonwealth].relations[this.russianWar] = this.hostile;

    this.factions[this.mikkei] = {
			name: 'Mikkei Combine',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.mikkei].relations[this.mikkei] = this.friendly;
    this.factions[this.mikkei].relations[this.chineseWar] = this.hostile;
    this.factions[this.mikkei].relations[this.ferrous] = this.hostile;

    this.factions[this.jupiter] = {
			name: 'Jupiter Mining Corporation',
      relations: this.defaultRelations.slice()
		}
    this.factions[this.jupiter].relations[this.jupiter] = this.friendly;
    this.factions[this.mikkei].relations[this.chineseWar] = this.hostile;

    this.factions[this.ferrous] = {
			name: 'Ferrous Corp',
      relations: this.defaultRelations.slice()
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
      console.trace();
      return false;
    }
    return (this.factions[faction1Id].relations[faction2Id] == this.friendly && this.factions[faction2Id].relations[faction1Id] == this.friendly);
	}

	isHostile(faction1Id, faction2Id) {
    if (!this.factions[faction1Id] || !this.factions[faction2Id]) {
      console.log("Missing Faction Info:"+faction1Id+"/"+faction2Id);
      console.trace();
      return false;
    }
		return (this.factions[faction1Id].relations[faction2Id] == this.hostile || this.factions[faction2Id].relations[faction1Id] == this.hostile);
	}


}

//===================================================================================================================
// Class: Cell
// Author: Michael Y. Dickheiser
// 
// This class defines a cell for the Game of Life simulation.
//===================================================================================================================


class Cell
{
	static LIFE_STATE_DEAD = 0;
	static LIFE_STATE_ALIVE = 1;
	static LIFE_STATE_ZOMBIE = 2; // Dunno when I'll use this but here's hoping...
	
	static SPECIES_RED = 0;
	static SPECIES_GREEN = 1;
	static SPECIES_BLUE = 2;
	
	static currentGeneration = 0;
	static setCurrentGeneration(gen) { Cell.currentGeneration = gen; }
	
	// Color modes, purely for aesthetics
	static COLOR_MODE_SPECIES_DOMINANT = 0; 	// Species type dominates the colors to make it easy to see which species are surviving
	static COLOR_MODE_RGB = 1; 					// No weighting towards species - just encode the color entirely from DNA
	
	static colorMode = Cell.COLOR_MODE_SPECIES_DOMINANT;
	setColorMode(mode)
	{
		colorMode = mode;
	}
	
	Reset()
	{
		this.lifeState = Cell.LIFE_STATE_DEAD;
		this.species = Cell.SPECIES_RED;
		this.birthday = 0; 	// generation we were born in
		this.deathday = -1;
		this.age = 0;		// Age in #of generations since birth
		this.maxHealth = 10.0;
		this.health = this.maxHealth;
		this.lastHealth = this.health;	
	}
	
	//--------------------------------------------------------------------------------------
	// Use the GeneticAlgorithm API to create our traits
	// By default, set all trait values to 0.5 
	// However:
	// RED has much higher longevity and reproductivty 
	// GREEN has much higher poison Resistance and food efficiency
	// BLUE is much more resistant to loneliness and the effects of overpopulation
	//--------------------------------------------------------------------------------------
	constructDNA(randomize = false)
	{
		this.dna = [];
		
		// How well we resist the damaging effects of poison
		let startValue = this.species == Cell.SPECIES_GREEN ? 0.9 : 0.0;
		this.poisonResistanceTrait = new GeneticTrait(startValue, 0.0, 1.0, "Poison Resistance");
		
		// How efficiently we utilize food
		startValue = this.species == Cell.SPECIES_GREEN ? 0.9 : 0.2;
		this.foodEfficiencyTrait = new GeneticTrait(startValue, 0.0, 1.0, "Food Efficiency");
		
		// How well we resist the effects of the overpopulation rule
		startValue = this.species == Cell.SPECIES_BLUE ? 0.9 : 0.2;
		this.overpopulationResistanceTrait = new GeneticTrait(startValue, 0.0, 1.0, "Overpopulation Resistance");
		
		// How well we resist the effects of the underpopulation rule (loneliness resistance?)
		startValue = this.species == Cell.SPECIES_BLUE ? 0.9 : 0.2;
		this.underpopulationResistanceTrait = new GeneticTrait(startValue, 0.0, 1.0, "Underpopulation Resistance");
		
		// How long we live relative to others, all conditions being the same (basically, constitution)
		startValue = this.species == Cell.SPECIES_RED ? 0.9 : 0.3;
		this.longevityTrait = new GeneticTrait(startValue, 0.0, 1.0, "Longevity");
		
		// How likely we are to reproduce when circumstances allow it
		startValue = this.species == Cell.SPECIES_RED ? 0.9 : 0.3;
		this.reproductivityTrait = new GeneticTrait(startValue, 0.0, 1.0, "Reproductivity");
			
		if (randomize)
		{
			// Randomize all the trait values
			// todo: need to give user an interface to play with these
			this.poisonResistanceTrait.randomizeValue();
			this.foodEfficiencyTrait.randomizeValue();
			this.overpopulationResistanceTrait.randomizeValue();
			this.underpopulationResistanceTrait.randomizeValue();
			this.longevityTrait.randomizeValue();
			this.reproductivityTrait.randomizeValue();
		}
		
		// Add to our DNA
		this.dna.push(this.poisonResistanceTrait);
		this.dna.push(this.foodEfficiencyTrait);
		this.dna.push(this.overpopulationResistanceTrait);
		this.dna.push(this.underpopulationResistanceTrait);
		this.dna.push(this.longevityTrait);
		this.dna.push(this.reproductivityTrait);
	}
	
	// When activated with new DNA, set our explicit trait members for easy reference
	setDNA(dna)
	{
		if (dna)
		{
			this.dna = dna;
			this.poisonResistanceTrait = this.dna[0];
			this.foodEfficiencyTrait = this.dna[1];
			this.overpopulationResistanceTrait = this.dna[2];
			this.underpopulationResistanceTrait = this.dna[3];
			this.longevityTrait = this.dna[4];
			this.reproductivityTrait = this.dna[5];
		}
		else
		{
			this.constructDNA();
		}	
	}
	
	// Our color is derived from our species and dna. 
	computeColor()
	{
		let red = 0, green = 0, blue = 0;
		
		// In this color mode, the species color dominates, but traits favored by 
		// other species factor in as well
		if (Cell.colorMode == Cell.COLOR_MODE_SPECIES_DOMINANT)
		{
			if (this.species == Cell.SPECIES_RED)
			{
				red = 255;
				green = 64 * this.poisonResistanceTrait.getValue();
				green += 64 * this.foodEfficiencyTrait.getValue();
				blue = 64 * this.overpopulationResistanceTrait.getValue();
				blue += 64 * this.underpopulationResistanceTrait.getValue();
			}
			else if (this.species == Cell.SPECIES_GREEN)
			{
				green = 255;
				red = 64 * this.longevityTrait.getValue();
				red += 64 * this.reproductivityTrait.getValue();
				blue = 64 * this.overpopulationResistanceTrait.getValue();
				blue += 64 * this.underpopulationResistanceTrait.getValue();
			}
			else if (this.species == Cell.SPECIES_BLUE)
			{
				blue = 255;
				red = 64 * this.longevityTrait.getValue();
				red += 64 * this.reproductivityTrait.getValue();
				green = 64 * this.poisonResistanceTrait.getValue();
				green += 64 * this.foodEfficiencyTrait.getValue();
			}
		}
		else if (Cell.colorMode == Cell.COLOR_MODE_RGB)
		{
			// Kinda randomly, red is the sum of the first two traits, and so on
			red = (this.dna[0].getValue() * 0.5 + this.dna[1].getValue() * 0.5) * 255;
			green = (this.dna[2].getValue() * 0.5 + this.dna[3].getValue() * 0.5) * 255;
			blue = (this.dna[4].getValue() * 0.5 + this.dna[5].getValue() * 0.5) * 255;
		}
		
		// Fade out as health diminishes	
		let healthPercentage = this.getHealthPercentage();
		red = MyMath.clamp(red * healthPercentage, 0, 255);
		green = MyMath.clamp(green * healthPercentage, 0, 255);
		blue = MyMath.clamp(blue * healthPercentage, 0, 255);

		this.color = `rgb(${red}, ${green}, ${blue})`;
	}
	getColor() { return this.color; }
	
	constructor(dna = null)
	{
		this.Reset();
		if (dna == null)
		{
			this.constructDNA();
		}
		else
		{
			this.setDNA(dna);
		}
		this.computeColor();
	}
	
	isAlive() 		{ return this.lifeState == Cell.LIFE_STATE_ALIVE; 	 }
	getLifeState() 	{ return this.lifeState; }
	getSpecies()	{ return this.species;	 }
	getBirthday() 	{ return this.birthday; }
	getHealth()		{ return this.health;	}
	getHealthPercentage() { return this.health / this.maxHealth; }
	getAge() 		{ return this.age;	}
	getDNA() 		{ return this.dna;	}
	
	//---------------------------------------------------------------------------
	// Update
	//---------------------------------------------------------------------------
	update()
	{
		if (this.isAlive)
		{
			this.age++;
			
			this.wither();
		
			// If health has changed, update our color. Doing this "lazily" b/c perf
			if (this.health != this.lastHealth)
			{
				this.computeColor();
			}
		}
	}
	
	//---------------------------------------------------------------------------
	// Die!
	//---------------------------------------------------------------------------
	die()
	{
		if (this.isAlive())
		{
			this.deathday = Cell.currentGeneration; // sadness :( 
			this.lifeState = Cell.LIFE_STATE_DEAD;
		}
	}
	
	//---------------------------------------------------------------------------
	// Come alive!!
	//---------------------------------------------------------------------------
	comeAlive(species, dna = null)
	{
		if (!this.isAlive())
		{
			this.Reset();
			this.lifeState = Cell.LIFE_STATE_ALIVE;
			this.birthday = Cell.currentGeneration;
			this.health = this.maxHealth; 
			this.lastHealth = this.health;
			this.species = species;
			this.setDNA(dna);
			this.computeColor();
		}
	}
	
	//---------------------------------------------------------------------------
	// All cells decay each update unless genetic traits intervene
	//---------------------------------------------------------------------------
	
	// Slowly wither :(
	wither()
	{
		// High longevity can keep us alive a long time, but not forever
		let longevity = this.longevityTrait.getValue();
		longevity *= longevity; 
		let healthLostPerUpdate = MyMath.clamp(1.0 - longevity, 0.001, 1.0) * 0.01; // todo make user modifiable
		this.removeHealth(healthLostPerUpdate);
	}
	
	consumePoison(amount)
	{
		if (this.isAlive())
		{
			let damage = 0.1 * amount * (1.0 - this.poisonResistanceTrait.getValue());
			this.removeHealth(damage);
		}
	}
	
	removeHealth(amount)	
	{
		if (this.isAlive())
		{
			this.lastHealth = this.health;
			this.health -= amount;
		}
	}
	
	//---------------------------------------------------------------------------
	// addHealth()
	//---------------------------------------------------------------------------
	
	consumeFood(amount)
	{
		// Super simple. todo: something more interesting
		if (this.isAlive())
		{
			let addedHealth = 0.1 * amount * this.foodEfficiencyTrait.getValue();
			this.addHealth(addedHealth);
			//console.log(`Adding health: ${addedHealth}`);
		}
	}
	
	addHealth(amount)
	{
		if (this.isAlive())
		{
			this.lastHealth = this.health;
			this.health = MyMath.clamp(this.health + amount, 0.0, this.maxHealth);
		}
	}
}

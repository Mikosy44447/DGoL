//===================================================================================================================
// Class: LifeSimulation
// Author: Michael Y. Dickheiser
// 
// This class defines a complete Game of Life simulation with Conway's original rules plus my own additions. 
// Note: this class is not reponsible for rendering or user-input. It just simulates cellular automata. 
//===================================================================================================================

//-------------------------------------------------------------------------------------------------------------------
// Helper to setup a cell's change of state
//-------------------------------------------------------------------------------------------------------------------
class CellStateData
{
	constructor(id = -1)
	{
		this.stateChanged = false;
		this.lifeState = Cell.LIFE_STATE_DEAD;
		this.species = Cell.SPECIES_RED;
		this.dna = null;
		this.id = id; // to aid debugging
	}
}

//-------------------------------------------------------------------------------------------------------------------
// Main Simulation
//-------------------------------------------------------------------------------------------------------------------
class LifeSimulation
{
	static WORLD_WIDTH = 60;
	static WORLD_HEIGHT = 60;

	static SIM_TYPE_CONWAY = 0;
	static SIM_TYPE_DICKHEISER = 1;
	
	// Restart the simulation with a clean, empty world
	reset()
	{
		this.simGeneration = 0;
		this.worldPopulation = 0;
		this.paused = true;
		this.simulationStepping = false;
        this.cells = Array.from({ length: LifeSimulation.WORLD_WIDTH }, () =>  Array.from({ length: LifeSimulation.WORLD_HEIGHT }, () => new Cell()) );	
		
        this.nextCellStates = Array.from({ length: LifeSimulation.WORLD_WIDTH }, () => Array(LifeSimulation.WORLD_HEIGHT).fill(Cell.LIFE_STATE_DEAD));
        this.nextCellStates2 = Array.from({ length: LifeSimulation.WORLD_WIDTH }, () =>  Array.from({ length: LifeSimulation.WORLD_HEIGHT }, () => new CellStateData()) );	

		this.cellFoodAmounts = Array.from({ length: LifeSimulation.WORLD_WIDTH }, () => Array(LifeSimulation.WORLD_HEIGHT).fill(0.0));
		this.cellPoisonAmounts = Array.from({ length: LifeSimulation.WORLD_WIDTH }, () => Array(LifeSimulation.WORLD_HEIGHT).fill(0.0));

		this.dnaCounter = 0; // for generating id's, for debugging
	}
	
	constructor()
	{
		this.reset();
		this.simType = LifeSimulation.SIM_TYPE_CONWAY;
		
		// The genetic algorithm instance that will produce new generations 
		this.ga = new GeneticAlgorithm();
		
		// Scratch to avoid allocating over and over and over
		this.neighbors = new Array(8);
		
		// Rules for living and dying. Default to Conway
		this.minNeighborsForLivingCell = 2;
		this.maxNeighborsForLivingCell = 3;
		this.minNeighborsForCellBirth = 3;
		this.maxNeighborsForCellBirth = 3; // same as min, per Conway
		
		// GA control
		this.mutationChance = 0.02; 
		this.mutationAmount = 0.03; 
	}
	
	// Generation and population
	getGenerationCount(){ return this.simGeneration; }
	advanceGeneration()	{ this.simGeneration++;	}
	resetGeneration()	{ this.simGeneration = 0; }
	
	getWorldPopulation()		{ return this.worldPopulation;  	}
	setWorldPopulation(p) 		{ this.worldPopulation = p;			}
	incWorldPopulation(delta)	{ this.worldPopulation += delta; 	}
	
	// Simulaton Rules API
	setSimType(type) 				  { this.simType = type;				  }
	setMinNeighborsForLivingCell(min) { this.minNeighborsForLivingCell = min; }
	setMaxNeighborsForLivingCell(max) { this.maxNeighborsForLivingCell = max; }
	setMinNeighborsForCellBirth(min)  { this.minNeighborsForCellBirth = min;  }
	setMaxNeighborsForCellBirth(max)  { this.maxNeighborsForCellBirth = max;  }
	
	// Cells API
	getCells() { return this.cells; }
	getCell(x, y) { return this.cells[x][y]; } // TODO ERROR CHECK ****
	activateCell(x, y, species, dna = null) 
	{
		this.cells[x][y].comeAlive(species, dna);
	}
	killCell(x, y)
	{
		this.cells[x][y].die();
	}
	
	// temporary?
	setNextCellState(x, y, state)
	{
		this.nextCellStates[x][y] = state; // todo: error check
	}
	getNextCellState(x, y)
	{
		return this.nextCellStates[x][y]; // todo: error check
	}
	
	getCellLifeState(x, y)
	{
		if (x < 0 || y < 0 || x >= LifeSimulation.WORLD_WIDTH || y >= LifeSimulation.WORLD_HEIGHT)
		{
			return lifeSim.LIFE_STATE_DEAD;
		}
		//console.log(`Value of grid cell ${x},${y} is ${grid[x][y]}`);

		return lifeSim.getCell(x, y).getLifeState();
	}
	
	getCell(x, y)
	{
		if (x >= 0 && y >= 0 && x < LifeSimulation.WORLD_WIDTH && y < LifeSimulation.WORLD_HEIGHT)
		{
			return this.cells[x][y];
		}
	}
	
	getNeighborCount(x, y)
	{
		// todo: optimize how I'm doing this
		let count = 0;
		if (this.getCellLifeState(x-1, y) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x+1, y) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x, y-1) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x, y+1) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x-1, y-1) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x+1, y+1) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x-1, y+1) == Cell.LIFE_STATE_ALIVE) count++;
		if (this.getCellLifeState(x+1, y-1) == Cell.LIFE_STATE_ALIVE) count++;	
		return count; 
	}
	
	// Get all 8 neigboring cells 
	collectNeighborsForCell(x, y, result)
	{
		result[0] = this.getCell(x-1, y);
		result[1] = this.getCell(x+1, y);
		result[2] = this.getCell(x, y-1);
		result[3] = this.getCell(x, y+1);
		result[4] = this.getCell(x-1, y-1);
		result[5] = this.getCell(x+1, y-1);
		result[6] = this.getCell(x-1, y+1);
		result[7] = this.getCell(x+1, y+1);
	}
	
	// Randomly select a living neighbor, optionally caring about species mathcing and optionally ignoring a specific neighbor 
	chooseRandomLivingNeighbor(cell, neighborList, requireSameSpecies = false, ignoreCell = null)
	{
		// Pick a random index to start looping the neighbor list from
		let startIndex = MyMath.randomIntRanged(0, 7);
		for (let i = 0; i < 8; i++)
		{
			let index = (startIndex + i) % 8;
			let neighbor = neighborList[index];
			if (neighbor && neighbor.isAlive() && (!requireSameSpecies || (neighbor.getSpecies() == cell.getSpecies())) && (neighbor != ignoreCell) )
			{
				return neighbor;
			}
		}
	}
	
	//----------------------------------------------------------------------------	
	// Consumables
	//----------------------------------------------------------------------------	
	getGridFoodQuantity(x, y)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			return this.cellFoodAmounts[x][y];
		}
	}
	getGridPoisonQuantity(x, y)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			return this.cellPoisonAmounts[x][y];
		}
	}
	addFood(x, y, amount = 100.0)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			this.cellFoodAmounts[x][y] += amount;
		}
	}
	addPoison(x, y, amount = 100.0)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			this.cellPoisonAmounts[x][y] += amount; 
		}
	}
	removeFood(x, y, amount)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			this.cellFoodAmounts[x][y] -= amount;
			if (this.cellFoodAmounts[x][y] < 0.0)
				this.cellFoodAmounts[x][y] = 0.0;
		}
	}
	removePoison(x, y, amount)
	{
		if (x >= 0 && x < rows && y >= 0 && y < cols)
		{
			this.cellPoisonAmounts[x][y] -= amount;
			if (this.cellPoisonAmounts[x][y] < 0.0)
				this.cellPoisonAmounts[x][y] = 0.0;
		}
	}
	
	//----------------------------------------------------------------------------	
	// Update using the Conway model
	// The original one and only.
	// Todo: consolidate with the Dickheiser update since this is a subset of 
	// those rules.
	//----------------------------------------------------------------------------	
	updateConwayModel()
	{
		// Populate the next state of the grid
		for (let row = 0; row < rows; row++) 
		{
			for (let col = 0; col < cols; col++) 
			{
				var cell = this.cells[row][col];
				this.setNextCellState(row, col, cell.getLifeState());

				let neighborCount = this.getNeighborCount(row, col);
				if (cell.isAlive())
				{
					if (neighborCount < this.minNeighborsForLivingCell || neighborCount > this.maxNeighborsForLivingCell)
					{
						this.setNextCellState(row, col, Cell.LIFE_STATE_DEAD);
					}
				}
				else
				{
					if (neighborCount >= this.minNeighborsForCellBirth && neighborCount <= this.maxNeighborsForCellBirth) 
					{
						this.setNextCellState(row, col, Cell.LIFE_STATE_ALIVE);
					}
				}
			}
		}
		
		// Now apply next state to current
		this.worldPopulation = 0;
		for (let row = 0; row < rows; row++) 
		{
			for (let col = 0; col < cols; col++) 
			{
				var nextState = this.getNextCellState(row, col);
				if (nextState == Cell.LIFE_STATE_ALIVE)
				{
					this.activateCell(row, col);
				}
				else
				{
					this.killCell(row, col);
				}

				if (nextState == Cell.LIFE_STATE_ALIVE)
				{
					this.worldPopulation++;
				}
			}
		}
	}

	//----------------------------------------------------------------------------	
	// Update using the Dickheiser Model
	// The most amazing version ever. 
	// This still uses the Conway ruleset for potential life and death, but 
	// factors in genetic traits that influence the likelihood of such events 
	//----------------------------------------------------------------------------	
	updateDickheiserModel()
	{
		// Determine next state only, storing the results in the 2nd grid so that I can "swap" them all at once
		for (let row = 0; row < rows; row++) 
		{
			for (let col = 0; col < cols; col++) 
			{
				let cell = this.cells[row][col];
				// Start by copying the current state...many cells will not change from one update to the next
				this.nextCellStates2[row][col].stateChanged = false;
				this.nextCellStates2[row][col].dna = null;
				
				let neighborCount = this.getNeighborCount(row, col);
				if (cell.isAlive())
				{
					let timeToDie = false;
					if (cell.getHealth() <= 0.0)
					{
						timeToDie = true; 
					}
					else if (neighborCount < this.minNeighborsForLivingCell)
					{
						// Check our resistance to the underpopulation rule
						let damageFromLoneliness = 1.0 * (1.0 - cell.underpopulationResistanceTrait.getValue());
						cell.removeHealth(damageFromLoneliness);
					}
					//else if (neighborCount > 5) // 3
					else if (neighborCount > this.maxNeighborsForLivingCell)
					{
						// Check our resistance to the overpopulation rule
						let damageFromCrowding = 1.0 * (1.0 - cell.overpopulationResistanceTrait.getValue());
						cell.removeHealth(damageFromCrowding);
					}
					
					if (timeToDie)
					{
						this.nextCellStates2[row][col].stateChanged = true;
						this.nextCellStates2[row][col].lifeState = Cell.LIFE_STATE_DEAD;
					}
				}
				// Cell isn't alive but maybe it's time to come alive again
				else if (neighborCount >= this.minNeighborsForCellBirth && neighborCount <= this.maxNeighborsForCellBirth)
				{
					// Gather the neighbors who matter
					this.collectNeighborsForCell(row, col, this.neighbors);
			
					// We're bringing a cell to life. Randomly choose up to two neighbors to be its parents for the GA production.
					let neighbor1 = this.chooseRandomLivingNeighbor(cell, this.neighbors, false);
					if (neighbor1)
					{				
						// roll against the neighbors reproductivity 
						let roll = Math.random();
						if (roll <= neighbor1.reproductivityTrait.getValue())
						{
							let canReproduce = true;
							
							// If there's poison in this grid cell, we may not be able to create a child here depending on the parents' poison resistance
							let poisonAmount = this.getGridPoisonQuantity(row, col);
							if (poisonAmount > 0.0)
							{
								roll = Math.random() * Math.random();
								if (roll > neighbor1.poisonResistanceTrait.getValue())
									canReproduce = false;
							}
					
							if (canReproduce)
							{
								let newDNA = null;
								let neighbor2 = this.chooseRandomLivingNeighbor(cell, this.neighbors, false, neighbor1);
								if (neighbor2)
								{
									// If we have two living neighbors, we can choose a multi-parent generator
									//newDNA = this.ga.generateChild_Crossover(neighbor1.getDNA(), neighbor2.getDNA());
									newDNA = this.ga.generateChild_Blend(neighbor1.getDNA(), neighbor2.getDNA());
									
									// Tiny chance to apply some mutation
									this.ga.mutateDNA(newDNA, this.mutationChance, this.mutationAmount);
								}
								else
								{
									// With only one neighbor we can only choose 1-neighbor generators. Choose basic mutation for now
									newDNA = this.ga.generateChild_Mutation(neighbor1.getDNA());
								}
								this.nextCellStates2[row][col].species = neighbor1.getSpecies();
								this.nextCellStates2[row][col].stateChanged = true;
								this.nextCellStates2[row][col].lifeState = Cell.LIFE_STATE_ALIVE;
								this.nextCellStates2[row][col].dna = newDNA;
								newDNA.id = this.dnaCounter;
								this.dnaCounter++;
							}
						}
					}
				}
			}
		}
		
		// Now apply next state to current
		this.worldPopulation = 0;
		for (let row = 0; row < rows; row++) 
		{
			for (let col = 0; col < cols; col++) 
			{
				var nextState = this.nextCellStates2[row][col];
				if (nextState.stateChanged)
				{
					if (nextState.lifeState == Cell.LIFE_STATE_ALIVE)
					{
						this.activateCell(row, col, nextState.species, nextState.dna); 
					}
					else
					{
						this.killCell(row, col);
					}
				}
				if (this.cells[row][col].isAlive())
				{
					this.worldPopulation++; 
				}
			}
		}
		
		// Finally, let cells do their internal updates
		for (let row = 0; row < rows; row++) 
		{
			for (let col = 0; col < cols; col++) 
			{
				let cell = this.cells[row][col];
				if (cell.isAlive())
				{
					// Check effects of food and poison
					let foodAmount = this.getGridFoodQuantity(row, col); 
					let poisonAmount = this.getGridPoisonQuantity(row, col);
				
					if (foodAmount > 0.0)
					{
						let amountTaken = MyMath.clamp(10.0, 0.0, foodAmount);
						cell.consumeFood(amountTaken);
						this.removeFood(row, col, amountTaken);
					}
					if (poisonAmount > 0.0)
					{
						let amountTaken = MyMath.clamp(25.0, 0.0, poisonAmount);
						cell.consumePoison(amountTaken);
						// Remove the poison. Green clears it 5x faster. 
						this.removePoison(row, col, cell.getSpecies() == Cell.SPECIES_GREEN ? amountTaken * 5.0 : amountTaken);
					}
					
					// Cell internal update
					cell.update();
				}
			}
		}
	}
	
	//----------------------------------------------------------------------------	
	// Master update
	//----------------------------------------------------------------------------	
	update()
	{
		// Common update stuff
		this.simGeneration++; 
		Cell.setCurrentGeneration(this.simGeneration);
		
		// Model-specific update
		if (this.simType == LifeSimulation.SIM_TYPE_CONWAY)
		{
			this.updateConwayModel();
		}
		else
		{
			this.updateDickheiserModel();
		}
	}
}

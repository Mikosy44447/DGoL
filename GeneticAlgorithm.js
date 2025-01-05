//===================================================================================================================
// Class: GeneticAlgorithm
// Author: Michael Y. Dickheiser
// 
// This class defines a generic genetic algorithm that accepts arrays of "traits" and performs various selected
// mutation and blending operations on them. 
// Note: no fitness function support implemented yet, as this is first for the MyLife project which allows the simulation
// itself to serve as the fitness function.
//===================================================================================================================

//----------------------------------------------------------------------------------------------------
// GeneticTrait
// Simple class representing a trait with a value and min/max setting
//----------------------------------------------------------------------------------------------------
class GeneticTrait
{
	constructor(value, minValue, maxValue, name = "Generic Trait")
	{
		this.value = value;
		this.minValue = minValue; 
		this.maxValue = maxValue; 
		this.name = name;
	}
	
	getValue() { return this.value; }
	
	// Directly set the value, but clamp it
	setValue(v)
	{
		this.value = MyMath.clamp(v, this.minValue, this.maxValue);
	}
	
	// Apply a change to a value
	modifyValue(deltaV)
	{
		this.setValue(this.value + deltaV);
	}
	
	randomizeValue()
	{
		this.value = MyMath.randomFloatRanged(this.minValue, this.maxValue);
	}
}

//----------------------------------------------------------------------------------------------------
// GeneticAlgorithm
//----------------------------------------------------------------------------------------------------
class GeneticAlgorithm
{
	static DEFAULT_MUTABILITY_RANGE = 0.02; // todo: probably want to make this adjustable by user
	static DEFAULT_MUTATION_CHANCE = 0.03;	// same ^
	static DEFAULT_BLEND_WEIGHT = 0.5;		// same ^
	
	static GENERATION_METHOD_USER = 0;		// made manually by the user
	static GENERATION_METHOD_CLONING = 1;
	static GENERATION_METHOD_MUTATION = 2;
	static GENERATION_METHOD_CROSSOVER = 3;
	static GENERATION_METHOD_BLEND = 4;
	static GENERATION_METHOD_RANDOM = 5;
	
	constructor()
	{
		this.generationMethod = GeneticAlgorithm.GENERATION_METHOD_CLONING;
	}
	
	generateChildRandomly(parent1, parent2)
	{
		let randomMethod = randIntRanged(GeneticAlgorithm.GENERATION_METHOD_CLONING, GeneticAlgorithm.GENERATION_METHOD_RANDOM);
		return generateChild(parent1, parent2, randomMethod);
	}
	
	// Given two parents, produce a child using the chosen method
	generateChild(parent1, parent2, method)
	{
		switch (method)
		{
			case GeneticAlgorithm.GENERATION_METHOD_MUTATION:
				return generateChild_Mutation(parent1);
				
			case GeneticAlgorithm.GENERATION_METHOD_CROSSOVER:
				return generateChild_Crossover(parent1, parent2);
				
			case GeneticAlgorithm.GENERATION_METHOD_BLEND:
				return generateChild_Blend(parent1, parent2);
				
			case GeneticAlgorithm.GENERATION_METHOD_RANDOM: 
				return generateChild_Random(parent1);
			
			case GeneticAlgorithm.GENERATION_METHOD_CLONING:
			default:
				return generateChild_Cloning(parent1); // Assume first parent is the source
				
		}
	}
	
	// Cloning: just copy the parents trait values
	generateChild_Cloning(parent)
	{
		let child = [];
		for (let i = 0; i < parent.length; i++)
		{
			let parentTrait = parent[i];
			let newTrait = new GeneticTrait(parentTrait.value, parentTrait.minValue, parentTrait.maxValue, parentTrait.name);
			child.push(newTrait);
		}
		return child;
	}
	
	// Random: completely random values. Use parent1 to know what traits to work with.
	generateChild_Random(parent1)
	{
		let newTraits = this.generateChild_Cloning(parent1);
		for (let i = 0; i < newTraits.length; i++)
		{
			newTraits[i].randomizeValue();
		}
		return newTraits; 
	}
	
	// Mutate in-place the provided dna
	mutateDNA(dna, mutationChance = GeneticAlgorithm.DEFAULT_MUTATION_CHANCE, mutabilityRange = GeneticAlgorithm.DEFAULT_MUTABILITY_RANGE)
	{
		for (let i = 0; i < dna.length; i++)
		{
			var mutate = Math.random() < mutationChance; 
			if (mutate)
			{
				// Adjust the trait's value 
				dna[i].modifyValue(Math.random() * (mutabilityRange * 2.0) - mutabilityRange);
			}
		}
	}
	
	// Produce a new child, randomly mutatating the given traits by the mutability range
	generateChild_Mutation(parent1, mutationChance = GeneticAlgorithm.DEFAULT_MUTATION_CHANCE, mutabilityRange = GeneticAlgorithm.DEFAULT_MUTABILITY_RANGE)
	{
		let newTraits = this.generateChild_Cloning(parent1);
		this.mutateDNA(newTraits, mutationChance, mutabilityRange);
		return newTraits;
	}
	
	// Using uniform crossover for now. todo: something more elaborate and interesting
	generateChild_Crossover(parent1, parent2)
	{
		let newTraits = this.generateChild_Cloning(parent1);
		for (let i = 0; i < newTraits.length; i++)
		{
			if (Math.random() < 0.5)
			{
				newTraits[i].value = parent2[i].value;
			}
		}
		return newTraits;
	}
	
	// Blend values between parents. Right now assuming 50/50 blend by default.
	// Also blending every trait, which probably needs to change.
	generateChild_Blend(parent1, parent2, blendWeight = GeneticAlgorithm.DEFAULT_BLEND_WEIGHT)
	{
		let parent1Weight = blendWeight;
		let parent2Weight = 1.0 - parent1Weight;
		let newTraits = this.generateChild_Cloning(parent1);
		for (let i = 0; i < newTraits.length; i++)
		{
			newTraits[i].setValue(parent1[i].value * parent1Weight + parent2[i].value * parent2Weight);
		}
		return newTraits;
	}
}
//======================================================================================
// MyMath
// Author: Michael Y. Dickheiser
// 
// Some math helpers
//======================================================================================

const MyMath =
{
	randomIntRanged: function(minValue, maxValue)
	{
		return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
	},
	
	randomFloatRanged: function(minValue, maxValue)
	{
		return minValue + (Math.random() * (maxValue - minValue));
	},
	
	clamp: function(value, minValue, maxValue)
	{
		return Math.max(minValue, Math.min(value, maxValue));
	}
};


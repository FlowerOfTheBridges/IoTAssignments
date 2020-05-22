class Model{
	/**
     * Compute the discrete Signal Magnitude Area over a set of discrete samples
     * @param {array} measures where elements are JSON objects like {x: number, y: number, z: number}
     * @returns {number} the corresponding SMA
    */
	sma(measures){
		let sum = 0;

		measures.forEach( measure => {
			sum += Math.abs(measure.x) + Math.abs(measure.y) + Math.abs(measure.z);
		});

    	return sum / measures.length;
	}

    /**
     * Returns the status associated to a particular SMA measure
     * @param {number} sma 
     * @returns {number} 1 if user is moving, 0 if user is standing still
    */
	getStatus(sma) {
    	if(sma >= 1.5){
    		return 1;
    	}
    	else{
    		return 0;
    	}
	}
}

module.exports = Model.bind(this);
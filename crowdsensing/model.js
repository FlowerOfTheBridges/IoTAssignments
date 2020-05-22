/**
 * Compute the discrete Signal Magnitude Area over a set of discrete samples
 * @param {array} measures where elements are JSON objects like {x: number, y: number, z: number}
 * @returns {number} the corresponding SMA
 */
function sma(measures) {
    let sum = 0;

    measures.forEach(measure => {
        sum += Math.abs(measure.x) + Math.abs(measure.y) + Math.abs(measure.z);
    })

    return sum / measures.length;
}

/**
 * Generate a universal unique identifier based on the rfc4122 spec
 * http://www.ietf.org/rfc/rfc4122.txt
 */
function generateId() {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
}

/**
 * Returns the status associated to a particular SMA measure
 * @param {number} sma 
 * @returns {number} 1 if user is moving, 0 if user is standing still
 */
function getStatus(sma) {
    if(sma >= 1.5){
        return 1;
    }
    else{
        return 0;
    }
}
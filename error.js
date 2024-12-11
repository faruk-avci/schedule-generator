class ConstantMatrixOverlapError extends Error {
    constructor(message) {
        super(message);  
        this.name = "ConstantMatrixOverlapError"; 
    }
}

class TooManySchedulesError extends Error{
    constructor(message) {
        super(message);  
        this.name = "TooManySchedulesError"; 
    }
}












module.exports = { ConstantMatrixOverlapError , TooManySchedulesError};
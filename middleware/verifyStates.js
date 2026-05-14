const statesData = require('../models/statesData.json');

// Build a one-time array of all 50 valid state codes (uppercase) from statesData.json.
// Using .map() per project hint.
const stateCodes = statesData.map(state => state.code);

const verifyStates = (req, res, next) => {
    // Accept lowercase, uppercase, and mixed-case input by normalizing.
    const requested = req.params.state;
    if (!requested) {
        return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
    }
    const stateCode = requested.toUpperCase();

    if (!stateCodes.includes(stateCode)) {
        return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
    }

    // Attach the verified (uppercase) code to the request so controllers can use it.
    req.code = stateCode;
    next();
};

module.exports = verifyStates;

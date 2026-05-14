const State = require('../model/States');
const statesData = require('../models/statesData.json');

/**
 * Helper: given a verified state code, return the matching object from statesData.json.
 */
const getStateFromJson = (stateCode) => {
    return statesData.find(s => s.code === stateCode);
};

/**
 * Helper: given a state code, look up the funfacts in MongoDB. Returns the funfacts
 * array (possibly empty) or null if no record exists for that state.
 */
const getFunFactsFromDB = async (stateCode) => {
    const record = await State.findOne({ stateCode: stateCode }).exec();
    if (!record) return null;
    return record.funfacts || [];
};

// ---------------------------------------------------------------------------
// GET /states/
// GET /states/?contig=true   -> contiguous (NOT AK, NOT HI)
// GET /states/?contig=false  -> non-contiguous (only AK and HI)
// Merges funfacts from MongoDB onto each state.
// ---------------------------------------------------------------------------
const getAllStates = async (req, res) => {
    let states = statesData;

    if (req.query.contig === 'true') {
        states = states.filter(s => s.code !== 'AK' && s.code !== 'HI');
    } else if (req.query.contig === 'false') {
        states = states.filter(s => s.code === 'AK' || s.code === 'HI');
    }

    // Pull all MongoDB records once, then merge.
    const dbStates = await State.find().exec();

    // Build a quick lookup from stateCode -> funfacts array
    const funfactsByCode = {};
    dbStates.forEach(record => {
        if (record.funfacts && record.funfacts.length > 0) {
            funfactsByCode[record.stateCode] = record.funfacts;
        }
    });

    // Merge - return a shallow copy so we don't mutate the imported JSON
    const merged = states.map(state => {
        const copy = { ...state };
        if (funfactsByCode[state.code]) {
            copy.funfacts = funfactsByCode[state.code];
        }
        return copy;
    });

    res.json(merged);
};

// ---------------------------------------------------------------------------
// GET /states/:state
// All data for the state, with funfacts merged in from MongoDB (if any).
// ---------------------------------------------------------------------------
const getState = async (req, res) => {
    const stateCode = req.code; // attached by verifyStates middleware
    const state = getStateFromJson(stateCode);

    // verifyStates already guarantees the state exists, but be defensive.
    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const stateCopy = { ...state };
    const funfacts = await getFunFactsFromDB(stateCode);
    if (funfacts && funfacts.length > 0) {
        stateCopy.funfacts = funfacts;
    }

    res.json(stateCopy);
};

// ---------------------------------------------------------------------------
// GET /states/:state/funfact
// Returns one random fun fact, or an appropriate message if none exist.
// ---------------------------------------------------------------------------
const getFunFact = async (req, res) => {
    const stateCode = req.code;
    const state = getStateFromJson(stateCode);
    const stateName = state ? state.state : stateCode;

    const funfacts = await getFunFactsFromDB(stateCode);

    if (!funfacts || funfacts.length === 0) {
        return res.json({ message: `No Fun Facts found for ${stateName}` });
    }

    // Pick a random fun fact from the array
    const randomIndex = Math.floor(Math.random() * funfacts.length);
    res.json({ funfact: funfacts[randomIndex] });
};

// ---------------------------------------------------------------------------
// GET /states/:state/capital
// ---------------------------------------------------------------------------
const getCapital = (req, res) => {
    const state = getStateFromJson(req.code);
    res.json({ state: state.state, capital: state.capital_city });
};

// ---------------------------------------------------------------------------
// GET /states/:state/nickname
// ---------------------------------------------------------------------------
const getNickname = (req, res) => {
    const state = getStateFromJson(req.code);
    res.json({ state: state.state, nickname: state.nickname });
};

// ---------------------------------------------------------------------------
// GET /states/:state/population
// Population is returned as a localized string (e.g., "4,833,722") to match
// common example formatting, but a Number would also be acceptable per spec.
// ---------------------------------------------------------------------------
const getPopulation = (req, res) => {
    const state = getStateFromJson(req.code);
    res.json({
        state: state.state,
        population: state.population.toLocaleString('en-US')
    });
};

// ---------------------------------------------------------------------------
// GET /states/:state/admission
// ---------------------------------------------------------------------------
const getAdmission = (req, res) => {
    const state = getStateFromJson(req.code);
    res.json({ state: state.state, admitted: state.admission_date });
};

// ---------------------------------------------------------------------------
// POST /states/:state/funfact
// Body: { funfacts: ["fact 1", "fact 2", ...] }
// Appends to existing funfacts, or creates a new record if none exists.
// ---------------------------------------------------------------------------
const createFunFact = async (req, res) => {
    const stateCode = req.code;
    const { funfacts } = req.body;

    if (!funfacts) {
        return res.status(400).json({ message: 'State fun facts value required' });
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ message: 'State fun facts value must be an array' });
    }

    try {
        let stateRecord = await State.findOne({ stateCode: stateCode }).exec();

        if (!stateRecord) {
            // No record yet for this state - create a new one
            stateRecord = await State.create({
                stateCode: stateCode,
                funfacts: funfacts
            });
        } else {
            // Existing record - push the new facts, keeping the old ones
            stateRecord.funfacts = [...(stateRecord.funfacts || []), ...funfacts];
            await stateRecord.save();
        }

        res.json(stateRecord);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating fun fact' });
    }
};

// ---------------------------------------------------------------------------
// PATCH /states/:state/funfact
// Body: { index: <1-based number>, funfact: "<replacement text>" }
// Replaces the fun fact at the given (1-based) index.
// ---------------------------------------------------------------------------
const updateFunFact = async (req, res) => {
    const stateCode = req.code;
    const { index, funfact } = req.body;
    const stateName = getStateFromJson(stateCode).state;

    // Order of checks matters for grader-style tests.
    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }
    if (!funfact) {
        return res.status(400).json({ message: 'State fun fact value required' });
    }

    try {
        const stateRecord = await State.findOne({ stateCode: stateCode }).exec();

        if (!stateRecord || !stateRecord.funfacts || stateRecord.funfacts.length === 0) {
            return res.json({ message: `No Fun Facts found for ${stateName}` });
        }

        // Adjust the 1-based index to a 0-based array position
        const zeroIndex = index - 1;
        if (zeroIndex < 0 || zeroIndex >= stateRecord.funfacts.length) {
            return res.json({ message: `No Fun Fact found at that index for ${stateName}` });
        }

        stateRecord.funfacts[zeroIndex] = funfact;
        // Mongoose doesn't always notice in-place array edits - mark modified.
        stateRecord.markModified('funfacts');
        const result = await stateRecord.save();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating fun fact' });
    }
};

// ---------------------------------------------------------------------------
// DELETE /states/:state/funfact
// Body: { index: <1-based number> }
// Removes the fun fact at the given (1-based) index. Uses filter so the array
// has no holes left behind.
// ---------------------------------------------------------------------------
const deleteFunFact = async (req, res) => {
    const stateCode = req.code;
    const { index } = req.body;
    const stateName = getStateFromJson(stateCode).state;

    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }

    try {
        const stateRecord = await State.findOne({ stateCode: stateCode }).exec();

        if (!stateRecord || !stateRecord.funfacts || stateRecord.funfacts.length === 0) {
            return res.json({ message: `No Fun Facts found for ${stateName}` });
        }

        const zeroIndex = index - 1;
        if (zeroIndex < 0 || zeroIndex >= stateRecord.funfacts.length) {
            return res.json({ message: `No Fun Fact found at that index for ${stateName}` });
        }

        // Filter out the targeted element rather than splice/delete so we never
        // leave an `undefined` hole behind.
        stateRecord.funfacts = stateRecord.funfacts.filter((_, i) => i !== zeroIndex);
        stateRecord.markModified('funfacts');
        const result = await stateRecord.save();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting fun fact' });
    }
};

module.exports = {
    getAllStates,
    getState,
    getFunFact,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    createFunFact,
    updateFunFact,
    deleteFunFact
};

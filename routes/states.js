const express = require('express');
const router = express.Router();
const statesController = require('../controllers/statesController');
const verifyStates = require('../middleware/verifyStates');

// /states/  (also handles ?contig=true / ?contig=false)
router.route('/')
    .get(statesController.getAllStates);

// /states/:state - full state info (verifyStates first)
router.route('/:state')
    .get(verifyStates, statesController.getState);

// /states/:state/funfact - GET random, POST add, PATCH update, DELETE remove
router.route('/:state/funfact')
    .get(verifyStates, statesController.getFunFact)
    .post(verifyStates, statesController.createFunFact)
    .patch(verifyStates, statesController.updateFunFact)
    .delete(verifyStates, statesController.deleteFunFact);

// /states/:state/capital
router.route('/:state/capital')
    .get(verifyStates, statesController.getCapital);

// /states/:state/nickname
router.route('/:state/nickname')
    .get(verifyStates, statesController.getNickname);

// /states/:state/population
router.route('/:state/population')
    .get(verifyStates, statesController.getPopulation);

// /states/:state/admission
router.route('/:state/admission')
    .get(verifyStates, statesController.getAdmission);

module.exports = router;

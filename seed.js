/**
 * One-time seed script.
 *
 * Usage:   node seed.js
 *
 * Inserts (or upserts) starter fun facts for the 5 required states:
 *   Kansas, Missouri, Oklahoma, Nebraska, Colorado.
 *
 * Per project requirements, do NOT add fun facts for:
 *   New Hampshire, Rhode Island, Georgia, Arizona, Montana.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const State = require('./model/States');

const seedData = [
    {
        stateCode: 'KS',
        funfacts: [
            'Kansas is the leading producer of wheat in the United States.',
            'The state insect of Kansas is the honeybee.',
            'Dodge City, Kansas is the windiest city in the U.S.'
        ]
    },
    {
        stateCode: 'MO',
        funfacts: [
            'Missouri is known as the "Show-Me State".',
            'The ice cream cone was invented at the 1904 St. Louis World\'s Fair.',
            'Missouri has two of the 10 largest cities in the country: Kansas City and St. Louis.'
        ]
    },
    {
        stateCode: 'OK',
        funfacts: [
            'Oklahoma got its name from two Choctaw words: "okla" meaning people and "humma" meaning red.',
            'The first parking meter was installed in Oklahoma City in 1935.',
            'Oklahoma\'s state vegetable is the watermelon.'
        ]
    },
    {
        stateCode: 'NE',
        funfacts: [
            'Nebraska is the only state with a unicameral (one-chamber) legislature.',
            'Kool-Aid was invented in Hastings, Nebraska in 1927.',
            'Nebraska has the largest indoor rainforest in the U.S. at the Henry Doorly Zoo.'
        ]
    },
    {
        stateCode: 'CO',
        funfacts: [
            'Colorado is the only state in U.S. history to turn down hosting the Olympic Games.',
            'The U.S. federal government owns more than one-third of the land in Colorado.',
            'Colorado has the highest mean elevation of any state at 6,800 feet.'
        ]
    }
];

(async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI);
        console.log('Connected to MongoDB');

        for (const entry of seedData) {
            await State.findOneAndUpdate(
                { stateCode: entry.stateCode },
                { stateCode: entry.stateCode, funfacts: entry.funfacts },
                { upsert: true, new: true }
            );
            console.log(`Seeded ${entry.stateCode} with ${entry.funfacts.length} fun facts`);
        }

        console.log('Done.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
})();

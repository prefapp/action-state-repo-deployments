const hasbin = require('hasbin');

function checkDependencies() {

    requiredBins = ['helmfile', 'helm']

    const result = hasbin.all.sync(requiredBins)

    if (!result) {
        throw new Error('Required dependencies not found.')
    }

    return result
}

module.exports = { checkDependencies }

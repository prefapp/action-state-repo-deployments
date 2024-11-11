const core = require('@actions/core')
const { wait } = require('./wait')
const { checkDependencies } = require('./validate')
const { hydrateDeployments } = require('./hydrate')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // Check for required dependencies
    checkDependencies()

    const updatedDeployments = JSON.parse(core.getInput('updated_deployments'))

    // Hydrate the deployments to include all values in final.yaml
    hydrateDeployments(updatedDeployments)

    // Template the deployments

  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

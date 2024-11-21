// Create a custom class to specify template configuration properties
const core = require('@actions/core')
const { createDeployment } = require('./deployment')

function templateDeployments(updatedDeployments, config) {
  for (const deployment of updatedDeployments) {
    try {
      const dp = createDeployment(deployment, config)

      dp.template()
    } catch (error) {
      core.error(error)
    }
  }
}

module.exports = { templateDeployments }

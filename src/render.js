const { templateDeployments } = require('./template')
const { checkDependencies } = require('./dependencies')

function renderDeployments(updatedDeployments, config) {
  console.log('Rendering deployments')

  // Check for required dependencies
  checkDependencies()

  templateDeployments(updatedDeployments, config)
}

module.exports = { renderDeployments }

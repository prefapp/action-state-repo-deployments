// Create a custom class to specify template configuration properties

const { createDeployment } = require('./deployment')

function templateDeployments(updatedDeployments, config) {
  for (const deployment of updatedDeployments) {
    const dp = createDeployment(deployment, config)

    dp.template()
  }
}

module.exports = { templateDeployments }

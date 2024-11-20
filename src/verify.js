const { createDeployment } = require('./deployment')

class VerifyConfig {
  constructor(
    environment,
    deploymentsDir,
    outputDir,
    argoProjectsDir,
    prNumber
  ) {
    this.environment = environment
    this.deploymentsDir = deploymentsDir
    this.outputDir = outputDir
    this.argoProjectsDir = argoProjectsDir
    this.prNumber = prNumber
  }
}

async function verifyDeployments(updatedDeployments, config) {
  console.log('Verifying deployments')

  const result = {}

  for (const deployment of updatedDeployments) {
    try {
      const dp = createDeployment(deployment, config)

      console.log('Verifying deployment')

      result[deployment] = await dp.verify()
    } catch (error) {
      console.log(error)
    }
  }

  return result
}

module.exports = { VerifyConfig, verifyDeployments }

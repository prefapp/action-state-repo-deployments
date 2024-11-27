const core = require('@actions/core')
const { createDeployment } = require('./deployment')

async function verifyDeployments(updatedDeployments, config) {
  console.log('Verifying deployments')

  const result = {}

  for (const deployment of updatedDeployments) {
    try {
      const dp = createDeployment(deployment, config)

      console.log('Verifying deployment')

      result[deployment] = await dp.verify()
    } catch (error) {
      console.log(`Error verifying deployment ${deployment}`)
      console.error(error)
      core.error(error)
    }
  }

  return result
}

module.exports = { verifyDeployments }

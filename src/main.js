const core = require('@actions/core')
const { renderDeployments, RenderConfig } = require('./render')
const { verifyDeployments, VerifyConfig } = require('./verify')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const operation = core.getInput('operation')
    const updatedDeployments = JSON.parse(core.getInput('updated_deployments'))
    const deploymentsDir = core.getInput('template_dir')
    const outputDir = core.getInput('output_dir')
    const argoPorjectsDir = core.getInput('argo_projects_dir')
    console.log(process.env.GITHUB_PR_NUMBER)
    const prNUmber = github.context.payload.pull_request

    switch (operation) {
      case 'render':
        const renderConfig = new RenderConfig(deploymentsDir, outputDir)
        renderDeployments(updatedDeployments, renderConfig)
        break
      case 'verify':
        const verifyConfig = new VerifyConfig(
          deploymentsDir,
          outputDir,
          argoPorjectsDir,
          prNUmber
        )
        verifyDeployments(updatedDeployments, verifyConfig)
        break
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

const core = require('@actions/core')
const { renderDeployments } = require('./render')
const { TemplateConfig } = require('./template')
const { verifyDeployments, VerifyConfig } = require('./verify')
const github = require('@actions/github')

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
    const prNUmber =
      github.context.payload.pull_request ?? process.env.GITHUB_PR_NUMBER
    const environment = core.getInput('environment')
    switch (operation) {
      case 'render': {
        const renderConfig = new TemplateConfig(
          environment,
          deploymentsDir,
          outputDir,
          true
        )
        renderDeployments(updatedDeployments, renderConfig)
        break
      }
      case 'verify': {
        const verifyConfig = new VerifyConfig(
          environment,
          deploymentsDir,
          outputDir,
          argoPorjectsDir,
          prNUmber
        )
        verifyDeployments(updatedDeployments, verifyConfig)
        break
      }
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

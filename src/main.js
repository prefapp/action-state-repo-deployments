const core = require('@actions/core')
const { renderDeployments } = require('./render')
const { verifyDeployments } = require('./verify')
const { Config } = require('./config')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const updatedDeployments = JSON.parse(core.getInput('updated_deployments'))
    const deploymentsDir = core.getInput('template_dir')
    const outputDir = core.getInput('output_dir')
    const argoPorjectsDir = core.getInput('argo_projects_dir')
    const prNUmber =
      github.context.payload.pull_request.number ?? process.env.GITHUB_PR_NUMBER
    const environment = core.getInput('environment')

    const config = new Config(
      environment,
      deploymentsDir,
      outputDir,
      argoPorjectsDir,
      prNUmber
    )

    renderDeployments(updatedDeployments, config)
    verifyDeployments(updatedDeployments, config)
  } catch (error) {
    // Fail the workflow run if an error occurs
    console.error(error)
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

const { TemplateConfig, templateDeployments } = require('./template')
const { checkDependencies } = require('./dependencies')

class RenderConfig {
  constructor(deploymentDir, outputDir) {
    this.deploymentDir = deploymentDir
    this.outputDir = outputDir
  }
}

function renderDeployments(updatedDeployments, renderConfig) {
  console.log('Rendering deployments')

  // Check for required dependencies
  checkDependencies()

  // Template the deployments
  const templateConfig = new TemplateConfig(
    renderConfig.deploymentsDir,
    renderConfig.outputDir,
    true
  )

  templateDeployments(updatedDeployments, templateConfig)
}

module.exports = { RenderConfig, renderDeployments }

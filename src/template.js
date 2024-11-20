// Create a custom class to specify template configuration properties

const { createDeployment } = require('./deployment')
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const yaml = require('js-yaml')

class TemplateConfig {
  constructor(environment, deploymentsDir, outputDir, deletePreviousTemplate) {
    this.environment = environment
    this.deploymentsDir = deploymentsDir
    this.outputDir = outputDir
    this.deletePreviousTemplate = deletePreviousTemplate
  }
}

function templateDeployments(updatedDeployments, templateConfig) {
  for (const deployment of updatedDeployments) {
    const dp = createDeployment(deployment, templateConfig)

    dp.template()
  }
}

module.exports = { TemplateConfig, templateDeployments }

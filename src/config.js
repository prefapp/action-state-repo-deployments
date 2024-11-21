class Config {
  /**
   * @param {string} environment The environment to deploy to.
   * @param {string} deploymentsDir The directory containing the deployment templates.
   * @param {string} outputDir The directory to output the rendered deployments.
   * @param {string} argoProjectsDir The directory containing the ArgoCD projects.
   * @param {string} prNumber The pull request number.
   */
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

module.exports = {
  Config
}

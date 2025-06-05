class Config {
  /**
   * @param {string} deploymentsDir The directory containing the deployment templates.
   * @param {string} outputDir The directory to output the rendered deployments.
   * @param {string} argoProjectsDir The directory containing the ArgoCD projects.
   * @param {string} prNumber The pull request number.
   * @param {string} author The author of the pull request.
   */
  constructor(
    deploymentsDir,
    outputDir,
    argoProjectsDir,
    prNumber,
    author
  ) {
    this.deploymentsDir = deploymentsDir
    this.outputDir = outputDir
    this.argoProjectsDir = argoProjectsDir
    this.prNumber = prNumber
    this.author = author
  }
}

module.exports = {
  Config
}

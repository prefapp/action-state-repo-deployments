const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { VerifyConfig, verifyDeployments } = require('../src/verify')
const { TemplateConfig, templateDeployments } = require('../src/template')
const { createDeployment } = require('../src/deployment')
const git = require('../src/git')

describe('hydrateDeployment', () => {
  let tmpDir

  beforeEach(() => {
    // Create a temporary directory to render the files
    tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep)
  })

  afterEach(() => {
    // Remove the temporary directory
    fs.removeSync(tmpDir)
  })

  it.only('should be able to validate the namespace', async () => {
    const verifyConfig = new VerifyConfig(
      'dev',
      path.join(tmpDir, 'deployments'),
      path.join(tmpDir, 'output'),
      path.join(__dirname, 'fixtures', 'state-argo'),
      process.env.GITHUB_PR_NUMBER
    )

    // Copy the fixtures folder to the temporary directory
    fs.copySync(
      path.join(__dirname, 'fixtures'),
      path.join(tmpDir, 'deployments')
    )

    const updatedDeployments = 'apps/cluster-name/test-tenant/sample-app'

    // Template the deployments
    const templateConfig = new TemplateConfig(
      'dev',
      path.join(tmpDir, 'deployments'),
      path.join(tmpDir, 'output'),
      true
    )

    // Create the deployment
    const templateDep = createDeployment(updatedDeployments, templateConfig)

    templateDep.template()

    const verifyDep = createDeployment(updatedDeployments, verifyConfig)

    await verifyDep._verify()
  })

  it('should be able to validate the argocd project namespace', () => {})
})

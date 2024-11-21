const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { Config } = require('../src/config')
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

  it('should be able to validate the namespace', async () => {
    const config = new Config(
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

    // Create the deployment
    const templateDep = createDeployment(updatedDeployments, config)

    templateDep.template()

    const verifyDep = createDeployment(updatedDeployments, config)

    // Verify it does not throw

    expect(() => verifyDep._verify()).not.toThrow()
  })
})

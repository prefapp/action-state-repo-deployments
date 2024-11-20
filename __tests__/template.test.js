const { templateDeployments, TemplateConfig } = require('../src/template')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const glob = require('glob')
const yaml = require('js-yaml')

describe('hydrateDeployment', () => {
  let tmpDir

  beforeEach(() => {
    // Create a temporary directory to render the files
    tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep)

    jest.clearAllMocks()
  })

  afterEach(() => {
    // Remove the temporary directory
    fs.removeSync(tmpDir)
  })

  it('should be able to template a chart', () => {
    const templateConfig = new TemplateConfig(
      'dev',
      path.join(tmpDir, 'deployments'),
      path.join(tmpDir, 'output'),
      true
    )

    // Copy the fixtures folder to the temporary directory
    fs.copySync(
      path.join(__dirname, 'fixtures'),
      path.join(tmpDir, 'deployments')
    )

    const updatedDeployments = ['apps/cluster-name/test-tenant/sample-app']

    templateDeployments(updatedDeployments, templateConfig)

    // Verify that each file follows the naming convention <kind>.<namespace>.yaml

    files = glob.sync(`${templateConfig.outputDir}/**/*.@(yaml|yml)`)

    files.forEach(file => {
      const filename = path.basename(file)
      const [kind, name] = filename.split('.')

      fileContents = fs.readFileSync(file, 'utf-8')
      const data = yaml.load(fileContents)

      expect(data.metadata.name).toBe(name)
      expect(data.kind).toBe(kind)
    })

    // Update dev yaml to set serviceAccount.create to fale in final.yaml
    const finalYaml = path.join(
      tmpDir,
      'deployments',
      'apps',
      'cluster-name',
      'test-tenant',
      'sample-app',
      'dev',
      'final.yaml'
    )
    const finalYamlContents = fs.readFileSync(finalYaml, 'utf-8')
    const finalData = yaml.load(finalYamlContents)
    finalData.serviceAccount.create = false
    fs.writeFileSync(finalYaml, yaml.dump(finalData))

    // Re-run the templateDeployments
    templateDeployments(updatedDeployments, templateConfig)

    // Verify that the there is only one file in the output directory
    files = glob.sync(`${templateConfig.outputDir}/**/*.@(yaml|yml)`)
    expect(files.length).toBe(1)
  })
})
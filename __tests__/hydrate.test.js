const path = require('node:path')
const os = require('node:os')
const fs = require('fs-extra')
const { createNestedObject, hydrateDeployment } = require('../src/hydrate')
const { afterEach } = require('node:test')

let tmpDir

describe('hydrateDeployment', () => {
  beforeEach(() => {
    // Create a temporary directory to render the files
    tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep)

    jest.clearAllMocks()
  })

  afterEach(() => {
    // Remove the temporary directory
    // fs.removeSync(tmpDir)

  })

  it('should create a nested object', () => {
    const arr = ['a', 'b', 'c']
    const val = 'value'
    const result = createNestedObject(arr, val)
    expect(result).toEqual({ a: { b: { c: 'value' } } })
  })

  it('should hydrate deployment correctly', () => {
    // Copy the fixtures folder to the temporary directory

    fs.copySync(path.join(__dirname, 'fixtures'), tmpDir)

    const deploymentPath = path.join(
      tmpDir,
      'apps',
      'test-tenant',
      'sample-app',
      'dev'
    )

    hydrateDeployment(deploymentPath)

    const finalYaml = path.join(deploymentPath, 'final.yaml')

    // Final yaml file should exist
    expect(fs.existsSync(finalYaml)).toBe(true)

    // Final yaml file should contain the contents of all yaml files

    const finalYamlContent = fs.readFileSync(finalYaml, 'utf-8')
    const valuesFiles = [
      "subchart.another_child_chart.yaml",
      "subchart.sample_child_chart.yaml",
      "ingress.yaml",
      "global.yaml",
    ]

    for (const file of valuesFiles) {
      const content = fs.readFileSync(path.join(deploymentPath, file), 'utf-8')
      expect(finalYamlContent).toContain(content)
    }
  })
})

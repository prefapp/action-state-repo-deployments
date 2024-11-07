const path = require('node:path')
const os = require('node:os')
const fs = require('fs-extra')
const glob = require('glob')
const { createNestedObject, hydrateDeployment } = require('../src/hydrate')

jest.mock('node:fs')
jest.mock('node:glob')

let tmpDir

describe('hydrateDeployment', () => {
  beforeEach(() => {
    // Create a temporary directory to render the files
    tmpDir = fs.mkdtempSync(os.tmpdir())

    jest.clearAllMocks()
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

    const deploymentPath = path.join(tmpDir, 'apps', 'test-tenant', 'sample-app')

    hydrateDeployment(deploymentPath)
  })
})

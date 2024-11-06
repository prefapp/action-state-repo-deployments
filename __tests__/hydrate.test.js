const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')
const { createNestedObject, hydrateDeployment } = require('../src/hydrate')

jest.mock('node:fs')
jest.mock('node:glob')

describe('hydrateDeployment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a nested object', () => {
    const arr = ['a', 'b', 'c']
    const val = 'value'
    const result = createNestedObject(arr, val)
    expect(result).toEqual({ a: { b: { c: 'value' } } })
  })

  it('should hydrate deployment correctly', () => {
    const deploymentPath = '/fake/path'
    const yamlFiles = [
      '/fake/path/file1.yaml',
      '/fake/path/file2.yaml',
      '/fake/path/secrets.yaml'
    ]
    const caFiles = [
      '/fake/path/ca-certs/ca1.crt',
      '/fake/path/ca-certs/ca2.crt'
    ]

    glob.sync.mockImplementation((pattern) => {
      if (pattern === path.join(deploymentPath, '*.yaml')) {
        return yamlFiles
      } else if (pattern === path.join(deploymentPath, 'ca-certs', '*.crt')) {
        return caFiles
      }
      return []
    })

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath === '/fake/path/file1.yaml') {
        return 'content1'
      } else if (filePath === '/fake/path/file2.yaml') {
        return 'content2'
      } else if (filePath === '/fake/path/ca-certs/ca1.crt') {
        return 'ca1'
      } else if (filePath === '/fake/path/ca-certs/ca2.crt') {
        return 'ca2'
      } else if (filePath === '/fake/path/final.yaml') {
        return 'content1content2'
      }
      return ''
    })

    const writeStreamMock = {
      write: jest.fn(),
      end: jest.fn()
    }

    fs.createWriteStream.mockReturnValue(writeStreamMock)

    hydrateDeployment(deploymentPath)

    expect(glob.sync).toHaveBeenCalledWith(path.join(deploymentPath, '*.yaml'))
    expect(glob.sync).toHaveBeenCalledWith(path.join(deploymentPath, 'ca-certs', '*.crt'))

    expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(deploymentPath, 'final.yaml'), { flags: 'w' })
    expect(writeStreamMock.write).toHaveBeenCalledWith('content1')
    expect(writeStreamMock.write).toHaveBeenCalledWith('content2')
    expect(writeStreamMock.end).toHaveBeenCalled()

    expect(fs.readFileSync).toHaveBeenCalledWith(path.join(deploymentPath, 'final.yaml'), 'utf-8')
    expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path/ca-certs/ca1.crt', 'utf-8')
    expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path/ca-certs/ca2.crt', 'utf-8')

    expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(deploymentPath, 'ca.yml'), { flags: 'w' })
    expect(writeStreamMock.write).toHaveBeenCalledWith(JSON.stringify({
      'councilbox-server': {
        'ca_secret': {
          'crts': 'ca1ca2'
        }
      }
    }))
    expect(writeStreamMock.end).toHaveBeenCalled()
  })

})

const { Deployment, AppDeployment } = require('../src/deployment')
const { Config } = require('../src/config')
const fs = require('fs-extra')
const path = require('path')
const yaml = require('js-yaml')
const glob = require('glob')

jest.mock('fs-extra')
jest.mock('path')
jest.mock('js-yaml')
jest.mock('glob')

describe('Deployment', () => {
  describe('should be able to display a more user friendly string', () => {
    const config = new Config(
      path.join('testDir', 'deployments'),
      path.join('testDir', 'output'),
      undefined
    )

    let dp = new Deployment('testKind', config, ['testFolder'])
    // it('should throw an error', () => {
    //     expect(() => dp._toString(true)).toThrow(
    //         `Method 'toString' must be implemented in kind testKind`
    //     )
    // })

    dp = new AppDeployment('testKind', config, [
      'testCluster',
      'testTenant',
      'testApp',
      'dev'
    ])
    it('should return a string', () => {
      expect(typeof dp._toString(true)).toBe('string')
    })
  })
})

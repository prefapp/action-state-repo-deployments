const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { VerifyConfig, verifyDeployments } = require('../src/verify')
const { TemplateConfig, templateDeployments } = require('../src/template')

describe('hydrateDeployment', () => {
    let tmpDir

    beforeEach(() => {
        // Create a temporary directory to render the files
        tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep)

    })

    afterEach(() => {
        // Remove the temporary directory
        // fs.removeSync(tmpDir)

    })

    beforeAll(() => {

        // jest.mock('../src/git', () => ({
        //     cloneRepo: jest.fn(),
        //     fetchRepo: jest.fn(),
        //     checkoutBranch: jest.fn(),
        //     getCurrentBranch: jest.fn(),
        //     getLatestCommit: jest.fn(),
        //     getFileContent: jest.fn(),
        //     listFiles: jest.fn(),
        // }))
    })

    afterAll(() => {
        jest.clearAllMocks()
    })

    it.only('should be able to validate the namespace', async () => {

        const verifyConfig = new VerifyConfig(
            'dev',
            path.join(tmpDir, 'deployments'),
            path.join(tmpDir, 'output'),
            path.join(__dirname, 'fixtures', 'state-argo'),
            process.env.GITHUB_PR_NUMBER
        );

        // Copy the fixtures folder to the temporary directory
        fs.copySync(path.join(__dirname, 'fixtures'), path.join(tmpDir, 'deployments'))

        const updatedDeployments = ['apps/cluster-name/test-tenant/sample-app']

        // Template the deployments
        const templateConfig = new TemplateConfig(
            'dev',
            path.join(tmpDir, 'deployments'),
            path.join(tmpDir, 'output'),
            true
        );

        templateDeployments(updatedDeployments, templateConfig)

        await verifyDeployments(updatedDeployments, verifyConfig)

    })

    it('should be able to validate the argocd project namespace', () => {

    })


})

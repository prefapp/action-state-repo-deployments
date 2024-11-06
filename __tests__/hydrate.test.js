const fs = require('node:fs');
const path = require('node:path');
const glob = require('node:glob');
const { createNestedObject, hydrateDeployment } = require('../src/hydrate');

jest.mock('node:fs');
jest.mock('node:glob');

describe('hydrateDeployment', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a nested object', () => {
        const arr = ['a', 'b', 'c'];
        const val = 'value';
        const result = createNestedObject(arr, val);
        expect(result).toEqual({ a: { b: { c: 'value' } } });
    });

});

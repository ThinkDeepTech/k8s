import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
const expect = chai.expect;
chai.use(sinonChai);

import {K8sClient} from '../src/k8s-client.mjs';

describe('k8s-client', () => {

    let kubeConfig;
    let api;
    let subject;
    beforeEach(() => {
        kubeConfig = {};

        api = {
            init: sinon.stub(),
            exists: sinon.stub(),
            createAll: sinon.stub(),
            patchAll: sinon.stub(),
            read: sinon.stub(),
            listAll: sinon.stub(),
            deleteAll: sinon.stub()
        };

        subject = new K8sClient(kubeConfig, api);
    })

    describe('init', () => {

        it('should initialize the api with kubeConfig', async () => {
            await subject.init();

            const actual = api.init.getCall(0).args[0];
            expect(actual).to.equal(kubeConfig);
        })

        it('should return a reference to this', async () => {

            const actual = await subject.init();
            expect(actual).to.equal(subject);
        })
    })

    describe('exists', () => {

        it('should check if the object exists using the api', async () => {
            const expectedKind = 'deployment';
            const expectedName = 'somename';
            const expectedNamespace = 'default';
            await subject.exists(expectedKind, expectedName, expectedNamespace);

            const args = api.exists.getCall(0).args;
            const actualKind = args[0];
            const actualName = args[1];
            const actualNamespace = args[2];

            expect(actualKind).to.equal(expectedKind);
            expect(actualName).to.equal(expectedName);
            expect(actualNamespace).to.equal(expectedNamespace);
        })
    })

    describe('createAll', () => {

        it('should create the configurations in the same order as they are passed in', async () => {


        })
    })
})

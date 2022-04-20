import k8s from '@kubernetes/client-node';
import { k8sManifest } from '@thinkdeep/k8s-manifest';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

import {K8sApi} from '../src/k8s-api.mjs';
import { ErrorNotFound } from '../src/error/error-not-found.mjs';

describe('k8s-api', () => {

    let kubeConfig;
    let subject;
    beforeEach(() => {

        kubeConfig = sinon.createStubInstance(k8s.KubeConfig);

        subject = new K8sApi(kubeConfig);
    })

    describe('init', () => {

        it('should only initialize once', async () => {

        })

        it('should initialize kind maps', async () => {

        })
    })

    describe('_forEachApi', () => {

        let apis;
        let apiClients;
        const resourceFunctionName = 'getAPIGroup';
        beforeEach(() => {
            apis = [k8s.AdmissionregistrationApi, k8s.EventsApi];
            apiClients = [
                sinon.createStubInstance(k8s.AdmissionregistrationApi),
                sinon.createStubInstance(k8s.EventsApi)
            ];

            kubeConfig.makeApiClient.onCall(0).returns(apiClients[0]);
            kubeConfig.makeApiClient.onCall(1).returns(apiClients[1]);
        })

        it('should make an api client for each API', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 200
                },
            };

            apiClients[0][resourceFunctionName].returns(Promise.resolve(requestResult));

            apiClients[1][resourceFunctionName].returns(Promise.resolve(requestResult));

            await subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis);

            expect(kubeConfig.makeApiClient).to.have.been.called;

            for (const api of apis) {
                expect(kubeConfig.makeApiClient).to.have.calledWith(api);
            }
        })

        it('should throw an error if the provided resource function is not part of the client', async () => {
            await expect(subject._forEachApi(kubeConfig, 'somethingNonExistant', (_, __) => { }, apis)).to.be.rejectedWith(ErrorNotFound);
        })

        it('should throw an error if the provided resource function is not a function', async () => {

            apiClients[0][resourceFunctionName] = 'not a function';

            await expect(subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis)).to.be.rejectedWith(Error);
        })
    })
})

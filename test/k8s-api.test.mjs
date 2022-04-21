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

    let apis;
    let apiClients;
    let kubeConfig;
    let subject;
    beforeEach(() => {

        apis = [k8s.AdmissionregistrationApi, k8s.EventsApi, k8s.EventsV1Api];
        apiClients = [
            sinon.createStubInstance(k8s.AdmissionregistrationApi),
            sinon.createStubInstance(k8s.EventsApi),
            sinon.createStubInstance(k8s.EventsV1Api)
        ];

        kubeConfig = sinon.createStubInstance(k8s.KubeConfig);

        kubeConfig.makeApiClient.onCall(0).returns(apiClients[0]);
        kubeConfig.makeApiClient.onCall(1).returns(apiClients[1]);
        kubeConfig.makeApiClient.onCall(2).returns(apiClients[2]);

        subject = new K8sApi(kubeConfig);
    })

    describe('init', () => {

        it('should only initialize once', async () => {

        })

        it('should initialize kind maps', async () => {

        })
    })

    describe('_initClientMappings', () => {

        const apiGroupResourceFunction = 'getAPIGroup';
        const apiResourcesFunction = 'getAPIResources';

        beforeEach(() => {
            const resource1 = new k8s.V1APIResource();
            const resource2 = new k8s.V1APIResource();
            const resource3 = new k8s.V1APIResource();

            const resourceList = new k8s.V1APIResourceList();
            resourceList.groupVersion = 'groupversion'
            resourceList.apiVersion = 'apiversion';
            resourceList.kind = 'APIResourceList';
            resourceList.resources = [resource1, resource2, resource3];
        })

        // it('should initialize the api version to api client map', async () => {

        //     const requestResult = {
        //         response: {
        //             body: resourceList,
        //             statusCode: 200
        //         },
        //     };

        //     const callback = sinon.stub();

        //     apiClients[0][resourceFunctionName].returns(Promise.resolve(requestResult));

        //     apiClients[1][resourceFunctionName].returns(Promise.resolve(requestResult));

        //     await subject._forEachApiGroup(kubeConfig, callback, apis);

        //     expect(apiClients[0][resourceFunctionName]).to.have.been.calledOnce;
        //     expect(apiClients[1][resourceFunctionName]).to.have.been.calledOnce;
        //     expect(callback).to.have.callCount(2);
        // })

        it('should initialize the kind to api client map', async () => {

        })

        it('should initialize the kind to group version map', async () => {

        })

        it('should initialize the group version to preferred api version map', async () => {

        })

    })

    describe('_forEachApiGroup', () => {

        const resourceFunctionName = 'getAPIGroup';

        it('should execute the correct k8s javascript api client function', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 200
                },
            };

            const callback = sinon.stub();

            apiClients[0][resourceFunctionName].returns(Promise.resolve(requestResult));

            apiClients[1][resourceFunctionName].returns(Promise.resolve(requestResult));

            await subject._forEachApiGroup(kubeConfig, callback, apis);

            expect(apiClients[0][resourceFunctionName]).to.have.been.calledOnce;
            expect(apiClients[1][resourceFunctionName]).to.have.been.calledOnce;
            expect(callback).to.have.callCount(2);
        })
    })

    describe('_forEachApiResourceList', () => {

        const resourceFunctionName = 'getAPIResources';

        it('should execute the correct k8s javascript api client function', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 200
                },
            };

            const callback = sinon.stub();

            apiClients[2][resourceFunctionName].returns(Promise.resolve(requestResult));

            await subject._forEachApiResourceList(kubeConfig, callback, apis);

            expect(apiClients[2][resourceFunctionName]).to.have.been.calledOnce;
            expect(callback).to.have.been.calledOnce;
        })
    })

    describe('_forEachApi', () => {

        const resourceFunctionName = 'getAPIGroup';

        it('should throw an error if an invalid kube config is supplied', async () => {
            await expect(subject._forEachApi({}, resourceFunctionName, (_, __) => { }, apis)).to.be.rejected;
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

        it('should throw an error if the provided resource function is not a function', async () => {

            const resourceName = 'somethingNotKnownAndFake';

            apiClients[0][resourceName] = 'not a function';

            await expect(subject._forEachApi(kubeConfig, resourceName, (_, __) => { }, apis)).to.be.rejectedWith(Error);
        })

        it('should execute the callback on successful execution of the resource function', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 200
                },
            };

            const callback = sinon.stub();

            apiClients[0][resourceFunctionName].returns(Promise.resolve(requestResult));

            apiClients[1][resourceFunctionName].returns(Promise.resolve(requestResult));

            await subject._forEachApi(kubeConfig, resourceFunctionName, callback, apis);

            expect(callback).to.have.callCount(2);
        })

        it('should ignore cases where the resource function is not found', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 200
                },
            };

            const callback = sinon.stub();

            apiClients[0][resourceFunctionName].returns(Promise.resolve(requestResult));

            apiClients[1][resourceFunctionName].returns(Promise.resolve(requestResult));

            await subject._forEachApi(kubeConfig, resourceFunctionName, callback, apis);

            expect(callback).to.have.callCount(2); // The final call is ignored.
        })

        it('should throw if an error occurs', async () => {

            const requestResult = {
                response: {
                    body: {},
                    statusCode: 400
                },
            };

            apiClients[0][resourceFunctionName].returns(Promise.reject(requestResult));

            apiClients[1][resourceFunctionName].returns(Promise.reject(requestResult));

            await expect(subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis)).to.be.rejected;
        })
    })
})

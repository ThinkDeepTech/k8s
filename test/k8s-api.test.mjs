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

describe('k8s-api', () => {

    const apiGroupResourceFunction = 'getAPIGroup';
    const apiResourcesFunction = 'getAPIResources';

    let apis;
    let apiClients;
    let kubeConfig;
    let resourceLists;
    let apiGroups;
    let subject;
    beforeEach(() => {

        apis = [k8s.AdmissionregistrationApi, k8s.EventsApi, k8s.EventsV1Api];
        apiClients = [
            sinon.createStubInstance(k8s.AdmissionregistrationApi),
            sinon.createStubInstance(k8s.EventsApi),
            sinon.createStubInstance(k8s.EventsV1Api)
        ];

        apiGroups = [
            k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: admissionregistration.k8s.io
                versions:
                  - groupVersion: admissionregistration.k8s.io/v1
                    version: v1
                  - groupVersion: admissionregistration.k8s.io/v1beta1
                    version: v1beta1
                preferredVersion:
                  groupVersion: admissionregistration.k8s.io/v1
                  version: v1
            `),
            k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: events.k8s.io
                versions:
                  - groupVersion: events.k8s.io/v1
                    version: v1
                  - groupVersion: events.k8s.io/v1beta1
                    version: v1beta1
                preferredVersion:
                  groupVersion: events.k8s.io/v1
                  version: v1
            `)
        ];

        resourceLists = [
            k8sManifest(`
                kind: APIResourceList
                apiVersion: v1
                groupVersion: events.k8s.io/v1beta1
                resources:
                  - name: events
                    singularName: ''
                    namespaced: true
                    kind: Event
                    verbs:
                      - create
                      - delete
                      - deletecollection
                      - get
                      - list
                      - patch
                      - update
                      - watch
                    shortNames:
                      - ev
                    storageVersionHash: r2yiGXH7wu8=
            `)
        ];

        kubeConfig = sinon.createStubInstance(k8s.KubeConfig);

        kubeConfig.makeApiClient.withArgs(k8s.AdmissionregistrationApi).returns(apiClients[0]);
        kubeConfig.makeApiClient.withArgs(k8s.EventsApi).returns(apiClients[1]);
        kubeConfig.makeApiClient.withArgs(k8s.EventsV1Api).returns(apiClients[2]);

        apiClients[0][apiGroupResourceFunction].returns({
            response: {
                body: apiGroups[0]
            }
        });

        apiClients[1][apiGroupResourceFunction].returns({
            response: {
                body: apiGroups[1]
            }
        });

        apiClients[2][apiResourcesFunction].returns({
            response: {
                body: resourceLists[0]
            }
        });

        subject = new K8sApi(kubeConfig);
    })

    describe('init', () => {

        it('should only initialize once', async () => {

        })

        it('should initialize kind maps', async () => {

        })
    })

    describe('_initClientMappings', () => {

        it('should provide a mapping from api version to api client', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            expect(subject._apiVersionToApiClient[resourceLists[0].groupVersion]).to.equal(apiClients[2]);
        })

        it('should initialize the kind to api client map', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const mappedApis = subject._kindToApiClients[resourceLists[0].resources[0].kind.toLowerCase()];
            expect(Array.isArray(mappedApis)).to.equal(true);
            expect(mappedApis[0]).to.equal(apiClients[2]);
        })

        it('should initialize the kind to group version map', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const groupVersion = subject._kindToGroupVersion[resourceLists[0].resources[0].kind.toLowerCase()];
            expect(groupVersion).to.equal(resourceLists[0].groupVersion);
        })

        it('should initialize the group version to preferred api version map', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            for (const apiGroup of apiGroups) {
                for (const entry of apiGroup.versions) {
                    expect(subject._groupVersionToPreferredVersion[entry.groupVersion]).to.equal(apiGroup.preferredVersion.groupVersion);
                }
            }
        })

    })

    describe('_forEachApiGroup', () => {

        const resourceFunctionName = apiGroupResourceFunction;

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

        const resourceFunctionName = apiResourcesFunction;

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

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
import {k8sKind} from '../src/k8s-kind.mjs';
import {ErrorNotFound} from '../src/error/error-not-found.mjs';

describe('k8s-api', () => {

    const apiGroupResourceFunction = 'getAPIGroup';
    const apiResourcesFunction = 'getAPIResources';

    const resourceLists = () => {
        return {
            [`${k8s.EventsV1Api.name}`]: k8sManifest(`
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
            `),
            [`${k8s.CoreV1Api.name}`]: k8sManifest(`
                kind: APIResourceList
                groupVersion: v1
                resources:
                  - name: bindings
                    singularName: ''
                    namespaced: true
                    kind: Binding
                    verbs:
                      - create
                  - name: componentstatuses
                    singularName: ''
                    namespaced: false
                    kind: ComponentStatus
                    verbs:
                      - get
                      - list
                    shortNames:
                      - cs
                  - name: configmaps
                    singularName: ''
                    namespaced: true
                    kind: ConfigMap
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
                      - cm
                    storageVersionHash: qFsyl6wFWjQ=
                  - name: endpoints
                    singularName: ''
                    namespaced: true
                    kind: Endpoints
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
                      - ep
                    storageVersionHash: fWeeMqaN/OA=
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
                  - name: limitranges
                    singularName: ''
                    namespaced: true
                    kind: LimitRange
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
                      - limits
                    storageVersionHash: EBKMFVe6cwo=
                  - name: namespaces
                    singularName: ''
                    namespaced: false
                    kind: Namespace
                    verbs:
                      - create
                      - delete
                      - get
                      - list
                      - patch
                      - update
                      - watch
                    shortNames:
                      - ns
                    storageVersionHash: Q3oi5N2YM8M=
                  - name: namespaces/finalize
                    singularName: ''
                    namespaced: false
                    kind: Namespace
                    verbs:
                      - update
                  - name: namespaces/status
                    singularName: ''
                    namespaced: false
                    kind: Namespace
                    verbs:
                      - get
                      - patch
                      - update
                  - name: nodes
                    singularName: ''
                    namespaced: false
                    kind: Node
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
                      - 'no'
                    storageVersionHash: XwShjMxG9Fs=
                  - name: nodes/proxy
                    singularName: ''
                    namespaced: false
                    kind: NodeProxyOptions
                    verbs:
                      - create
                      - delete
                      - get
                      - patch
                      - update
                  - name: nodes/status
                    singularName: ''
                    namespaced: false
                    kind: Node
                    verbs:
                      - get
                      - patch
                      - update
                  - name: persistentvolumeclaims
                    singularName: ''
                    namespaced: true
                    kind: PersistentVolumeClaim
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
                      - pvc
                    storageVersionHash: QWTyNDq0dC4=
                  - name: persistentvolumeclaims/status
                    singularName: ''
                    namespaced: true
                    kind: PersistentVolumeClaim
                    verbs:
                      - get
                      - patch
                      - update
                  - name: persistentvolumes
                    singularName: ''
                    namespaced: false
                    kind: PersistentVolume
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
                      - pv
                    storageVersionHash: HN/zwEC+JgM=
                  - name: persistentvolumes/status
                    singularName: ''
                    namespaced: false
                    kind: PersistentVolume
                    verbs:
                      - get
                      - patch
                      - update
                  - name: pods
                    singularName: ''
                    namespaced: true
                    kind: Pod
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
                      - po
                    categories:
                      - all
                    storageVersionHash: xPOwRZ+Yhw8=
                  - name: pods/attach
                    singularName: ''
                    namespaced: true
                    kind: PodAttachOptions
                    verbs:
                      - create
                      - get
                  - name: pods/binding
                    singularName: ''
                    namespaced: true
                    kind: Binding
                    verbs:
                      - create
                  - name: pods/eviction
                    singularName: ''
                    namespaced: true
                    group: policy
                    version: v1beta1
                    kind: Eviction
                    verbs:
                      - create
                  - name: pods/exec
                    singularName: ''
                    namespaced: true
                    kind: PodExecOptions
                    verbs:
                      - create
                      - get
                  - name: pods/log
                    singularName: ''
                    namespaced: true
                    kind: Pod
                    verbs:
                      - get
                  - name: pods/portforward
                    singularName: ''
                    namespaced: true
                    kind: PodPortForwardOptions
                    verbs:
                      - create
                      - get
                  - name: pods/proxy
                    singularName: ''
                    namespaced: true
                    kind: PodProxyOptions
                    verbs:
                      - create
                      - delete
                      - get
                      - patch
                      - update
                  - name: pods/status
                    singularName: ''
                    namespaced: true
                    kind: Pod
                    verbs:
                      - get
                      - patch
                      - update
                  - name: podtemplates
                    singularName: ''
                    namespaced: true
                    kind: PodTemplate
                    verbs:
                      - create
                      - delete
                      - deletecollection
                      - get
                      - list
                      - patch
                      - update
                      - watch
                    storageVersionHash: LIXB2x4IFpk=
                  - name: replicationcontrollers
                    singularName: ''
                    namespaced: true
                    kind: ReplicationController
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
                      - rc
                    categories:
                      - all
                    storageVersionHash: Jond2If31h0=
                  - name: replicationcontrollers/scale
                    singularName: ''
                    namespaced: true
                    group: autoscaling
                    version: v1
                    kind: Scale
                    verbs:
                      - get
                      - patch
                      - update
                  - name: replicationcontrollers/status
                    singularName: ''
                    namespaced: true
                    kind: ReplicationController
                    verbs:
                      - get
                      - patch
                      - update
                  - name: resourcequotas
                    singularName: ''
                    namespaced: true
                    kind: ResourceQuota
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
                      - quota
                    storageVersionHash: 8uhSgffRX6w=
                  - name: resourcequotas/status
                    singularName: ''
                    namespaced: true
                    kind: ResourceQuota
                    verbs:
                      - get
                      - patch
                      - update
                  - name: secrets
                    singularName: ''
                    namespaced: true
                    kind: Secret
                    verbs:
                      - create
                      - delete
                      - deletecollection
                      - get
                      - list
                      - patch
                      - update
                      - watch
                    storageVersionHash: S6u1pOWzb84=
                  - name: serviceaccounts
                    singularName: ''
                    namespaced: true
                    kind: ServiceAccount
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
                      - sa
                    storageVersionHash: pbx9ZvyFpBE=
                  - name: serviceaccounts/token
                    singularName: ''
                    namespaced: true
                    group: authentication.k8s.io
                    version: v1
                    kind: TokenRequest
                    verbs:
                      - create
                  - name: services
                    singularName: ''
                    namespaced: true
                    kind: Service
                    verbs:
                      - create
                      - delete
                      - get
                      - list
                      - patch
                      - update
                      - watch
                    shortNames:
                      - svc
                    categories:
                      - all
                    storageVersionHash: 0/CO1lhkEBI=
                  - name: services/proxy
                    singularName: ''
                    namespaced: true
                    kind: ServiceProxyOptions
                    verbs:
                      - create
                      - delete
                      - get
                      - patch
                      - update
                  - name: services/status
                    singularName: ''
                    namespaced: true
                    kind: Service
                    verbs:
                      - get
                      - patch
                      - update
                apiVersion: v1
            `)
        };
    }

    const resourceList = (api) => {
        const map = resourceLists();
        return map[api.name];
    }

    const apiGroups = () => {
        return {
            [`${k8s.AdmissionregistrationApi.name}`]: k8sManifest(`
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
            [`${k8s.EventsApi.name}`]: k8sManifest(`
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
        };
    }

    const apiGroup = (api) => {
        const groups = apiGroups();
        return groups[api.name];
    }

    const initApiClients = (apis) => {

        const apiClients = {};
        for (const api of apis) {
            apiClients[api.name] = sinon.createStubInstance(api);
        }
        return apiClients;
    };

    const apiClient = (api, apiClients) => {
        return apiClients[api.name];
    };

    let apis;
    let apiClients;
    let kubeConfig;
    let subject;
    beforeEach(() => {

        apis = [k8s.AdmissionregistrationApi, k8s.EventsApi, k8s.EventsV1Api, k8s.CoreV1Api];

        apiClients = initApiClients(apis);

        kubeConfig = sinon.createStubInstance(k8s.KubeConfig);

        kubeConfig.makeApiClient.withArgs(k8s.AdmissionregistrationApi).returns(apiClient(k8s.AdmissionregistrationApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.EventsApi).returns(apiClient(k8s.EventsApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.EventsV1Api).returns(apiClient(k8s.EventsV1Api, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.CoreV1Api).returns(apiClient(k8s.CoreV1Api, apiClients));

        apiClient(k8s.AdmissionregistrationApi, apiClients)[apiGroupResourceFunction].returns(Promise.resolve({
            response: {
                body: apiGroup(k8s.AdmissionregistrationApi)
            }
        }));

        apiClient(k8s.EventsApi, apiClients)[apiGroupResourceFunction].returns(Promise.resolve({
            response: {
                body: apiGroup(k8s.EventsApi)
            }
        }));

        apiClient(k8s.EventsV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: resourceList(k8s.EventsV1Api)
            }
        }));

        apiClient(k8s.CoreV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: resourceList(k8s.CoreV1Api)
            }
        }));

        subject = new K8sApi();
    })

    describe('init', () => {

        it('should only initialize once', async () => {
            await subject.init(kubeConfig, apis);

            await subject.init(kubeConfig, apis);

            await subject.init(kubeConfig, apis);

            /**
             * The makeApiClient function is called once for each call to _forEachApi.
             * Therefore, it should be called twice for each function in _initClientMappings.
             */
            expect(kubeConfig.makeApiClient).to.have.callCount(2 * Object.keys(apiClients).length);
        })

        it('should initialize kind maps', async () => {
            await subject.init(kubeConfig, apis);

            expect(subject.initialized()).to.equal(true);
        })
    })

    describe('initialized', () => {

        it('should indicate that it is initialized if the maps are set', async () => {
            await subject.init(kubeConfig, apis);

            expect(subject.initialized()).to.equal(true);
        })

        it('should indicate that it is not initialized if the maps are not set', async () => {
            expect(subject.initialized()).to.equal(false);
        })
    })

    describe('_applyResourceListValuesToMaps', () => {

        it('should convert the resource list kind to lowercase but avoid checking for the object in k8s javascript client', () => {
            /**
             * This is important because not all resource kinds returned in the resources of the resourceList objects are found
             * in the k8s module object. One such object is kind NodeProxyOptions included in the resource list in the beforeEach.
             */
            const resourceList = k8sManifest(`
                kind: APIResourceList
                apiVersion: v1
                groupVersion: events.k8s.io/v1beta1
                resources:
                  - name: events2
                    singularName: ''
                    namespaced: true
                    kind: NodeProxyOptions
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
            `);

            expect(subject._applyResourceListValuesToMaps.bind(subject, null, resourceList)).not.to.throw();
        })
    })

    describe('_initClientMappings', () => {

        it('should provide a mapping from api version to api client', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            expect(subject._apiVersionToApiClient[resourceList(k8s.EventsV1Api).groupVersion]).to.equal(apiClient(k8s.EventsV1Api, apiClients));
        })

        it('should provide a mapping from k8s kind to api clients for broadcast', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const mappedApis = subject._kindToApiClients[resourceList(k8s.EventsV1Api).resources[0].kind.toLowerCase()];
            expect(Array.isArray(mappedApis)).to.equal(true);
            expect(mappedApis[0]).to.equal(apiClient(k8s.EventsV1Api, apiClients));
        })

        it('should provide a mapping from kind to group', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const resList = resourceLists();
            for (const [_, resourceList] of Object.entries(resList)) {
                for (const resource of resourceList.resources) {
                    const actualGroupVersions = subject._kindToGroupVersion[k8sKind(resource.kind).toLowerCase()];
                    expect(actualGroupVersions).to.include(resourceList.groupVersion);
                }
            }
            expect(Object.keys(resList).length).to.be.greaterThan(0);
        })

        it('should provide a map from group to preferred version', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            for (const [_, apiGroup] of Object.entries(apiGroups())) {
                for (const entry of apiGroup.versions) {
                    expect(subject._groupVersionToPreferredVersion[entry.groupVersion]).to.equal(apiGroup.preferredVersion.groupVersion);
                }
            }
        })

        it('should setup the initial preferred version to be the group version after which it will be overwritten by the preferred group version', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            /**
             * It's important that Event be used as the kind here because it appears in multiple locations
             * in the resource lists and is part of a group that doesn't have an entry in api groups.
             */
            const actualPreferredVersions = subject.preferredVersions('Event')
            expect(actualPreferredVersions).to.include('events.k8s.io/v1');
            expect(actualPreferredVersions).to.include('v1');

        })

    })

    describe('preferredVersions', () => {

        beforeEach(async () => {
            await subject._initClientMappings(kubeConfig, apis);
        })

        it('should map the k8s kind to its preferred api versions', async () => {
            const actualPreferredVersions = subject.preferredVersions('Event')
            expect(actualPreferredVersions).to.include('events.k8s.io/v1');
            expect(actualPreferredVersions).to.include('v1');
        })

        it('should throw an error if an invalid kind is used', () => {
            expect(() => subject.preferredVersions('NonExistantKind')).to.throw(ErrorNotFound);
        })
    })

    describe('exists', () => {
        // TODO
    })

    describe('read', () => {
        // TODO
    })

    describe('_readStrategy', () => {
        // TODO
    })

    describe('_readClusterObjectStrategy', () => {

        /**
         * NOTE: The kinds used here have to be kinds accepted by the mock APIs because they're created
         * using sinon.createStubInstance. Therefore, the stubs are literally created from functions that
         * exist on the class passed in.
         */

        // it('should return a non-namespaced function if one exists', () => {
        //     const api = null;
        //     const kind = '';
        //     const name = 'metadata.name';
        //     const namespace = 'metadata.namespace';
        //     const strategy = subject._readClusterObjectStrategy(api, kind, name, namespace);
        // })

        it('should return a namespaced function if one exists', () => {

        })
    })

    describe('_groupVersions', () => {

        beforeEach(async () => {
            await subject._initClientMappings(kubeConfig, apis);
        })

        it('should return a set', () => {
            const actual = subject._groupVersions('Event');
            expect(actual.constructor.name).to.equal('Set');
        })

        it('should throw an error if the kind does not map to a group', () => {
            expect(() => subject._groupVersions('NonExistantKind')).to.throw(ErrorNotFound);
        })

        it('should return the registered groups for a given kind', () => {
            const groups = subject._groupVersions('Event');
            expect(groups).to.include('events.k8s.io/v1beta1');
            expect(groups).to.include('v1');
        })
    })

    describe('_forEachApiGroup', () => {

        const resourceFunctionName = apiGroupResourceFunction;

        it('should execute the correct k8s javascript api client function', async () => {

            const callback = sinon.stub();

            await subject._forEachApiGroup(kubeConfig, callback, apis);

            expect(apiClient(k8s.AdmissionregistrationApi, apiClients)[resourceFunctionName]).to.have.been.calledOnce;
            expect(apiClient(k8s.EventsApi, apiClients)[resourceFunctionName]).to.have.been.calledOnce;
            expect(callback).to.have.callCount(2);
        })
    })

    describe('_forEachApiResourceList', () => {

        const resourceFunctionName = apiResourcesFunction;

        it('should execute the correct k8s javascript api client function', async () => {

            const callback = sinon.stub();

            await subject._forEachApiResourceList(kubeConfig, callback, apis);

            expect(apiClient(k8s.EventsV1Api, apiClients)[resourceFunctionName]).to.have.been.calledOnce;
            expect(apiClient(k8s.CoreV1Api, apiClients)[resourceFunctionName]).to.have.been.calledOnce;
            expect(callback).to.have.been.called;
        })
    })

    describe('_forEachApi', () => {

        const resourceFunctionName = apiGroupResourceFunction;

        it('should throw an error if an invalid kube config is supplied', async () => {
            await expect(subject._forEachApi({}, resourceFunctionName, (_, __) => { }, apis)).to.be.rejected;
        })

        it('should make an api client for each API', async () => {

            await subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis);

            expect(kubeConfig.makeApiClient).to.have.been.called;

            for (const api of apis) {
                expect(kubeConfig.makeApiClient).to.have.calledWith(api);
            }
        })

        it('should throw an error if the provided resource function is not a function', async () => {

            const resourceName = 'somethingNotKnownAndFake';

            apiClient(k8s.AdmissionregistrationApi, apiClients)[resourceName] = 'not a function';

            await expect(subject._forEachApi(kubeConfig, resourceName, (_, __) => { }, apis)).to.be.rejectedWith(Error);
        })

        it('should execute the callback on successful execution of the resource function', async () => {

            const callback = sinon.stub();

            await subject._forEachApi(kubeConfig, resourceFunctionName, callback, apis);

            expect(callback).to.have.callCount(2);
        })

        it('should ignore cases where the resource function is not found', async () => {

            const callback = sinon.stub();

            await subject._forEachApi(kubeConfig, resourceFunctionName, callback, apis);

            expect(callback).to.have.callCount(2); // The final call is ignored.
        })

        it('should throw if a non-404 error occurs', async () => {

            const requestResult = {
                response: {
                    statusCode: 400
                },
            };

            apiClient(k8s.AdmissionregistrationApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            apiClient(k8s.EventsApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            await expect(subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis)).to.be.rejected;
        })

        it('should ignore error 404 not found', async () => {
            const requestResult = {
                response: {
                    statusCode: 404
                },
            };

            apiClient(k8s.AdmissionregistrationApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            apiClient(k8s.EventsApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            await expect(subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis)).not.to.be.rejected;
        })

        it('should throw propogate the error if status code is not defined', async () => {
            const requestResult = {
                response: {
                    body: {},
                },
            };

            apiClient(k8s.AdmissionregistrationApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            apiClient(k8s.EventsApi, apiClients)[resourceFunctionName].returns(Promise.reject(requestResult));

            await expect(subject._forEachApi(kubeConfig, resourceFunctionName, (_, __) => { }, apis)).to.be.rejected;
        })
    })
})

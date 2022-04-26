import k8s from '@kubernetes/client-node';
import { k8sManifest, objectify } from '@thinkdeep/k8s-manifest';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

import {K8sApi} from '../src/k8s-api.mjs';
import {normalizeKind} from '../src/normalize-kind.mjs';
import {ErrorNotFound} from '../src/error/error-not-found.mjs';

const MOCK_RESOURCE_LIST_BATCH = 'MOCK_RESOURCE_LIST_BATCH';
const MOCK_RESOURCE_LIST_APPS = 'MOCK_RESOURCE_LIST_APPS';
const MOCK_RESOURCE_LIST_CORE = 'MOCK_RESOURCE_LIST_CORE';

const MOCK_API_GROUP_BATCH = 'MOCK_API_GROUP_BATCH';
const MOCK_API_GROUP_APPS = 'MOCK_API_GROUP_APPS';
const MOCK_API_GROUP_CORE = 'MOCK_API_GROUP_CORE';

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
            `),
            [MOCK_RESOURCE_LIST_BATCH]: k8sManifest(`
              kind: APIResourceList
              groupVersion: batch/v1
              resources:
                - name: cronjobs
                  singularName: ''
                  namespaced: true
                  kind: CronJob
                  verbs:
                    - create
            `),
            [MOCK_RESOURCE_LIST_APPS]: k8sManifest(`
              kind: APIResourceList
              groupVersion: apps/v1
              resources:
                - name: deployments
                  singularName: ''
                  namespaced: true
                  kind: Deployment
                  verbs:
                    - create
            `),
            [MOCK_RESOURCE_LIST_CORE]: k8sManifest(`
              kind: APIResourceList
              groupVersion: v1
              resources:
                - name: pods
                  singularName: ''
                  namespaced: true
                  kind: Pod
                  verbs:
                    - create
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
            `),
            [`${MOCK_API_GROUP_BATCH}`]: k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: batch
                versions:
                  - groupVersion: batch/v1
                    version: v1
                preferredVersion:
                  groupVersion: batch/v1
                  version: v1
            `),
            [`${MOCK_API_GROUP_APPS}`]: k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: apps
                versions:
                  - groupVersion: apps/v1
                    version: v1
                preferredVersion:
                  groupVersion: apps/v1
                  version: v1
            `),
            [`${MOCK_API_GROUP_CORE}`]: k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: core
                versions:
                  - groupVersion: v1
                    version: v1
                preferredVersion:
                  groupVersion: v1
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
                body: objectify(apiGroup(k8s.AdmissionregistrationApi))
            }
        }));

        apiClient(k8s.EventsApi, apiClients)[apiGroupResourceFunction].returns(Promise.resolve({
            response: {
                body: objectify(apiGroup(k8s.EventsApi))
            }
        }));

        apiClient(k8s.EventsV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.EventsV1Api))
            }
        }));

        apiClient(k8s.CoreV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.CoreV1Api))
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
                    const actualGroupVersions = subject._kindToGroupVersion[normalizeKind(resource.kind).toLowerCase()];
                    expect(actualGroupVersions).to.include(resourceList.groupVersion);
                }
            }
            expect(Object.keys(resList).length).to.be.greaterThan(0);
        })

        it('should provide a map from group to preferred version', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const groups = apiGroups();
            for (const [_, apiGroup] of Object.entries(groups)) {
                for (const entry of apiGroup.versions) {
                    expect(subject._groupVersionToPreferredVersion[entry.groupVersion]).to.equal(apiGroup.preferredVersion.groupVersion);
                }
            }

            expect(Object.keys(groups).length).to.be.greaterThan(0);
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
            await subject.init(kubeConfig, apis);
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
        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should reject unknown kinds', async () => {
            await expect(subject.exists('UnknownKind', 'unimportant', 'unimportant')).to.be.rejectedWith(ErrorNotFound);
        })

        it('should return true for existant objects', async () => {

            const kind = 'Event';
            const name = 'magical-event';
            const namespace = 'default';
            const readFunction = `readNamespaced${kind}`;

            apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns({
              response: {
                body: {
                  apiVersion: 'v1',
                  kind,
                }
              }
            });

            expect(await subject.exists(kind, name, namespace)).to.be.equal(true);
        })

        it('should return false for non-existant objects', async () => {

          const kind = 'Event';
          const name = 'magical-event';
          const namespace = 'default';
          const readFunction = `readNamespaced${kind}`;

          apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns(Promise.reject({
            response: {
              statusCode: 404
            }
          }));

          expect(await subject.exists(kind, name, namespace)).to.be.equal(false);
      })
    })

    describe('read', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should reject unknown kinds', async () => {
            await expect(subject.read('UnknownKind', 'unimportant', 'unimportant')).to.be.rejectedWith(ErrorNotFound);
        })

        it('should broadcast read data from the apis', async () => {

            const kind = 'Event';
            const name = 'magical-event';
            const namespace = 'default';
            const readFunction = `readNamespaced${kind}`;

            apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns({
              response: {
                body: {
                  apiVersion: 'v1',
                  kind,
                }
              }
            });
            apiClient(k8s.EventsV1Api, apiClients)[readFunction].returns({
              response: {
                body: {
                  apiVersion: 'v1',
                  kind,
                }
              }
            });

            await subject.read(kind, name, namespace);

            expect(apiClient(k8s.CoreV1Api, apiClients)[readFunction]).to.have.been.calledOnce;
            expect(apiClient(k8s.EventsV1Api, apiClients)[readFunction]).to.have.been.calledOnce;
        })

        it('should convert read manifests to k8s client objects', async () => {

            const kind = 'Event';
            const name = 'magical-event';
            const namespace = 'default';
            const readFunction = `readNamespaced${kind}`;

            apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns({
              response: {
                body: {
                  apiVersion: 'v1',
                  kind,
                }
              }
            });
            apiClient(k8s.EventsV1Api, apiClients)[readFunction].returns({
              response: {
                body: {
                  apiVersion: 'events.k8s.io/v1',
                  kind,
                }
              }
            });

            const actual = await subject.read(kind, name, namespace);

            expect(actual.constructor.name).to.equal('EventsV1Event');
        })

        it('should throw an error if nothing is found', async () => {

            const kind = 'Event';
            const name = 'magical-event';
            const namespace = 'default';
            const readFunction = `readNamespaced${kind}`;

            apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns(Promise.reject({
              response: {
                statusCode: 404
              }
            }));
            apiClient(k8s.EventsV1Api, apiClients)[readFunction].returns( Promise.reject({
              response: {
                statusCode: 404
              }
            }));

            await expect(subject.read(kind, name, namespace)).to.be.rejectedWith(ErrorNotFound);
        })

    })

    describe('_broadcastReadStrategy', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should reject unknown kinds', () => {
            expect(() => subject._broadcastReadStrategy('UnknownKind', 'unimportant', 'unimportant')).to.throw(ErrorNotFound);
        })

        it('should rely on strategy handler to execute strategies', () => {
            const strategy = subject._broadcastReadStrategy('Event', 'somename', 'somenamespace');
            expect(strategy.name).to.include('_handleStrategyExecution');
        })
    })

    describe('_readClusterObjectStrategy', () => {

        /**
         * NOTE: The kinds used here have to be kinds accepted by the mock APIs because they're created
         * using sinon.createStubInstance. Therefore, the stubs are literally created from functions that
         * exist on the class passed in.
         */

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should reject unknown kinds', () => {
            const api = subject._clientApi('v1');
            expect(() => subject._readClusterObjectStrategy(api, 'UnknownKind', 'unimportant', 'unimportant')).to.throw(ErrorNotFound);
        })

        it('should return a non-namespaced function if one exists', () => {
            const api = subject._clientApi('v1');
            const kind = 'Namespace';
            const name = 'metadata.name';
            const namespace = 'metadata.namespace';
            const strategy = subject._readClusterObjectStrategy(api, kind, name, namespace);
            expect(strategy.name).to.include(`read${kind}`);
            expect(strategy.name).not.to.include(`readNamespaced`);
        })

        it('should return a namespaced function if one exists', () => {
            const api = subject._clientApi('v1');
            const kind = 'Event';
            const name = 'metadata.name';
            const namespace = 'metadata.namespace';
            const strategy = subject._readClusterObjectStrategy(api, kind, name, namespace);
            expect(strategy.name).to.include(`readNamespaced${kind}`);
        })
    })

    describe('createAll', () => {

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should execute creation in the same order as the provided manifests', async () => {
<<<<<<< HEAD
        // TODO:
=======
        const manifestCronJob = k8sManifest(`
          apiVersion: batch/v1
          kind: CronJob
          metadata:
            namespace: "default"
        `);

        const manifestDeployment = k8sManifest(`
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            namespace: "default"
        `);

        const manifestPod = k8sManifest(`
          apiVersion: v1
          kind: Pod
          metadata:
            namespace: "default"
        `);

        apiClient(k8s.CoreV1Api, apiClients)['createNamespacedCronJob'] = sinon.stub().withArgs(manifestCronJob).returns({
          response: {
            body: manifestCronJob
          }
        });

        apiClient(k8s.CoreV1Api, apiClients)['createNamespacedDeployment'] = sinon.stub().withArgs(manifestDeployment).returns({
          response: {
            body: manifestDeployment
          }
        });

        apiClient(k8s.CoreV1Api, apiClients)['createNamespacedPod'] = sinon.stub().withArgs(manifestPod).returns({
          response: {
            body: manifestPod
          }
        });

        const actuals = await subject.createAll([manifestCronJob, manifestDeployment, manifestPod]);

        expect(actuals[0].constructor.name).to.include('CronJob');
        expect(actuals[1].constructor.name).to.include('Deployment');
        expect(actuals[2].constructor.name).to.include('Pod');
>>>>>>> 6973be1964f0eae837a67cd2854eb73824cc331d
      })
    })

    describe('_creationStrategy', () => {

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
        const manifest = new k8s.V1CronJob();
        manifest.apiVersion = 'v1';
        manifest.kind = 'UnknownKind';
        expect(() => subject._creationStrategy(manifest)).to.throw(ErrorNotFound);
      })

      it('should return namespaced function for namespaced kinds', () => {
        const manifest = k8sManifest(`
          apiVersion: v1
          kind: Event
          metadata:
            name: 'some-event'
        `);

        const actual = subject._creationStrategy(manifest);

        expect(actual.name).to.include('createNamespaced');
      })

      it('should return non-namespaced function for non-namespaced manifests', () => {
        const manifest = k8sManifest(`
          apiVersion: v1
          kind: Event
          metadata:
            name: 'some-event'
        `);
        const nonNamespacedFunctionName = `create${manifest.kind}`;

        apiClient(k8s.CoreV1Api, apiClients)[nonNamespacedFunctionName] = sinon.stub();

        const actual = subject._creationStrategy(manifest);

        expect(actual.name).not.to.include('Namespaced');
      })
    })

    describe('_registeredKind', () => {
        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should indicate true for kinds registered', () => {
            expect(subject._registeredKind('event')).to.equal(true);
        })

        it('should indicate false for kind that are not registered', () => {
            expect(subject._registeredKind('notregisteredkind1')).to.equal(false);
        })

        it('should be case insensitive', () => {
            const first = subject._registeredKind('event');
            const second = subject._registeredKind('EvENt');
            expect(first).to.equal(second);
        })
    })

    describe('_clientApis', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should be case independent', () => {
            const first = subject._clientApis('Event');
            const second = subject._clientApis('eVeNT');
            expect(first).not.to.equal(undefined);
            expect(first).not.to.equal(null);
            expect(first).to.equal(second);
        })
    })

    describe('_clientApi', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should be case independent', () => {
            const first = subject._clientApi('events.k8s.io/v1beta1');
            const second = subject._clientApi('eVenTS.K8s.IO/v1BETA1');
            expect(first).not.to.equal(undefined);
            expect(first).not.to.equal(null);
            expect(first).to.equal(second);
        })

        it('should throw an error if the specified api is not found', () => {
            expect(() => subject._clientApi('someunrecognizedapi.io/v1')).to.throw(ErrorNotFound);
        })
    })

    describe('_groupVersions', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
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

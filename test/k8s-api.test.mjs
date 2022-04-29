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
                apiVersion: v1
                groupVersion: v1
                resources:
                  - name: pods
                    singularName: ''
                    namespaced: true
                    kind: Pod
                    verbs:
                      - create
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
            `),
            [`${k8s.BatchV1Api.name}`]: k8sManifest(`
              kind: APIResourceList
              apiVersion: v1
              groupVersion: batch/v1
              resources:
                - name: cronjobs
                  singularName: ''
                  namespaced: true
                  kind: CronJob
                  verbs:
                    - create
            `),
            [`${k8s.BatchV1beta1Api.name}`]: k8sManifest(`
                kind: APIResourceList
                apiVersion: v1
                groupVersion: batch/v1beta1
                resources:
                  - name: cronjobs
                    singularName: ''
                    namespaced: true
                    kind: CronJob
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
                  - name: jobs
                    singularName: ''
                    namespaced: true
                    kind: Job
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
            [`${k8s.AppsV1Api.name}`]: k8sManifest(`
              kind: APIResourceList
              apiVersion: v1
              groupVersion: apps/v1
              resources:
                - name: deployments
                  singularName: ''
                  namespaced: true
                  kind: Deployment
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
            [`${k8s.BatchApi.name}`]: k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: batch
                versions:
                  - groupVersion: batch/v1
                    version: v1
                  - groupVersion: batch/v1beta1
                    version: v1beta1
                preferredVersion:
                  groupVersion: batch/v1
                  version: v1
            `),
            [`${k8s.AppsApi.name}`]: k8sManifest(`
                kind: APIGroup
                apiVersion: v1
                name: apps
                versions:
                  - groupVersion: apps/v1
                    version: v1
                preferredVersion:
                  groupVersion: apps/v1
                  version: v1
            `)
        };
    }

    const apiGroup = (api) => {
        const groups = apiGroups();
        return groups[api.name];
    }

    const initApiClients = (k8sApis) => {

        const clients = {};
        for (const api of k8sApis) {
          clients[api.name] = sinon.createStubInstance(api);
        }
        return clients;
    };

    const apiClient = (api, clients) => {
        return clients[api.name];
    };

    let apis;
    let baseApis;
    let versionedApis;
    let apiClients;
    let kubeConfig;
    let subject;
    beforeEach(() => {

        baseApis = [
          k8s.AdmissionregistrationApi,
          k8s.AppsApi,
          k8s.BatchApi,
          k8s.EventsApi
        ];

        versionedApis = [
          k8s.AppsV1Api,
          k8s.BatchV1Api,
          k8s.BatchV1beta1Api,
          k8s.CoreV1Api,
          k8s.EventsV1Api
        ];

        apis = [ ...baseApis, ...versionedApis ];

        apiClients = initApiClients(apis);

        kubeConfig = sinon.createStubInstance(k8s.KubeConfig);

        kubeConfig.makeApiClient.withArgs(k8s.AdmissionregistrationApi).returns(apiClient(k8s.AdmissionregistrationApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.AppsApi).returns(apiClient(k8s.AppsApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.AppsV1Api).returns(apiClient(k8s.AppsV1Api, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.BatchApi).returns(apiClient(k8s.BatchApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.BatchV1Api).returns(apiClient(k8s.BatchV1Api, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.BatchV1beta1Api).returns(apiClient(k8s.BatchV1beta1Api, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.CoreV1Api).returns(apiClient(k8s.CoreV1Api, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.EventsApi).returns(apiClient(k8s.EventsApi, apiClients));
        kubeConfig.makeApiClient.withArgs(k8s.EventsV1Api).returns(apiClient(k8s.EventsV1Api, apiClients))

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

        apiClient(k8s.BatchApi, apiClients)[apiGroupResourceFunction].returns(Promise.resolve({
            response: {
                body: objectify(apiGroup(k8s.BatchApi))
            }
        }));

        apiClient(k8s.AppsApi, apiClients)[apiGroupResourceFunction].returns(Promise.resolve({
            response: {
                body: objectify(apiGroup(k8s.AppsApi))
            }
        }));

        apiClient(k8s.AppsV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.AppsV1Api))
            }
        }));

        apiClient(k8s.BatchV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.BatchV1Api))
            }
        }));

        apiClient(k8s.BatchV1beta1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.BatchV1beta1Api))
            }
        }));

        apiClient(k8s.CoreV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.CoreV1Api))
            }
        }));

        apiClient(k8s.EventsV1Api, apiClients)[apiResourcesFunction].returns(Promise.resolve({
            response: {
                body: objectify(resourceList(k8s.EventsV1Api))
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
            const k8sResourceList = k8sManifest(`
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

            expect(subject._applyResourceListValuesToMaps.bind(subject, null, k8sResourceList)).not.to.throw();
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
            expect(mappedApis).to.include(apiClient(k8s.EventsV1Api, apiClients));
        })

        it('should provide a mapping from kind to group', async () => {

            await subject._initClientMappings(kubeConfig, apis);
            const resList = resourceLists();
            for (const [_, k8sResourceList] of Object.entries(resList)) {
                for (const resource of k8sResourceList.resources) {
                    const actualGroupVersions = subject._kindToGroupVersion[normalizeKind(resource.kind).toLowerCase()];
                    expect(actualGroupVersions).to.include(k8sResourceList.groupVersion);
                }
            }
            expect(Object.keys(resList).length).to.be.greaterThan(0);
        })

        it('should provide a map from group to preferred version', async () => {

            await subject._initClientMappings(kubeConfig, apis);

            const groups = apiGroups();
            for (const [_, k8sApiGroup] of Object.entries(groups)) {
                for (const entry of k8sApiGroup.versions) {
                    expect(subject._groupVersionToPreferredVersion[entry.groupVersion]).to.equal(k8sApiGroup.preferredVersion.groupVersion);
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
            const actualPreferredVersions = subject.preferredApiVersions('Event')
            expect(actualPreferredVersions).to.include('events.k8s.io/v1');
            expect(actualPreferredVersions).to.include('v1');

        })

    })

    describe('preferredApiVersions', () => {

        beforeEach(async () => {
            await subject.init(kubeConfig, apis);
        })

        it('should map the k8s kind to its preferred api versions', async () => {
            const actualPreferredVersions = subject.preferredApiVersions('Event')
            expect(actualPreferredVersions).to.include('events.k8s.io/v1');
            expect(actualPreferredVersions).to.include('v1');
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

            apiClient(k8s.CoreV1Api, apiClients)[readFunction].returns(Promise.reject({
              response: {
                statusCode: 404
              }
            }));
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

        it('should memoize the encountered manifests', async () => {
            // TODO
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

      const manifestService = k8sManifest(`
        apiVersion: v1
        kind: Service
        metadata:
          namespace: "default"
      `);

      let batchClient;
      let batchFunctionName;
      let boundBatchFunction;
      let appsClient;
      let appsFunctionName;
      let boundAppsFunction;
      let coreClient;
      let coreFunctionName;
      let boundCoreFunction;
      beforeEach(async () => {

        batchClient = apiClient(k8s.BatchV1Api, apiClients);
        batchFunctionName = 'createNamespacedCronJob';
        boundBatchFunction = sinon.stub();
        boundBatchFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestCronJob)
          }
        }));
        batchClient[batchFunctionName].bind = sinon.stub().returns(boundBatchFunction);

        appsClient = apiClient(k8s.AppsV1Api, apiClients);
        appsFunctionName = 'createNamespacedDeployment';
        boundAppsFunction = sinon.stub();
        boundAppsFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestDeployment)
          }
        }));
        appsClient[appsFunctionName].bind = sinon.stub().returns(boundAppsFunction);

        coreClient = apiClient(k8s.CoreV1Api, apiClients);
        coreFunctionName = 'createNamespacedService';
        boundCoreFunction = sinon.stub();
        boundCoreFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestService)
          }
        }));
        coreClient[coreFunctionName].bind = sinon.stub().returns(boundCoreFunction);

        await subject.init(kubeConfig, apis);
      })

      it('should execute creation in the same order as the provided manifests', async () => {
        const actuals = await subject.createAll([manifestCronJob, manifestDeployment, manifestService]);

        expect(actuals[0].constructor.name).to.include('CronJob');
        expect(actuals[1].constructor.name).to.include('Deployment');
        expect(actuals[2].constructor.name).to.include('Service');
      })

      it('should throw an error when creation fails with no status code', async () => {

        boundBatchFunction.returns(Promise.reject());

        await expect(subject.createAll([manifestCronJob, manifestDeployment, manifestService])).to.be.rejected;
      })

      it('should throw an error when creation fails with a status code other than already exists (409)', async () => {

        boundBatchFunction.returns(Promise.reject({
          response: {
            statusCode: 401
          }
        }));

        await expect(subject.createAll([manifestCronJob, manifestDeployment, manifestService])).to.be.rejected;
      })

      it('should not throw an error when creation fails with a status code of already exists (409)', async () => {

        boundBatchFunction.returns(Promise.reject({
          response: {
            statusCode: 409
          }
        }));

        await expect(subject.createAll([manifestCronJob, manifestDeployment, manifestService])).not.to.be.rejected;
      })

      it('should memoize the returned manifest', async () => {
          // TODO
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

    describe('patchAll', () => {
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

      const manifestService = k8sManifest(`
        apiVersion: v1
        kind: Service
        metadata:
          namespace: "default"
      `);

      let batchClient;
      let batchFunctionName;
      let boundBatchFunction;
      let appsClient;
      let appsFunctionName;
      let boundAppsFunction;
      let coreClient;
      let coreFunctionName;
      let boundCoreFunction;
      beforeEach(async () => {

        batchClient = apiClient(k8s.BatchV1Api, apiClients);
        batchFunctionName = 'patchNamespacedCronJob';
        boundBatchFunction = sinon.stub();
        boundBatchFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestCronJob)
          }
        }));
        batchClient[batchFunctionName].bind = sinon.stub().returns(boundBatchFunction);

        appsClient = apiClient(k8s.AppsV1Api, apiClients);
        appsFunctionName = 'patchNamespacedDeployment';
        boundAppsFunction = sinon.stub();
        boundAppsFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestDeployment)
          }
        }));
        appsClient[appsFunctionName].bind = sinon.stub().returns(boundAppsFunction);

        coreClient = apiClient(k8s.CoreV1Api, apiClients);
        coreFunctionName = 'patchNamespacedService';
        boundCoreFunction = sinon.stub();
        boundCoreFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestService)
          }
        }));
        coreClient[coreFunctionName].bind = sinon.stub().returns(boundCoreFunction);

        await subject.init(kubeConfig, apis);
      })

      it('should execute in the same order as the provided manifests', async () => {
        const actuals = await subject.patchAll([manifestCronJob, manifestDeployment, manifestService]);

        expect(actuals[0].constructor.name).to.include('CronJob');
        expect(actuals[1].constructor.name).to.include('Deployment');
        expect(actuals[2].constructor.name).to.include('Service');
      })

      it('should throw an error on failure with no status code', async () => {

        boundBatchFunction.returns(Promise.reject());

        await expect(subject.patchAll([manifestCronJob, manifestDeployment, manifestService])).to.be.rejected;
      })

      it('should throw an error when not found', async () => {

        const notFound = {
          response: {
            statusCode: 404
          }
        };

        boundAppsFunction.returns(Promise.reject(notFound))

        boundBatchFunction.returns(Promise.reject(notFound));

        boundCoreFunction.returns(Promise.reject(notFound));

        await expect(subject.patchAll([manifestCronJob, manifestDeployment, manifestService])).to.be.rejectedWith(ErrorNotFound);
      })

      it('should memoize the encountered manifests', async () => {
          // TODO
      })
    })

    describe('_broadcastPatchStrategy', () => {
      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
          const manifest = {
            kind: 'UnknownKind'
          };
          expect(() => subject._broadcastPatchStrategy(manifest)).to.throw(ErrorNotFound);
      })
    })

    describe('_patchClusterObjectStrategy', () => {

      const manifestService = k8sManifest(`
        apiVersion: v1
        kind: Service
        metadata:
          namespace: "default"
      `);

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should send in the correct content type', () => {

        /**
         * If the content type is not set the request fails saying it can't handle
         * application/json.
         */

        const kind = 'Service';
        const coreClient = apiClient(k8s.CoreV1Api, apiClients);
        const coreFunctionName = `patchNamespaced${kind}`;
        const boundCoreFunction = sinon.stub();
        boundCoreFunction.returns(Promise.resolve({
          response: {
            body: objectify(manifestService)
          }
        }));
        coreClient[coreFunctionName].bind = sinon.stub().returns(boundCoreFunction);

        subject._patchClusterObjectStrategy(coreClient, kind, manifestService);

        const args = coreClient[coreFunctionName].bind.getCall(0).args;
        const options = args[8];
        expect(options.headers['Content-type']).to.equal('application/merge-patch+json');
      })

      it('should reject unknown kinds', () => {
          const api = subject._clientApi('v1');
          expect(() => subject._patchClusterObjectStrategy(api, 'UnknownKind', manifestService)).to.throw(ErrorNotFound);
      })

      it('should return a non-namespaced function if one exists', () => {
          const api = subject._clientApi('v1');
          const kind = 'Namespace';
          const manifest = k8sManifest(`
            apiVersion: v1
            kind: Namespace
            metadata:
              creationTimestamp: "2022-03-08T15:30:07Z"
              labels:
                kubernetes.io/metadata.name: development
              name: development
            spec:
              finalizers:
              - kubernetes
            status:
              phase: Active
          `);
          const strategy = subject._patchClusterObjectStrategy(api, kind, manifest);
          expect(strategy.name).to.include(`patch${kind}`);
          expect(strategy.name).not.to.include(`patchNamespaced`);
      })

      it('should return a namespaced function if one exists', () => {
          const api = subject._clientApi('v1');
          const kind = 'Service';
          const strategy = subject._patchClusterObjectStrategy(api, kind, manifestService);
          expect(strategy.name).to.include(`patchNamespaced${kind}`);
      })
    })

    describe('listAll', () => {

      const cronJobList = k8sManifest(`
        kind: CronJobList
        apiVersion: batch/v1beta1
        metadata:
          resourceVersion: '23576181'
        items:
          - metadata:
              name: fetch-tweets-apple-business
              namespace: development
              uid: ffc919e3-8abd-458a-9123-792c31784f4b
              resourceVersion: '23576152'
              creationTimestamp: 2022-04-28T15:38:20.000Z
              managedFields:
                - manager: unknown
                  operation: Update
                  apiVersion: batch/v1
                  time: 2022-04-28T15:38:20.000Z
                  fieldsType: FieldsV1
                  fieldsV1:
                    f:spec:
                      f:concurrencyPolicy: {}
                      f:failedJobsHistoryLimit: {}
                      f:jobTemplate:
                        f:spec:
                          f:template:
                            f:spec:
                              f:containers:
                                k:{"name":"v1-data-collector"}:
                                  .: {}
                                  f:args: {}
                                  f:command: {}
                                  f:envFrom: {}
                                  f:image: {}
                                  f:imagePullPolicy: {}
                                  f:name: {}
                                  f:resources: {}
                                  f:terminationMessagePath: {}
                                  f:terminationMessagePolicy: {}
                              f:dnsPolicy: {}
                              f:imagePullSecrets:
                                .: {}
                                k:{"name":"docker-secret"}:
                                  .: {}
                                  f:name: {}
                              f:restartPolicy: {}
                              f:schedulerName: {}
                              f:securityContext: {}
                              f:serviceAccount: {}
                              f:serviceAccountName: {}
                              f:terminationGracePeriodSeconds: {}
                      f:successfulJobsHistoryLimit: {}
                      f:suspend: {}
                - manager: unknown
                  operation: Update
                  apiVersion: batch/v1beta1
                  time: 2022-04-28T15:38:30.000Z
                  fieldsType: FieldsV1
                  fieldsV1:
                    f:spec:
                      f:schedule: {}
            spec:
              schedule: 0 */12 * * *
              concurrencyPolicy: Allow
              suspend: false
              jobTemplate:
                metadata:
                  creationTimestamp: null
                spec:
                  template:
                    metadata:
                      creationTimestamp: null
                    spec:
                      containers:
                        - name: v1-data-collector
                          image: thinkdeeptech/collect-data:latest
                          command:
                            - node
                          args:
                            - src/collect-data.mjs
                            - '--entity-name=Apple'
                            - '--entity-type=BUSINESS'
                            - '--operation-type=fetch-tweets'
                          envFrom:
                            - secretRef:
                                name: v1-deep-microservice-collection-secret
                            - secretRef:
                                name: deep-kafka-secret
                          resources: {}
                          terminationMessagePath: /dev/termination-log
                          terminationMessagePolicy: File
                          imagePullPolicy: Always
                      restartPolicy: Never
                      terminationGracePeriodSeconds: 30
                      dnsPolicy: ClusterFirst
                      serviceAccountName: v1-secret-accessor-service-account
                      serviceAccount: v1-secret-accessor-service-account
                      securityContext: {}
                      imagePullSecrets:
                        - name: docker-secret
                      schedulerName: default-scheduler
              successfulJobsHistoryLimit: 3
              failedJobsHistoryLimit: 1
            status: {}
          - metadata:
              name: fetch-tweets-budlight-business
              namespace: development
              uid: 66564788-6a2d-4e8e-9d28-663254c1ccf4
              resourceVersion: '23576160'
              creationTimestamp: 2022-04-28T15:38:30.000Z
              managedFields:
                - manager: unknown
                  operation: Update
                  apiVersion: batch/v1
                  time: 2022-04-28T15:38:30.000Z
                  fieldsType: FieldsV1
                  fieldsV1:
                    f:spec:
                      f:concurrencyPolicy: {}
                      f:failedJobsHistoryLimit: {}
                      f:jobTemplate:
                        f:spec:
                          f:template:
                            f:spec:
                              f:containers:
                                k:{"name":"v1-data-collector"}:
                                  .: {}
                                  f:args: {}
                                  f:command: {}
                                  f:envFrom: {}
                                  f:image: {}
                                  f:imagePullPolicy: {}
                                  f:name: {}
                                  f:resources: {}
                                  f:terminationMessagePath: {}
                                  f:terminationMessagePolicy: {}
                              f:dnsPolicy: {}
                              f:imagePullSecrets:
                                .: {}
                                k:{"name":"docker-secret"}:
                                  .: {}
                                  f:name: {}
                              f:restartPolicy: {}
                              f:schedulerName: {}
                              f:securityContext: {}
                              f:serviceAccount: {}
                              f:serviceAccountName: {}
                              f:terminationGracePeriodSeconds: {}
                      f:schedule: {}
                      f:successfulJobsHistoryLimit: {}
                      f:suspend: {}
            spec:
              schedule: 0 */6 * * *
              concurrencyPolicy: Allow
              suspend: false
              jobTemplate:
                metadata:
                  creationTimestamp: null
                spec:
                  template:
                    metadata:
                      creationTimestamp: null
                    spec:
                      containers:
                        - name: v1-data-collector
                          image: thinkdeeptech/collect-data:latest
                          command:
                            - node
                          args:
                            - src/collect-data.mjs
                            - '--entity-name=BudLight'
                            - '--entity-type=BUSINESS'
                            - '--operation-type=fetch-tweets'
                          envFrom:
                            - secretRef:
                                name: v1-deep-microservice-collection-secret
                            - secretRef:
                                name: deep-kafka-secret
                          resources: {}
                          terminationMessagePath: /dev/termination-log
                          terminationMessagePolicy: File
                          imagePullPolicy: Always
                      restartPolicy: Never
                      terminationGracePeriodSeconds: 30
                      dnsPolicy: ClusterFirst
                      serviceAccountName: v1-secret-accessor-service-account
                      serviceAccount: v1-secret-accessor-service-account
                      securityContext: {}
                      imagePullSecrets:
                        - name: docker-secret
                      schedulerName: default-scheduler
              successfulJobsHistoryLimit: 3
              failedJobsHistoryLimit: 1
            status: {}
        `);

      let v1Client;
      let batchFunctionName;
      let boundV1Function;
      let v1beta1Client;
      let boundV1beta1Function;
      beforeEach(async () => {

        batchFunctionName = 'listNamespacedCronJob';

        v1Client = apiClient(k8s.BatchV1Api, apiClients);
        boundV1Function = sinon.stub();
        boundV1Function.returns(Promise.resolve({
          response: {
            body: objectify(cronJobList)
          }
        }));
        v1Client[batchFunctionName].bind = sinon.stub().returns(boundV1Function);

        v1beta1Client = apiClient(k8s.BatchV1beta1Api, apiClients);
        boundV1beta1Function = sinon.stub();
        boundV1beta1Function.returns(Promise.reject({
          response: {
            statusCode: 404
          }
        }));
        v1beta1Client[batchFunctionName].bind = sinon.stub().returns(boundV1beta1Function);

        await subject.init(kubeConfig, apis);
      })


      it('should reject unknown kinds', async () => {
          await expect(subject.listAll('UnknownKind', 'default')).to.be.rejectedWith(ErrorNotFound);
      })

      it('should assign api version to returned resources', async () => {
        const result = await subject.listAll('CronJob', 'default');

        for (const cronJob of cronJobList.items) {
          expect(cronJob.apiVersion).to.equal(undefined);
        }
        expect(cronJobList.items.length).to.be.greaterThan(0);

        const actualCronJobList = result[0];
        for (const cronJob of actualCronJobList.items) {
          expect(cronJob.apiVersion).to.equal(cronJobList.apiVersion);
        }
        expect(actualCronJobList.items.length).to.be.greaterThan(0);
      })


      it('should assign kind to returned resources', async () => {
        const result = await subject.listAll('CronJob', 'default');

        for (const cronJob of cronJobList.items) {
          expect(cronJob.kind).to.equal(undefined);
        }
        expect(cronJobList.items.length).to.be.greaterThan(0);

        const actualCronJobList = result[0];
        for (const cronJob of actualCronJobList.items) {
          expect(cronJob.kind).to.equal(normalizeKind(cronJob.constructor.name));
        }
        expect(actualCronJobList.items.length).to.be.greaterThan(0);
      })

      it('should memoize the encountered list and list item manifests', async () => {

        const initialNumMemos = Object.keys(subject._kindApiVersionMemo).length;

        await subject.listAll('CronJob', 'default');

        const actualNumMemos = Object.keys(subject._kindApiVersionMemo).length;

        // One list type is added, one item type is added.
        expect(actualNumMemos).to.equal(initialNumMemos + 1 + 1);
      })

    })

    describe('_broadcastListStrategy', () => {

      let v1Client;
      let batchFunctionName;
      let boundV1Function;
      let v1beta1Client;
      let boundV1beta1Function;
      beforeEach(async () => {

        batchFunctionName = 'listNamespacedCronJob';

        v1Client = apiClient(k8s.BatchV1Api, apiClients);
        boundV1Function = sinon.stub();
        boundV1Function.returns(Promise.resolve({
          response: {
            body: {}
          }
        }));
        v1Client[batchFunctionName].bind = sinon.stub().returns(boundV1Function);

        v1beta1Client = apiClient(k8s.BatchV1beta1Api, apiClients);
        boundV1beta1Function = sinon.stub();
        boundV1beta1Function.returns(Promise.resolve({
          response: {
            body: {}
          }
        }));
        v1beta1Client[batchFunctionName].bind = sinon.stub().returns(boundV1beta1Function);

        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
          expect(() => subject._broadcastListStrategy('UnknownKind', 'UnknownNamespace')).to.throw(ErrorNotFound);
      })

      it('should broadcast the list operation over all relevant apis', async () => {

        const strategy = subject._broadcastListStrategy('CronJob', 'default');

        await strategy();

        expect(boundV1Function).to.have.been.calledOnce;
        expect(boundV1beta1Function).to.have.been.calledOnce;
      })
    })

    describe('_listClusterObjectsStrategy', () => {

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
          expect(() => subject._listClusterObjectsStrategy({}, 'UnknownKind', 'UnknownNamespace')).to.throw(ErrorNotFound);
      })

      it('should return a non-namespaced function if one exists', () => {
          const api = apiClient(k8s.CoreV1Api, apiClients);
          const kind = 'Namespace';
          const strategy = subject._listClusterObjectsStrategy(api, kind, 'development');
          expect(strategy.name).to.include(`list${kind}`);
          expect(strategy.name).not.to.include(`listNamespaced`);
      })

      it('should return a namespaced function if one exists and the namespace is defined', () => {
          const api = apiClient(k8s.CoreV1Api, apiClients);
          const kind = 'Service';
          const strategy = subject._listClusterObjectsStrategy(api, kind, 'development');
          expect(strategy.name).to.include(`listNamespaced${kind}`);
      })

      it('should return a list all function if no namespace is supplied', () => {
          const api = apiClient(k8s.CoreV1Api, apiClients);
          const kind = 'Service';
          const strategy = subject._listClusterObjectsStrategy(api, kind);
          expect(strategy.name).to.include(`list${kind}ForAllNamespaces`);
      })
    })



    describe('_deletionStrategy', () => {

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
          const manifest = {
            apiVersion: 'batch/v1',
            kind: "UnknownKind"
          };

          expect(() => subject._deletionStrategy(manifest)).to.throw(ErrorNotFound);
      })
    })

    describe('deleteAll', () => {
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

      const manifestService = k8sManifest(`
        apiVersion: v1
        kind: Service
        metadata:
          namespace: "default"
      `);

      let batchClient;
      let batchFunctionName;
      let boundBatchFunction;
      let appsClient;
      let appsFunctionName;
      let boundAppsFunction;
      let coreClient;
      let coreFunctionName;
      let boundCoreFunction;
      beforeEach(async () => {

        batchClient = apiClient(k8s.BatchV1Api, apiClients);
        batchFunctionName = 'deleteNamespacedCronJob';
        boundBatchFunction = sinon.stub();
        boundBatchFunction.returns(Promise.resolve());
        batchClient[batchFunctionName].bind = sinon.stub().returns(boundBatchFunction);

        appsClient = apiClient(k8s.AppsV1Api, apiClients);
        appsFunctionName = 'deleteNamespacedDeployment';
        boundAppsFunction = sinon.stub();
        boundAppsFunction.returns(Promise.resolve());
        appsClient[appsFunctionName].bind = sinon.stub().returns(boundAppsFunction);

        coreClient = apiClient(k8s.CoreV1Api, apiClients);
        coreFunctionName = 'deleteNamespacedService';
        boundCoreFunction = sinon.stub();
        boundCoreFunction.returns(Promise.resolve());
        coreClient[coreFunctionName].bind = sinon.stub().returns(boundCoreFunction);

        await subject.init(kubeConfig, apis);
      })

      it('should delete all of the specified manifests', async () => {
        await subject.deleteAll([manifestCronJob, manifestDeployment, manifestService]);

        expect(boundBatchFunction).to.be.calledOnce;
        expect(boundAppsFunction).to.be.calledOnce;
        expect(boundCoreFunction).to.be.calledOnce;
      })
    })

    describe('_deleteClusterObjectStrategy', () => {

      beforeEach(async () => {
        await subject.init(kubeConfig, apis);
      })

      it('should reject unknown kinds', () => {
          expect(() => subject._deleteClusterObjectStrategy({}, 'UnknownKind', {})).to.throw(ErrorNotFound);
      })

      it('should return a non-namespaced function if one exists', () => {
          const api = subject._clientApi('v1');
          const kind = 'Namespace';
          const manifest = {
            metadata: {
              name: 'unimportant',
              namespace: 'unimportant-too'
            }
          };
          const strategy = subject._deleteClusterObjectStrategy(api, kind, manifest);
          expect(strategy.name).to.include(`delete${kind}`);
          expect(strategy.name).not.to.include(`deleteNamespaced`);
      })

      it('should return a namespaced function if one exists and the namespace is defined', () => {
          const api = subject._clientApi('v1');
          const kind = 'Service';
          const manifest = {
            metadata: {
              name: 'unimportant',
              namespace: 'unimportant-too',
              kind
            }
          };
          const strategy = subject._deleteClusterObjectStrategy(api, kind, manifest);
          expect(strategy.name).to.include(`deleteNamespaced${kind}`);
      })
    })

    describe('_handleStrategyExecution', () => {

      let strategies;
      beforeEach(() => {
        strategies = [
          sinon.stub().returns(Promise.resolve({
            response: {
              body: {
                apiVersion: 'batch/v1',
                kind: 'Job'
              }
            }
          })),
          sinon.stub().returns(Promise.reject({
            response: {
              statusCode: 404
            }
          })),
          sinon.stub().returns(Promise.resolve({
            response: {
              body: {
                apiVersion: 'batch/v1beta1',
                kind: 'CronJob'
              }
            }
          }))
        ];
      })

      it('should execute all the provided strategies', async () => {
        await subject._handleStrategyExecution(strategies);

        for (const strategy of strategies) {
          expect(strategy).to.have.been.calledOnce;
        }
        expect(strategies.length).to.be.greaterThan(0);
      })

      it('should filter out useless values', async () => {
        const actuals = await subject._handleStrategyExecution(strategies);

        // One strategy throws a 404 resulting in null.
        expect(actuals.length).to.equal(strategies.length - 1)
      })

      it('should throw an error if a non-request error is encountered', async () => {

        strategies[1].returns(Promise.reject());

        await expect(subject._handleStrategyExecution(strategies)).to.be.rejected;
      })

      it('should throw an error if a non-404 status code is encountered', async () => {
        strategies[1].returns(Promise.reject({
          response: {
            statusCode: 401
          }
        }));

        await expect(subject._handleStrategyExecution(strategies)).to.be.rejected;
      })

      it('should not throw an error if a 404 status code is encountered', async () => {
        await expect(subject._handleStrategyExecution(strategies)).not.to.be.rejected;
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
            expect(callback).to.have.callCount(baseApis.length);
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

            expect(callback).to.have.callCount(baseApis.length);
        })

        it('should ignore cases where the resource function is not found', async () => {

            const callback = sinon.stub();

            await subject._forEachApi(kubeConfig, resourceFunctionName, callback, apis);

            /**
             * Note: Whether versioned apis or base apis are used here depends on which resource function
             * is being used. Base apis have the api-group-related functionality whereas versioned haveee
             * the resource-list-related functionality.
             */
            expect(callback).to.have.callCount(baseApis.length);
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

        it('should memoize the encountered manifests', async () => {
            // TODO
        })

    })
})

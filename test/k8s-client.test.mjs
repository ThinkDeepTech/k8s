import { k8sManifest } from '@thinkdeep/k8s-manifest';
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

        it('should accept k8s javascript client objects', async () => {
            const service = k8sManifest(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `);

            api.createAll.returns([]);

            const actuals = await subject.createAll([service]);

            expect(actuals[0].constructor.name).to.include('Service');
        })

        it('should accept template string yaml', async () => {

            api.createAll.returns([]);

            const actuals = await subject.createAll([`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `]);

            expect(actuals[0].constructor.name).to.include('Service');
        })

        it('should process the configurations in the same order as they are passed in', async () => {

            const options = {
                appLabel: 'some-application',
                configMap: 'some-configmap',
                secret: 'some-dynamic-secret-name'
            };

            const pvc = k8sManifest(`
                apiVersion: v1
                kind: PersistentVolumeClaim
                metadata:
                  annotations:
                    pv.kubernetes.io/bind-completed: "yes"
                    pv.kubernetes.io/bound-by-controller: "yes"
                    volume.beta.kubernetes.io/storage-provisioner: dobs.csi.digitalocean.com
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  finalizers:
                  - kubernetes.io/pvc-protection
                  labels:
                    app.kubernetes.io/component: kafka
                    app.kubernetes.io/instance: v1
                    app.kubernetes.io/name: kafka
                  name: data-v1-kafka-0
                  namespace: development
                spec:
                  accessModes:
                  - ReadWriteOnce
                  resources:
                    requests:
                      storage: 8Gi
                  storageClassName: do-block-storage
                  volumeMode: Filesystem
                  volumeName: pvc-e5b00b9f-92c8-468c-b830-889fb13e3d4a
                status:
                  accessModes:
                  - ReadWriteOnce
                  capacity:
                    storage: 8Gi
                  phase: Bound
                `);

            const deployment = k8sManifest(`
                apiVersion: apps/v1
                kind: Deployment
                metadata:
                    annotations:
                        deployment.kubernetes.io/revision: "1"
                        meta.helm.sh/release-name: v1
                        meta.helm.sh/release-namespace: development
                    creationTimestamp: "2022-03-08T15:46:18Z"
                    generation: 1
                    labels:
                        app: ${options.appLabel}-deployment
                        app.kubernetes.io/managed-by: Helm
                    name: ${options.appLabel}-deployment
                    namespace: development
                spec:
                    progressDeadlineSeconds: 600
                    replicas: 1
                    revisionHistoryLimit: 10
                    selector:
                        matchLabels:
                            app: ${options.appLabel}
                    strategy:
                        rollingUpdate:
                            maxSurge: 25%
                            maxUnavailable: 25%
                        type: RollingUpdate
                    template:
                        metadata:
                            creationTimestamp: null
                            labels:
                                app: ${options.appLabel}
                        spec:
                            containers:
                                - envFrom:
                                    - configMapRef:
                                        name: ${options.configMap}
                                    - secretRef:
                                        name: ${options.secret}
                                    - secretRef:
                                        name: somesecret
                                  image: "busybox:latest"
                                  imagePullPolicy: Always
                                  name: ${options.appLabel}
                                  ports:
                                  - containerPort: 4002
                                    protocol: TCP
                                  resources: {}
                                  terminationMessagePath: /dev/termination-log
                                  terminationMessagePolicy: File
                            dnsPolicy: ClusterFirst
                            imagePullSecrets:
                                - name: image-pull-secret
                            restartPolicy: Always
                            schedulerName: default-scheduler
                            securityContext: {}
                            serviceAccount: v1-collection-manager-service-account
                            serviceAccountName: v1-collection-manager-service-account
                            terminationGracePeriodSeconds: 30
                status:
                    availableReplicas: 1
                    conditions:
                        - lastTransitionTime: "2022-03-08T15:58:55Z"
                          lastUpdateTime: "2022-03-08T15:58:55Z"
                          message: ReplicaSet "v1-deep-microservice-collection-deployment-75855858f9" has successfully progressed.
                          reason: NewReplicaSetAvailable
                          status: "True"
                          type: Progressing
                        - lastTransitionTime: "2022-03-10T15:28:11Z"
                          lastUpdateTime: "2022-03-10T15:28:11Z"
                          message: Deployment has minimum availability.
                          reason: MinimumReplicasAvailable
                          status: "True"
                          type: Available
                    observedGeneration: 1
                    readyReplicas: 1
                    replicas: 1
                    updatedReplicas: 1
                `);

            const service = k8sManifest(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `);

            const configurations = [deployment, service, pvc];

            api.createAll.returns([]);

            const actuals = await subject.createAll(configurations);

            expect(actuals[0].constructor.name).to.equal(configurations[0].constructor.name)
            expect(actuals[0].metadata.name).to.equal(configurations[0].metadata.name);

            expect(actuals[1].constructor.name).to.equal(configurations[1].constructor.name)
            expect(actuals[1].metadata.name).to.equal(configurations[1].metadata.name);

            expect(actuals[2].constructor.name).to.equal(configurations[2].constructor.name)
            expect(actuals[2].metadata.name).to.equal(configurations[2].metadata.name);
        })
    })

    describe('create', () => {

        const yaml = `
            apiVersion: v1
            kind: Service
            metadata:
              annotations:
                meta.helm.sh/release-name: v1
                meta.helm.sh/release-namespace: development
              creationTimestamp: "2022-03-08T15:46:18Z"
              labels:
                app.kubernetes.io/managed-by: Helm
              name: v1-deep-microservice-collection-service
              namespace: development
              resourceVersion: "9930598"
              uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
            spec:
              clusterIP: 10.245.63.199
              clusterIPs:
              - 10.245.63.199
              ipFamilies:
              - IPv4
              ipFamilyPolicy: SingleStack
              ports:
              - port: 4002
                protocol: TCP
                targetPort: 4002
              selector:
                app: MyApp
              sessionAffinity: None
              type: ClusterIP
            status:
              loadBalancer: {}
            `;

        it('should accept k8s javascript client objects', async () => {
            const clientObject = k8sManifest(yaml);

            api.createAll.returns([]);

            const actual = await subject.create(clientObject);

            expect(actual.constructor.name).to.include('Service');
        })

        it('should accept template string yaml', async () => {

            api.createAll.returns([]);

            const actual = await subject.create(yaml);

            expect(actual.constructor.name).to.include('Service');
        })

        it('should return the k8s javascript client object from the API if the object was created', async () => {

            const clientObjectsFromApi = [ k8sManifest(yaml) ];

            api.createAll.returns(clientObjectsFromApi);

            const actual = await subject.create(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                `);

            expect(actual).to.equal(clientObjectsFromApi[0]);
        })
    })


    describe('applyAll', () => {

        it('should accept k8s javascript client objects', async () => {
            const service = k8sManifest(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `);

            api.exists.returns(false);

            api.createAll.returns([]);

            const actuals = await subject.applyAll([service]);

            expect(actuals[0].constructor.name).to.include('Service');
        })

        it('should accept template string yaml', async () => {

            api.createAll.returns([]);

            api.exists.returns(false);

            const actuals = await subject.applyAll([`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `]);

            expect(actuals[0].constructor.name).to.include('Service');
        })

        it('should process the configurations in the same order as they are passed in', async () => {

            const options = {
                appLabel: 'some-application',
                configMap: 'some-configmap',
                secret: 'some-dynamic-secret-name'
            };

            const pvc = k8sManifest(`
                apiVersion: v1
                kind: PersistentVolumeClaim
                metadata:
                  annotations:
                    pv.kubernetes.io/bind-completed: "yes"
                    pv.kubernetes.io/bound-by-controller: "yes"
                    volume.beta.kubernetes.io/storage-provisioner: dobs.csi.digitalocean.com
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  finalizers:
                  - kubernetes.io/pvc-protection
                  labels:
                    app.kubernetes.io/component: kafka
                    app.kubernetes.io/instance: v1
                    app.kubernetes.io/name: kafka
                  name: data-v1-kafka-0
                  namespace: development
                spec:
                  accessModes:
                  - ReadWriteOnce
                  resources:
                    requests:
                      storage: 8Gi
                  storageClassName: do-block-storage
                  volumeMode: Filesystem
                  volumeName: pvc-e5b00b9f-92c8-468c-b830-889fb13e3d4a
                status:
                  accessModes:
                  - ReadWriteOnce
                  capacity:
                    storage: 8Gi
                  phase: Bound
                `);

            const deployment = k8sManifest(`
                apiVersion: apps/v1
                kind: Deployment
                metadata:
                    annotations:
                        deployment.kubernetes.io/revision: "1"
                        meta.helm.sh/release-name: v1
                        meta.helm.sh/release-namespace: development
                    creationTimestamp: "2022-03-08T15:46:18Z"
                    generation: 1
                    labels:
                        app: ${options.appLabel}-deployment
                        app.kubernetes.io/managed-by: Helm
                    name: ${options.appLabel}-deployment
                    namespace: development
                spec:
                    progressDeadlineSeconds: 600
                    replicas: 1
                    revisionHistoryLimit: 10
                    selector:
                        matchLabels:
                            app: ${options.appLabel}
                    strategy:
                        rollingUpdate:
                            maxSurge: 25%
                            maxUnavailable: 25%
                        type: RollingUpdate
                    template:
                        metadata:
                            creationTimestamp: null
                            labels:
                                app: ${options.appLabel}
                        spec:
                            containers:
                                - envFrom:
                                    - configMapRef:
                                        name: ${options.configMap}
                                    - secretRef:
                                        name: ${options.secret}
                                    - secretRef:
                                        name: somesecret
                                  image: "busybox:latest"
                                  imagePullPolicy: Always
                                  name: ${options.appLabel}
                                  ports:
                                  - containerPort: 4002
                                    protocol: TCP
                                  resources: {}
                                  terminationMessagePath: /dev/termination-log
                                  terminationMessagePolicy: File
                            dnsPolicy: ClusterFirst
                            imagePullSecrets:
                                - name: image-pull-secret
                            restartPolicy: Always
                            schedulerName: default-scheduler
                            securityContext: {}
                            serviceAccount: v1-collection-manager-service-account
                            serviceAccountName: v1-collection-manager-service-account
                            terminationGracePeriodSeconds: 30
                status:
                    availableReplicas: 1
                    conditions:
                        - lastTransitionTime: "2022-03-08T15:58:55Z"
                          lastUpdateTime: "2022-03-08T15:58:55Z"
                          message: ReplicaSet "v1-deep-microservice-collection-deployment-75855858f9" has successfully progressed.
                          reason: NewReplicaSetAvailable
                          status: "True"
                          type: Progressing
                        - lastTransitionTime: "2022-03-10T15:28:11Z"
                          lastUpdateTime: "2022-03-10T15:28:11Z"
                          message: Deployment has minimum availability.
                          reason: MinimumReplicasAvailable
                          status: "True"
                          type: Available
                    observedGeneration: 1
                    readyReplicas: 1
                    replicas: 1
                    updatedReplicas: 1
                `);

            const service = k8sManifest(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  creationTimestamp: "2022-03-08T15:46:18Z"
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                  resourceVersion: "9930598"
                  uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ipFamilyPolicy: SingleStack
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                status:
                  loadBalancer: {}
                `);

            const configurations = [deployment, service, pvc];

            api.exists.returns(false);

            api.createAll.returns([]);

            const actuals = await subject.applyAll(configurations);

            expect(actuals[0].constructor.name).to.equal(configurations[0].constructor.name)
            expect(actuals[0].metadata.name).to.equal(configurations[0].metadata.name);

            expect(actuals[1].constructor.name).to.equal(configurations[1].constructor.name)
            expect(actuals[1].metadata.name).to.equal(configurations[1].metadata.name);

            expect(actuals[2].constructor.name).to.equal(configurations[2].constructor.name)
            expect(actuals[2].metadata.name).to.equal(configurations[2].metadata.name);
        })
    })

    describe('apply', () => {

        const yaml = `
            apiVersion: v1
            kind: Service
            metadata:
              annotations:
                meta.helm.sh/release-name: v1
                meta.helm.sh/release-namespace: development
              creationTimestamp: "2022-03-08T15:46:18Z"
              labels:
                app.kubernetes.io/managed-by: Helm
              name: v1-deep-microservice-collection-service
              namespace: development
              resourceVersion: "9930598"
              uid: 091a8fd6-23a4-4c64-815b-15eebc3853a9
            spec:
              clusterIP: 10.245.63.199
              clusterIPs:
              - 10.245.63.199
              ipFamilies:
              - IPv4
              ipFamilyPolicy: SingleStack
              ports:
              - port: 4002
                protocol: TCP
                targetPort: 4002
              selector:
                app: MyApp
              sessionAffinity: None
              type: ClusterIP
            status:
              loadBalancer: {}
            `;

        it('should accept k8s javascript client objects', async () => {
            const clientObject = k8sManifest(yaml);

            api.exists.returns(false);

            api.createAll.returns([]);

            const actual = await subject.apply(clientObject);

            expect(actual.constructor.name).to.include('Service');
        })

        it('should accept template string yaml', async () => {

            api.exists.returns(false);

            api.createAll.returns([]);

            const actual = await subject.apply(yaml);

            expect(actual.constructor.name).to.include('Service');
        })

        it('should create the object on the cluster if it does not already exist', async () => {
            api.exists.returns(false);

            api.createAll.returns([]);

            const actual = await subject.apply(yaml);

            expect(api.createAll).to.have.been.calledOnce;
            expect(actual.constructor.name).to.include('Service');
        })

        it('should modify the object on the cluster if it exists', async () => {

            const clientObjectsFromApi = [ k8sManifest(yaml) ];

            api.exists.returns(true);

            api.patchAll.returns(clientObjectsFromApi);

            const actual = await subject.apply(`
                apiVersion: v1
                kind: Service
                metadata:
                  annotations:
                    meta.helm.sh/release-name: v1
                    meta.helm.sh/release-namespace: development
                  labels:
                    app.kubernetes.io/managed-by: Helm
                  name: v1-deep-microservice-collection-service
                  namespace: development
                spec:
                  clusterIP: 10.245.63.199
                  clusterIPs:
                  - 10.245.63.199
                  ipFamilies:
                  - IPv4
                  ports:
                  - port: 4002
                    protocol: TCP
                    targetPort: 4002
                  selector:
                    app: MyApp
                  sessionAffinity: None
                  type: ClusterIP
                `);

            expect(api.patchAll).to.have.been.calledOnce;
            expect(actual).to.equal(clientObjectsFromApi[0]);
        })
    })
})

import {k8sManifest} from '@thinkdeep/k8s-manifest';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import {K8sClient} from '../src/k8s-client.js';
const expect = chai.expect;
chai.use(sinonChai);

describe('k8s-client', function () {
  let kubeConfig;
  let api;
  let subject;
  beforeEach(function () {
    kubeConfig = {};

    api = {
      init: sinon.stub(),
      exists: sinon.stub(),
      createAll: sinon.stub(),
      patchAll: sinon.stub(),
      read: sinon.stub(),
      listAll: sinon.stub(),
      deleteAll: sinon.stub(),
    };

    subject = new K8sClient(kubeConfig, api);
  });

  describe('init', function () {
    it('should initialize the api with kubeConfig', async function () {
      await subject.init();

      const actual = api.init.getCall(0).args[0];
      expect(actual).to.equal(kubeConfig);
    });

    it('should return a reference to this', async function () {
      const actual = await subject.init();
      expect(actual).to.equal(subject);
    });
  });

  describe('exists', function () {
    it('should check if the object exists using the api', async function () {
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
    });
  });

  describe('createAll', function () {
    it('should accept k8s javascript client objects', async function () {
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
    });

    it('should accept template string yaml', async function () {
      api.createAll.returns([]);

      const actuals = await subject.createAll([
        `
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
                `,
      ]);

      expect(actuals[0].constructor.name).to.include('Service');
    });

    it('should process the configurations in the same order as they are passed in', async function () {
      const options = {
        appLabel: 'some-application',
        configMap: 'some-configmap',
        secret: 'some-dynamic-secret-name',
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

      expect(actuals[0].constructor.name).to.equal(
        configurations[0].constructor.name
      );
      expect(actuals[0].metadata.name).to.equal(
        configurations[0].metadata.name
      );

      expect(actuals[1].constructor.name).to.equal(
        configurations[1].constructor.name
      );
      expect(actuals[1].metadata.name).to.equal(
        configurations[1].metadata.name
      );

      expect(actuals[2].constructor.name).to.equal(
        configurations[2].constructor.name
      );
      expect(actuals[2].metadata.name).to.equal(
        configurations[2].metadata.name
      );
    });
  });

  describe('create', function () {
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

    it('should accept k8s javascript client objects', async function () {
      const clientObject = k8sManifest(yaml);

      api.createAll.returns([]);

      const actual = await subject.create(clientObject);

      expect(actual.constructor.name).to.include('Service');
    });

    it('should accept template string yaml', async function () {
      api.createAll.returns([]);

      const actual = await subject.create(yaml);

      expect(actual.constructor.name).to.include('Service');
    });

    it('should return the k8s javascript client object from the API if the object was created', async function () {
      const clientObjectsFromApi = [k8sManifest(yaml)];

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
    });
  });

  describe('applyAll', function () {
    it('should accept k8s javascript client objects', async function () {
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
    });

    it('should accept template string yaml', async function () {
      api.createAll.returns([]);

      api.exists.returns(false);

      const actuals = await subject.applyAll([
        `
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
                `,
      ]);

      expect(actuals[0].constructor.name).to.include('Service');
    });

    it('should process the configurations in the same order as they are passed in', async function () {
      const options = {
        appLabel: 'some-application',
        configMap: 'some-configmap',
        secret: 'some-dynamic-secret-name',
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

      expect(actuals[0].constructor.name).to.equal(
        configurations[0].constructor.name
      );
      expect(actuals[0].metadata.name).to.equal(
        configurations[0].metadata.name
      );

      expect(actuals[1].constructor.name).to.equal(
        configurations[1].constructor.name
      );
      expect(actuals[1].metadata.name).to.equal(
        configurations[1].metadata.name
      );

      expect(actuals[2].constructor.name).to.equal(
        configurations[2].constructor.name
      );
      expect(actuals[2].metadata.name).to.equal(
        configurations[2].metadata.name
      );
    });
  });

  describe('apply', function () {
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

    it('should accept k8s javascript client objects', async function () {
      const clientObject = k8sManifest(yaml);

      api.exists.returns(false);

      api.createAll.returns([]);

      const actual = await subject.apply(clientObject);

      expect(actual.constructor.name).to.include('Service');
    });

    it('should accept template string yaml', async function () {
      api.exists.returns(false);

      api.createAll.returns([]);

      const actual = await subject.apply(yaml);

      expect(actual.constructor.name).to.include('Service');
    });

    it('should create the object on the cluster if it does not already exist', async function () {
      api.exists.returns(false);

      api.createAll.returns([]);

      const actual = await subject.apply(yaml);

      expect(api.createAll.callCount).to.equal(1);
      expect(actual.constructor.name).to.include('Service');
    });

    it('should modify the object on the cluster if it exists', async function () {
      const clientObjectsFromApi = [k8sManifest(yaml)];

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

      expect(api.patchAll.callCount).to.equal(1);
      expect(actual).to.equal(clientObjectsFromApi[0]);
    });
  });

  describe('getAll', function () {
    const kindList = k8sManifest(`
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

    it('should flatten the resource list', async function () {
      api.listAll.returns([kindList]);

      const actuals = await subject.getAll('CronJob', 'default');

      for (let i = 0; i < actuals.length; i++) {
        expect(actuals[i].constructor.name).to.equal(
          kindList.items[i].constructor.name
        );
        expect(actuals[i].metadata.name).to.equal(
          kindList.items[i].metadata.name
        );
      }
      expect(actuals.length).to.be.greaterThan(0);

      expect(actuals.length).to.equal(kindList.items.length);
    });
  });

  describe('get', function () {
    it('fetch the resource from the api', async function () {
      const kind = 'CronJob';
      const name = 'some-name';
      const namespace = 'default';
      await subject.get(kind, name, namespace);

      const readArgs = api.read.getCall(0).args;
      expect(api.read.callCount).to.equal(1);
      expect(readArgs).to.include(kind);
      expect(readArgs).to.include(name);
      expect(readArgs).to.include(namespace);
    });
  });

  describe('deleteAll', function () {
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

    it('should delete each resource', async function () {
      await subject.deleteAll([
        manifestCronJob,
        manifestDeployment,
        manifestService,
      ]);

      const actualManifestCronJob = api.deleteAll.getCall(0).args[0][0];
      const actualManifestDeployment = api.deleteAll.getCall(1).args[0][0];
      const actualManifestService = api.deleteAll.getCall(2).args[0][0];
      expect(actualManifestCronJob).to.equal(manifestCronJob);
      expect(actualManifestDeployment).to.equal(manifestDeployment);
      expect(actualManifestService).to.equal(manifestService);
    });
  });

  describe('delete', function () {
    it('should delete the specified manifest from the api', async function () {
      await subject.delete(
        k8sManifest(`
        apiVersion: batch/v1
        kind: CronJob
        metadata:
          name: sample-cron-job
      `)
      );
      expect(api.deleteAll.callCount).to.equal(1);
    });
  });
});

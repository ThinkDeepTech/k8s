import chai from 'chai';
const expect = chai.expect;

import {K8sManifest} from '../src/k8s-manifest.mjs';

describe('k8s-manifest', () => {

    describe('container mapping', () => {
        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'Pod',
                metadata: {
                    name: 'sample-pod'
                },
                spec: {
                    containers: [{
                        name: 'container-name',
                        image: 'nginx',
                        command: ['/bin/bash'],
                        args: ['-c', 'echo "Hello"'],
                        env: [{
                            name: 'BITNAMI_DEBUG',
                            value: "false"
                        }, {
                            name: 'MONGODB_SYSTEM_LOG_VERBOSITY',
                            value: "0"
                        }, {
                            name: 'MONGODB_DISABLE_SYSTEM_LOG',
                            value: "no"
                        }, {
                            name: 'MONGODB_DISABLE_JAVASCRIPT',
                            value: "no"
                        }, {
                            name: 'MONGODB_ENABLE_JOURNAL',
                            value: "yes"
                        }, {
                            name: 'MONGODB_ENABLE_IPV6',
                            value: "no"
                        }, {
                            name: 'MONGODB_ENABLE_DIRECTORY_PER_DB',
                            value: "no"
                        }],
                        envFrom: [{
                            configMapRef: {
                                name: 'config-map'
                            }
                        },{
                            secretRef: {
                                name: 'secret-name'
                            }
                        }],
                        resources: {
                            requests: {
                                memory: "64Mi",
                                cpu: "250m"
                            },
                            limits: {
                                memory: "128Mi",
                                cpu: "500m"
                            }
                        },
                        ports: [{
                            name: "liveness-port",
                            containerPort: 8080,
                            hostPort: 8080
                        }],
                        livenessProbe: {
                            httpGet: {
                                path: '/healthz',
                                port: 'liveness-port'
                            },
                            failureThreshold: 1,
                            periodSeconds: 10
                        },
                        startupProbe: {
                            httpGet: {
                                path: '/healthz',
                                port: 80
                            },
                            failureThreshold: 30,
                            periodSeconds: 10
                        }
                    }]
                }
            };
        });

        it('should create a container array of k8s client containers', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers)).to.equal(true);
            expect(subject.spec.containers[0].constructor.name).to.include('Container');
        })

        it('should correctly map name', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.containers[0].name).to.include('container-name');
        })

        it('should correctly map image', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.containers[0].image).to.include('nginx');
        })

        it('should correctly map startup probe', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers)).to.equal(true);
            expect(subject.spec.containers[0].startupProbe.constructor.name).to.include('Probe');
            expect(subject.spec.containers[0].startupProbe.failureThreshold).to.equal(30);
            expect(subject.spec.containers[0].startupProbe.periodSeconds).to.equal(10);
        })

        it('should correctly map liveness probe', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers)).to.equal(true);
            expect(subject.spec.containers[0].livenessProbe.constructor.name).to.include('Probe');
            expect(subject.spec.containers[0].livenessProbe.failureThreshold).to.equal(1);
            expect(subject.spec.containers[0].livenessProbe.periodSeconds).to.equal(10);
        })

        it('should correctly map http action', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers)).to.equal(true);
            expect(subject.spec.containers[0].startupProbe.httpGet.constructor.name).to.include('HTTPGetAction');
            expect(subject.spec.containers[0].startupProbe.httpGet.path).to.equal('/healthz');
            expect(subject.spec.containers[0].startupProbe.httpGet.port).to.equal(80);
            expect(subject.spec.containers[0].livenessProbe.httpGet.port).to.equal('liveness-port');
        })

        it('should correctly map ports', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers[0].ports)).to.equal(true);
            expect(subject.spec.containers[0].ports[0].name).to.equal('liveness-port');
            expect(subject.spec.containers[0].ports[0].containerPort).to.equal(8080);
            expect(subject.spec.containers[0].ports[0].hostPort).to.equal(8080);
        })

        it('should correctly map resources', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.containers[0].resources.constructor.name).to.include('ResourceRequirements');
            expect(subject.spec.containers[0].resources.requests.memory).to.equal('64Mi');
            expect(subject.spec.containers[0].resources.requests.cpu).to.equal('250m');
            expect(subject.spec.containers[0].resources.limits.memory).to.equal('128Mi');
            expect(subject.spec.containers[0].resources.limits.cpu).to.equal('500m');
        })

        it('should correctly map command', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers[0].command)).to.equal(true);
            expect(subject.spec.containers[0].command[0]).to.equal('/bin/bash');
        })

        it('should correctly map args', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers[0].args)).to.equal(true);
            expect(subject.spec.containers[0].args[0]).to.equal('-c');
            expect(subject.spec.containers[0].args[1]).to.equal('echo "Hello"');
        })

        it('should correctly map env', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers[0].env)).to.equal(true);
            expect(subject.spec.containers[0].env[0].constructor.name).to.include('EnvVar');
            expect(subject.spec.containers[0].env[0].name).to.equal(parsedYaml.spec.containers[0].env[0].name);
            expect(subject.spec.containers[0].env[1].name).to.equal(parsedYaml.spec.containers[0].env[1].name);
            expect(subject.spec.containers[0].env[2].name).to.equal(parsedYaml.spec.containers[0].env[2].name);
            expect(subject.spec.containers[0].env[0].value).to.equal(parsedYaml.spec.containers[0].env[0].value);
            expect(subject.spec.containers[0].env[1].value).to.equal(parsedYaml.spec.containers[0].env[1].value);
            expect(subject.spec.containers[0].env[2].value).to.equal(parsedYaml.spec.containers[0].env[2].value);
            expect(subject.spec.containers[0].env.length).to.equal(7);
        })

        it('should correctly map envFrom', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers[0].envFrom)).to.equal(true);

            const envFrom = subject.spec.containers[0].envFrom;

            const configMapKey = Object.keys(envFrom[0])[0];
            const secretRefKey = Object.keys(envFrom[1])[0];
            expect(configMapKey).to.equal('configMapRef');
            expect(envFrom[0].constructor.name).to.include('EnvFromSource');
            expect(envFrom[0][configMapKey].constructor.name).to.include('ConfigMapEnvSource');
            expect(envFrom[0][configMapKey].name).to.equal('config-map');

            expect(secretRefKey).to.equal('secretRef');
            expect(envFrom[1].constructor.name).to.include('EnvFromSource');
            expect(envFrom[1][secretRefKey].constructor.name).to.include('SecretEnvSource');
            expect(envFrom[1][secretRefKey].name).to.equal('secret-name');
        })
    })

    describe('pod mapping', () => {
        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'Pod',
                metadata: {
                    name: 'sample-pod'
                },
                spec: {
                    containers: [{
                        name: 'container-name',
                        image: 'nginx'
                    }],
                    dnsPolicy: "ClusterFirst",
                    imagePullSecrets: [{
                        name: "docker-secret"
                    }],
                    restartPolicy: "Never",
                    schedulerName: "default-scheduler",
                    securityContext: {},
                    serviceAccount: "service-account",
                    serviceAccountName: "service-account-name",
                    terminationGracePeriodSeconds: 30
                }
            };
        });

        it('should create a k8s client pod', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('Pod');
            expect(subject.apiVersion).to.equal('v1');
            expect(subject.kind).to.equal('Pod');
        })

        it('should create a k8s client pod spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('PodSpec');
        })

        it('should create a container array of k8s client containers', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.containers)).to.equal(true);
            expect(subject.spec.containers[0].constructor.name).to.include('Container');
        })

        it('should set the termination grace period', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.terminationGracePeriodSeconds).to.equal(30);
        })

        it('should set the scheduler name', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.serviceAccountName).to.equal('service-account-name');
        })


        it('should set the serviceAccount', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.serviceAccount).to.equal('service-account');
        })

        it('should set the security context', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.securityContext.constructor.name).to.include('SecurityContext');
        })

        it('should set the scheduler name', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.schedulerName).to.equal('default-scheduler');
        })

        it('should set the restart policy', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.restartPolicy).to.equal('Never');
        })

        it('should set the dnsPolicy', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.dnsPolicy).to.equal('ClusterFirst');
        })

        it('should set the image pull secrets', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.imagePullSecrets)).to.equal(true)
            expect(subject.spec.imagePullSecrets[0].constructor.name).to.include('LocalObjectReference');
            expect(subject.spec.imagePullSecrets[0].name).to.equal('docker-secret');
        })
    })

    describe('job mapping', () => {
        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'batch/v1',
                kind: 'Job',
                metadata: {
                    name: 'job'
                },
                spec: {
                    backoffLimit: 6,
                    completions: 1,
                    parallelism: 1,
                    selector: {
                        matchLabels: {
                            "controller-uid": "50453798-481c-4381-8561-8bacf22b9444"
                        },
                        matchExpressions: [{
                            key: 'tier',
                            operator: 'In',
                            values: ['cache']
                        }]
                    },
                    template: {
                        metadata: {
                            labels: {
                                "controller-uid": "50453798-481c-4381-8561-8bacf22b9444",
                                "job-name": "fetch-tweets-apple-business"
                            },
                            creationTimestamp: null
                        },
                        spec: {
                            containers: [{
                                name: 'container-name',
                                image: 'nginx'
                            }]
                        }
                    }
                }
            };
        });

        it('should create a k8s client job', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('Job');
            expect(subject.apiVersion).to.equal('batch/v1');
            expect(subject.kind).to.equal('Job');
        })

        it('should create a job spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('JobSpec');
        })

        it('should correctly map pod template', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.template.constructor.name).to.include('PodTemplateSpec');
        })

        it('should correctly map pod spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.template.spec.constructor.name).to.include('PodSpec');
        })

        it('should correctly map pod template metadata', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.template.metadata.constructor.name).to.include('ObjectMeta');
            expect(subject.spec.template.metadata.labels['controller-uid']).to.equal('50453798-481c-4381-8561-8bacf22b9444');
            expect(subject.spec.template.metadata.labels['job-name']).to.equal('fetch-tweets-apple-business');

        })

        it('should correctly set selector match expressions', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.selector.matchExpressions)).to.equal(true);
            expect(subject.spec.selector.matchExpressions[0].constructor.name).to.include('LabelSelectorRequirement');

            const firstExpression = subject.spec.selector.matchExpressions[0];
            expect(firstExpression.key).to.equal('tier');
            expect(firstExpression.operator).to.equal('In');
            expect(Array.isArray(firstExpression.values)).to.equal(true);
            expect(firstExpression.values[0]).to.equal('cache');

        })

        it('should correctly set selector match labels', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.selector.matchLabels['controller-uid']).to.equal("50453798-481c-4381-8561-8bacf22b9444");
        })

        it('should correctly set selector', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.selector.constructor.name).to.include('LabelSelector');
        })

        it('should correctly set parallelism', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.parallelism).to.equal(1);
        })

        it('should correctly set completions', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.completions).to.equal(1);
        })

        it('should correctly set backoff limit', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.backoffLimit).to.equal(6);
        })
    })

    describe('cron job mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'batch/v1',
                kind: 'CronJob',
                metadata: {
                    name: 'cron-job'
                },
                spec: {
                    schedule: '* * * * *',
                    jobTemplate: {
                        spec: {
                            template: {
                                spec: {
                                    containers: [{
                                        name: 'container-name',
                                        image: 'nginx'
                                    }]
                                }
                            }
                        }
                    }
                }
            };
        });

        it('should create a k8s client cron job', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('CronJob');
            expect(subject.apiVersion).to.equal('batch/v1');
            expect(subject.kind).to.equal('CronJob');
        })

        it('should create a k8s client cron job spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('CronJobSpec');
        })

        it('should correctly map the schedule', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.schedule).to.equal('* * * * *');
        })

        it('should create a k8s client job template', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.jobTemplate.constructor.name).to.include('JobTemplateSpec');
        })

        it('should create a k8s client job spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.jobTemplate.spec.constructor.name).to.include('JobSpec');
        })
    })

    describe('beta cron job mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'batch/v1beta1',
                kind: 'CronJob',
                metadata: {
                    name: 'cron-job'
                },
                spec: {
                    schedule: '* * * * *',
                    jobTemplate: {
                        spec: {
                            template: {
                                spec: {
                                    containers: [{
                                        name: 'container-name',
                                        image: 'nginx'
                                    }]
                                }
                            }
                        }
                    }
                }
            };
        });

        it('should create a k8s client cron job', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('CronJob');
            expect(subject.apiVersion).to.equal('batch/v1beta1');
            expect(subject.kind).to.equal('CronJob');
        })

        it('should create a k8s client cron job spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('CronJobSpec');
        })

        it('should correctly map the schedule', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.schedule).to.equal('* * * * *');
        })

        it('should create a k8s client job template', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.jobTemplate.constructor.name).to.include('JobTemplateSpec');
        })

        it('should create a k8s client job spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.jobTemplate.spec.constructor.name).to.include('JobSpec');
        })
    })

    describe('deployment mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    name: 'application-deployment',
                    namespace: 'development'
                },
                spec: {
                    minReadySeconds: 60,
                    progressDeadlineSeconds: 600,
                    replicas: 3,
                    revisionHistoryLimit: 10,
                    paused: false,
                    selector: {
                        matchLabels: {
                            app: 'application-deployment'
                        }
                    },
                    strategy: {
                        rollingUpdate: {
                            maxSurge: '25%',
                            maxUnavailable: '25%'
                        },
                        type: 'RollingUpdate'
                    },
                    template: {
                        spec: {
                            containers: []
                        }
                    }
                }
            };
        });

        it('should correctly map to k8s client deployment', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('Deployment');
            expect(subject.kind).to.equal('Deployment');
            expect(subject.apiVersion).to.equal('apps/v1');
        })

        it('should correctly map deployment spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('DeploymentSpec');
        })

        it('should correctly map deployment spec min ready seconds', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.minReadySeconds).to.equal(60);
        })

        it('should correctly map deployment spec replicas', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.replicas).to.equal(3);
        })

        it('should correctly map deployment spec progress deadline', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.progressDeadlineSeconds).to.equal(600);
        })

        it('should correctly map deployment spec revision history limit', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.revisionHistoryLimit).to.equal(10);
        })

        it('should correctly map deployment spec paused', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.paused).to.equal(false);
        })

        it('should correctly map deployment spec strategy', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.strategy.constructor.name).to.include('DeploymentStrategy');
            expect(subject.spec.strategy.type).to.equal('RollingUpdate');
            expect(subject.spec.strategy.rollingUpdate.constructor.name).to.include('RollingUpdateDeployment');
            expect(subject.spec.strategy.rollingUpdate.maxSurge).to.equal('25%');
            expect(subject.spec.strategy.rollingUpdate.maxUnavailable).to.equal('25%');
        })

        it('should correctly map deployment spec selector', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.selector.constructor.name).to.include('LabelSelector');
            expect(subject.spec.selector.matchLabels['app']).to.equal("application-deployment");
        })

        it('should correctly map deployment spec template', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.template.constructor.name).to.include('PodTemplateSpec');
        })
    })

    describe('persistent volume mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'PersistentVolume',
                metadata: {
                    annotations: {
                        'pv.kubernetes.io/provisioned-by': 'dobs.csi.digitalocean.com'
                    },
                    creationTimestamp: "2022-03-08T15:46:22Z",
                    finalizers: [
                        'kubernetes.io/pv-protection',
                        'external-attacher/dobs-csi-digitalocean-com'
                    ],
                    name: 'my-persistent-volume'
                },
                spec: {
                    accessModes: ['ReadWriteOnce'],
                    awsElasticBlockStore: {
                        fsType: 'type',
                        partition: 'partition',
                        readOnly: true,
                        volumeID: '1'
                    },
                    azureDisk: {
                        cachingMode: 'mode',
                        diskName: 'disk-name',
                        diskURI: 'disk://whatever/path',
                        fsType: 'type',
                        kind: 'disk-kind',
                        readOnly: false
                    },
                    azureFile: {
                        readOnly: false,
                        secretName: 'secret-name',
                        secretNamespace: 'secret-namespace',
                        shareName: 'share-name'
                    },
                    cephfs: {
                        monitors: [
                            'monitor1',
                            'monitor2'
                        ],
                        path: 'path',
                        readOnly: true,
                        secretFile: 'secret-file',
                        user: 'user1',
                        secretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        }
                    },
                    cinder: {
                        volumeID: '1',
                        readOnly: true,
                        fsType: 'fs-type',
                        secretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        }
                    },
                    capacity: {
                        storage: '8Gi'
                    },
                    claimRef: {
                        apiVersion: 'v1',
                        kind: 'PersistentVolumeClaim',
                        name: 'v1-analysismongodb',
                        namespace: 'development'
                    },
                    csi: {
                        driver: 'dobs.csi.digitalocean.com',
                        fsType: 'ext4',
                        volumeAttributes: {
                            'storage.kubernetes.io/csiProvisionerIdentity': '1643213782115-8081-dobs.csi.digitalocean.com'
                        },
                        volumeHandle: 'e72e4b60-9ef6-11ec-b54c-0a58ac14e15c',
                        controllerExpandSecretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        },
                        controllerPublishSecretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        },
                        nodePublishSecretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        },
                        nodeStageSecretRef: {
                            name: 'secret-name',
                            namespace: 'secret-namespace'
                        },
                    },
                    fc: {
                        fsType: 'fs-type',
                        readOnly: true,
                        lun: 1,
                        targetWWNs: [
                            'wwn1',
                            'wwn2'
                        ],
                        wwids: [
                            'wwid1',
                            'wwid2'
                        ]
                    },
                    persistentVolumeReclaimPolicy: 'Delete',
                    storageClassName: 'do-block-storage',
                    volumeMode: 'Filesystem'
                }
            };
        });

        it('should correctly map to k8s client persistent volume', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('PersistentVolume');
            expect(subject.kind).to.equal('PersistentVolume');
            expect(subject.apiVersion).to.equal('v1');
        })

        it('should correctly map to k8s client persistent volume spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('PersistentVolumeSpec');
        })

        it('should correctly map persistent volume spec access modes ', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.accessModes)).to.equal(true);
            expect(subject.spec.accessModes[0]).to.equal('ReadWriteOnce');
        })

        it('should correctly map persistent volume spec aws elastic block store ', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.awsElasticBlockStore.constructor.name).to.include('AWSElasticBlockStoreVolumeSource');
            expect(subject.spec.awsElasticBlockStore.fsType).to.equal('type');
            expect(subject.spec.awsElasticBlockStore.partition).to.equal('partition');
            expect(subject.spec.awsElasticBlockStore.volumeID).to.equal('1');
            expect(subject.spec.awsElasticBlockStore.readOnly).to.equal(true);
        })

        it('should correctly map persistent volume spec azure disk ', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.azureDisk.constructor.name).to.include('AzureDiskVolumeSource');
            expect(subject.spec.azureDisk.fsType).to.equal('type');
            expect(subject.spec.azureDisk.cachingMode).to.equal('mode');
            expect(subject.spec.azureDisk.diskName).to.equal('disk-name');
            expect(subject.spec.azureDisk.kind).to.equal('disk-kind');
            expect(subject.spec.azureDisk.readOnly).to.equal(false);
        })

        it('should correctly map persistent volume spec azure file', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.azureFile.constructor.name).to.include('AzureFilePersistentVolumeSource');
            expect(subject.spec.azureFile.secretName).to.equal('secret-name');
            expect(subject.spec.azureFile.secretNamespace).to.equal('secret-namespace');
            expect(subject.spec.azureFile.shareName).to.equal('share-name');
            expect(subject.spec.azureFile.readOnly).to.equal(false);
        })

        it('should correctly map persistent volume spec capacity', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.capacity.storage).to.equal('8Gi');
        })

        it('should correctly map persistent volume spec cephfs', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.cephfs.constructor.name).to.include('CephFSPersistentVolumeSource');
            expect(Array.isArray(subject.spec.cephfs.monitors)).to.equal(true);
            expect(subject.spec.cephfs.monitors[0]).to.equal('monitor1');
            expect(subject.spec.cephfs.monitors[1]).to.equal('monitor2');
            expect(subject.spec.cephfs.path).to.equal('path');
            expect(subject.spec.cephfs.readOnly).to.equal(true);
            expect(subject.spec.cephfs.secretFile).to.equal('secret-file');
            expect(subject.spec.cephfs.user).to.equal('user1');

            expect(subject.spec.cephfs.secretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.cephfs.secretRef.name).to.equal('secret-name');
            expect(subject.spec.cephfs.secretRef.namespace).to.equal('secret-namespace');
        })

        it('should correctly map persistent volume spec cinder', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.cinder.constructor.name).to.include('CinderPersistentVolumeSource');
            expect(subject.spec.cinder.volumeID).to.equal('1');
            expect(subject.spec.cinder.fsType).to.equal('fs-type');
            expect(subject.spec.cinder.readOnly).to.equal(true);
            expect(subject.spec.cinder.secretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.cinder.secretRef.name).to.equal('secret-name');
            expect(subject.spec.cinder.secretRef.namespace).to.equal('secret-namespace');
        })

        it('should correctly map persistent volume spec claim reference', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.claimRef.constructor.name).to.include('ObjectReference');
            expect(subject.spec.claimRef.apiVersion).to.equal('v1');
            expect(subject.spec.claimRef.kind).to.equal('PersistentVolumeClaim');
            expect(subject.spec.claimRef.name).to.equal('v1-analysismongodb');
            expect(subject.spec.claimRef.namespace).to.equal('development');
        })

        it('should correctly map persistent volume spec csi', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.csi.constructor.name).to.include('CSIPersistentVolumeSource');
            expect(subject.spec.csi.driver).to.equal('dobs.csi.digitalocean.com');
            expect(subject.spec.csi.fsType).to.equal('ext4');
            expect(subject.spec.csi.volumeHandle).to.equal('e72e4b60-9ef6-11ec-b54c-0a58ac14e15c');
            expect(subject.spec.csi.volumeAttributes['storage.kubernetes.io/csiProvisionerIdentity']).to.equal('1643213782115-8081-dobs.csi.digitalocean.com');

            expect(subject.spec.csi.controllerExpandSecretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.csi.controllerExpandSecretRef.name).to.equal('secret-name');
            expect(subject.spec.csi.controllerExpandSecretRef.namespace).to.equal('secret-namespace');

            expect(subject.spec.csi.controllerPublishSecretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.csi.controllerPublishSecretRef.name).to.equal('secret-name');
            expect(subject.spec.csi.controllerPublishSecretRef.namespace).to.equal('secret-namespace');

            expect(subject.spec.csi.nodePublishSecretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.csi.nodePublishSecretRef.name).to.equal('secret-name');
            expect(subject.spec.csi.nodePublishSecretRef.namespace).to.equal('secret-namespace');

            expect(subject.spec.csi.nodeStageSecretRef.constructor.name).to.include('SecretReference');
            expect(subject.spec.csi.nodeStageSecretRef.name).to.equal('secret-name');
            expect(subject.spec.csi.nodeStageSecretRef.namespace).to.equal('secret-namespace');
        })

        it('should correctly map persistent volume spec fc', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.fc.constructor.name).to.include('FCVolumeSource');
            expect(subject.spec.fc.fsType).to.equal(parsedYaml.spec.fc.fsType);
            expect(subject.spec.fc.readOnly).to.equal(parsedYaml.spec.fc.readOnly);
            expect(subject.spec.fc.lun).to.equal(parsedYaml.spec.fc.lun);

            expect(Array.isArray(subject.spec.fc.targetWWNs)).to.equal(true);
            expect(subject.spec.fc.targetWWNs[0]).to.equal(parsedYaml.spec.fc.targetWWNs[0]);
            expect(subject.spec.fc.targetWWNs[1]).to.equal(parsedYaml.spec.fc.targetWWNs[1]);

            expect(Array.isArray(subject.spec.fc.wwids)).to.equal(true);
            expect(subject.spec.fc.wwids[0]).to.equal(parsedYaml.spec.fc.wwids[0]);
            expect(subject.spec.fc.wwids[1]).to.equal(parsedYaml.spec.fc.wwids[1]);
        })
    })

    describe('persistent volume claim mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'PersistentVolumeClaim',
                metadata: {
                    annotations: {
                        'pv.kubernetes.io/bind-completed': "yes",
                        'pv.kubernetes.io/bound-by-controller': "yes",
                        'volume.beta.kubernetes.io/storage-provisioner': 'dobs.csi.digitalocean.com'
                    },
                    creationTimestamp: "2022-03-08T15:46:18Z",
                    finalizers: [
                        'kubernetes.io/pvc-protection'
                    ],
                    labels: {
                        "app.kubernetes.io/component": 'kafka',
                        'app.kubernetes.io/instance': 'v1',
                        'app.kubernetes.io/name': 'kafka'
                    },
                    'name': 'data-v1-kafka-0',
                    'namespace': 'development'
                },
                spec: {
                    accessModes: [
                        'ReadWriteOnce'
                    ],
                    selector: {
                        matchLabels: {
                            app: 'application-deployment'
                        }
                    },
                    resources: {
                        requests: {
                            storage: '8Gi'
                        }
                    },
                    storageClassName: 'do-block-storage',
                    volumeMode: 'Filesystem',
                    volumeName: 'pvc-e5b00b9f-92c8-468c-b830-889fb13e3d4a'
                },
                status: {
                    accessModes: [
                        'ReadWriteOnce'
                    ],
                    capacity: {
                        storage: '8Gi'
                    },
                    phase: 'Bound'
                }
            };
        });

        it('should correctly map to k8s client persistent volume claim', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('PersistentVolumeClaim');
            expect(subject.kind).to.equal('PersistentVolumeClaim');
            expect(subject.apiVersion).to.equal('v1');
        })

        it('should correctly map persistent volume claim spec', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.constructor.name).to.include('PersistentVolumeClaimSpec');
        })

        it('should correctly map persistent volume claim spec access modes', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.spec.accessModes)).to.equal(true);
            expect(subject.spec.accessModes[0]).to.equal(parsedYaml.spec.accessModes[0]);
        })

        it('should correctly map persistent volume claim spec selector', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.selector.constructor.name).to.include('LabelSelector');
            expect(subject.spec.selector.matchLabels.app).to.equal(parsedYaml.spec.selector.matchLabels.app);
        })

        it('should correctly map persistent volume claim spec resources', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.resources.constructor.name).to.include('ResourceRequirements');
            expect(subject.spec.resources.requests.storage).to.equal(parsedYaml.spec.resources.requests.storage);
        })

        it('should correctly map string fields', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.spec.storageClassName).to.equal(parsedYaml.spec.storageClassName);
        })

        it('should correctly map persistent volume claim status', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.status.constructor.name).to.include('PersistentVolumeClaimStatus');
        })

        it('should correctly map persistent volume claim status access modes', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.status.accessModes)).to.equal(true);
            expect(subject.status.accessModes[0]).to.equal(parsedYaml.status.accessModes[0]);
        })
    })

    describe('secret mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name: 'secret-name'
                },
                data: {
                    GRAPHQL_PATH: '/graphql',
                    GRAPHQL_PORT: "4002",
                    HELM_RELEASE_NAME: 'v1',
                    NAMESPACE: 'development',
                    NODE_ENV: 'development'
                }
            };
        });

        it('should correctly map to k8s client secret', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('Secret');
            expect(subject.kind).to.equal('Secret');
            expect(subject.apiVersion).to.equal('v1');
        })

        it('should correctly map data', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.data.GRAPHQL_PATH).to.equal('/graphql');
            expect(subject.data.GRAPHQL_PORT).to.equal('4002');
            expect(subject.data.HELM_RELEASE_NAME).to.equal('v1');
            expect(subject.data.NAMESPACE).to.equal('development');
            expect(subject.data.NODE_ENV).to.equal('development');
        })

    })

    describe('config map mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'v1',
                kind: 'ConfigMap',
                metadata: {
                    name: 'config-map-name'
                },
                data: {
                    GRAPHQL_PATH: '/graphql',
                    GRAPHQL_PORT: "4002",
                    HELM_RELEASE_NAME: 'v1',
                    NAMESPACE: 'development',
                    NODE_ENV: 'development'
                }
            };
        });

        it('should correctly map to k8s client config map', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('ConfigMap');
            expect(subject.kind).to.equal('ConfigMap');
            expect(subject.apiVersion).to.equal('v1');
        })

        it('should correctly map data', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.data.GRAPHQL_PATH).to.equal('/graphql');
            expect(subject.data.GRAPHQL_PORT).to.equal('4002');
            expect(subject.data.HELM_RELEASE_NAME).to.equal('v1');
            expect(subject.data.NAMESPACE).to.equal('development');
            expect(subject.data.NODE_ENV).to.equal('development');
        })

    })

    describe('metadata mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    annotations: {
                        'deployment.kubernetes.io/revision': 1,
                        'meta.helm.sh/release-name': 'v1',
                        'meta.helm.sh/release-namespace': 'development',
                    },
                    creationTimestamp: "2022-03-08T15:46:18Z",
                    generation: 1,
                    labels: {
                        app: 'application-label',
                        'app.kubernetes.io/managed-by': 'Helm'
                    },
                    name: 'application-deployment',
                    namespace: 'development',
                    ownerReferences: [{
                        apiVersion: 'cache.example.com/v1alpha1',
                        kind: 'Memcached',
                        name: 'example-memcached',
                        uid: 'ad834522-d9a5-4841-beac-991ff3798c00'
                    }]
                }
            };
        });

        it('should correctly map to k8s client metadata', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata.constructor.name).to.include('ObjectMeta');
        })

        it('should correctly map annotations', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata.annotations['deployment.kubernetes.io/revision']).to.equal(1);
            expect(subject.metadata.annotations['meta.helm.sh/release-name']).to.equal('v1');
            expect(subject.metadata.annotations['meta.helm.sh/release-namespace']).to.equal('development');
        })

        it('should correctly map dates', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata['creationTimestamp'].toISOString()).to.include('2022-03-08T15:46:18');
            expect(subject.metadata['creationTimestamp'].constructor.name).to.equal('Date');
        })

        it('should correctly map labels', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata.labels['app']).to.equal('application-label');
            expect(subject.metadata.labels['app.kubernetes.io/managed-by']).to.equal('Helm');
        })

        it('should correctly map name', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata.name).to.equal('application-deployment');
        })

        it('should correctly map namespace', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.metadata.namespace).to.equal('development');
        })

        it('should correctly map owner references', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.metadata.ownerReferences)).to.equal(true);
            expect(subject.metadata.ownerReferences[0].constructor.name).to.include('OwnerReference');
            expect(subject.metadata.ownerReferences[0].apiVersion).to.include('cache.example.com/v1alpha1');
            expect(subject.metadata.ownerReferences[0].kind).to.equal('Memcached');
            expect(subject.metadata.ownerReferences[0].name).to.equal('example-memcached');
            expect(subject.metadata.ownerReferences[0].uid).to.equal('ad834522-d9a5-4841-beac-991ff3798c00');
        })

    })

    describe('alpha role mapping', () => {

        let parsedYaml;
        beforeEach(() => {
            parsedYaml = {
                apiVersion: 'rbac.authorization.k8s.io/v1alpha1',
                kind: 'Role',
                metadata: {
                    name: 'alpha-role',
                    namespace: 'alpha'
                },
                rules: [{
                    apiGroups: [""],
                    resources: ["pods"],
                    verbs: ["get", "watch", "list"]
                }]
            };
        });

        it('should correctly map to k8s client role', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(subject.constructor.name).to.include('Role');
            expect(subject.apiVersion).to.equal('rbac.authorization.k8s.io/v1alpha1');
        })

        it('should correctly map rules', () => {
            const manifest = new K8sManifest(parsedYaml);

            const subject = manifest.k8sClientObject();

            expect(Array.isArray(subject.rules)).to.equal(true);
            expect(subject.rules[0].constructor.name).to.include('PolicyRule');
            expect(subject.rules[0].apiGroups[0]).to.equal(parsedYaml.rules[0].apiGroups[0]);
            expect(subject.rules[0].resources[0]).to.equal(parsedYaml.rules[0].resources[0]);
            expect(subject.rules[0].verbs[0]).to.equal(parsedYaml.rules[0].verbs[0]);
            expect(subject.rules[0].verbs[1]).to.equal(parsedYaml.rules[0].verbs[1]);
            expect(subject.rules[0].verbs[2]).to.equal(parsedYaml.rules[0].verbs[2]);
        })

    })

})
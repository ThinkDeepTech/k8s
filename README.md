# @thinkdeep/k8s
[![CircleCI](https://circleci.com/gh/ThinkDeepTech/k8s.svg?style=shield)](https://circleci.com/gh/ThinkDeepTech/k8s)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ThinkDeepTech_thinkdeep&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ThinkDeepTech_k8s)

Node client interfacing with a k8s cluster using simple functions and yaml template strings. If you're just interested in creating k8s javascript client objects using template strings, see [@thinkdeep/k8s-manifest](https://www.npmjs.com/package/@thinkdeep/k8s-manifest).

# Dependencies
- [Kubernetes javascript client](https://github.com/kubernetes-client/javascript) v0.15
- [Node v16.14.2 LTS](https://nodejs.org/en/)

# Installation
```console
    npm i @thinkdeep/k8s
```

# Usage

Assuming the role binding linking the necessary role and service account has the needed permissions:

```javascript

    import { K8sClient, KubeConfig, stringify } from '@thinkdeep/k8s';

    const config = new KubeConfig(); // KubeConfig exported directly from https://github.com/kubernetes-client/javascript

    config.loadFromCluster(); // Or whatever desired loading mechanism

    const client = await new K8sClient(config).init();

    // Set default namespace fallback to whatever you desire or use the default provided 'default'.
    client.defaultNamespace = 'development';

    const options = {
        name: 'dynamic-cron-job',
        namespace: 'production',
        schedule: '* * * * *',
        image: 'busybox',
        command: 'echo',
        args: ['Hello World']
    };

    // Assuming environment variables have been defined...
    const cronJob = await client.create(`
        apiVersion: "batch/v1"
        kind: "CronJob"
        metadata:
            name: "${options.name}"
            namespace: "${options.namespace || "default"}"
        spec:
            schedule: "${options.schedule}"
            jobTemplate:
                spec:
                    template:
                        spec:
                            containers:
                                - name: "${process.env.HELM_RELEASE_NAME}-data-collector"
                                  image: "${options.image}"
                                  command: ["${options.command}"]
                                  args: ${JSON.stringify(options.args)}
                                  envFrom:
                                  - secretRef:
                                      name: "${process.env.HELM_RELEASE_NAME}-deep-microservice-collection-secret"
                                  ${ process.env.PREDECOS_KAFKA_SECRET ? `
                                  - secretRef:
                                      name: "${process.env.PREDECOS_KAFKA_SECRET}"
                                  ` : ``}
                            serviceAccountName: "${process.env.HELM_RELEASE_NAME}-secret-accessor-service-account"
                            restartPolicy: "Never"
                            imagePullSecrets:
                                - name: "docker-secret"
    `);

    console.log(`Created cron job:\n${stringify(cronJob)}`);

    const microserviceDeployment = await client.get('deployment', 'my-deployment', 'production');
    if (!microserviceDeployment.status.readyReplicas) {
        await client.delete(cronJob);
        console.log(`Deleted cron job:\n${stringify(cronJob)}`);
    }

    const cronJobs = await client.getAll('cronjob', 'production');
    for (const cronJob of cronJobs) {
        console.log(`Found:\n${stringify(cronJob)}`);

        if (cronJob.metadata.name === 'some-name-thats-present') {
            cronJob.spec.schedule = '0 */12 * * *';
            await client.apply(cronJob);
        }
    }

```
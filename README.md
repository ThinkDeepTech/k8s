# k8s
Simple interface wrapping the kubernetes javascript client.

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

    import { K8sClient, stringify } from '@thinkdeep/k8s';

    const client = await new K8sClient().init();

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
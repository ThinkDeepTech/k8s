import k8s from '@kubernetes/client-node';
import k8sApi from './k8s-api.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import {k8sManifest, stringify} from './k8s-manifest.mjs';
import yaml from "yaml";

class K8sClient {

    constructor() {
        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromCluster();
    }

    async create (yamlString) {

        await k8sApi.init(this._kubeConfig);

        const parsedYaml = yaml.parse(yamlString);

        const manifest = k8sManifest(parsedYaml);

        await k8sApi.createAll([manifest]);

        console.log(`Created object:\n\n${stringify(manifest)}`);

        return new K8sObjectHandle(manifest);
    }

    async apply() {

    }

    async get(kind, name, namespace) {

        await k8sApi.init(this._kubeConfig);

        const handles = await this.getAll(kind, namespace);

        console.log(`Fetched handles:\n\n${JSON.stringify(handles)}`);

        let target = null;
        for (const handle of handles) {

            if (handle.manifest.metadata.name === name) {

                console.info(`Target resource found:\n\n${stringify(handle.manifest)}`);
                target = handle;
                break;
            }
        }

        return target;
    }

    async getAll(kind, namespace) {

        await k8sApi.init(this._kubeConfig);

        const resources = await k8sApi.listAll(kind, namespace);

        let targets = [];
        for (const resource of resources) {
            for (const item of resource.items) {
                // TODO: Is it necessary to have k8sManifest here?
                targets.push(new K8sObjectHandle(k8sManifest(item)));
            }
        }

        return targets;
    }

    async delete (k8sObjectHandle) {
        await k8sApi.init(this._kubeConfig);

        return k8sApi.deleteAll([k8sObjectHandle.manifest]);
    }
}

export { K8sClient };
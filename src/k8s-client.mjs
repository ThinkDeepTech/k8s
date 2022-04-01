import k8s from '@kubernetes/client-node';
import {K8sApi} from './k8s-api.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import {k8sManifest, stringify} from './k8s-manifest.mjs';
import yaml from "yaml";

class K8sClient {

    constructor() {
        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromCluster();
        this._api = new K8sApi(this._kubeConfig);
    }

    async create (yamlString) {

        await this._api.init(this._kubeConfig);

        const parsedYaml = yaml.parse(yamlString);

        const manifest = k8sManifest(parsedYaml);

        await this._api.createAll([manifest]);

        return new K8sObjectHandle(manifest);
    }

    async apply() {

    }

    async get(kind, name, namespace) {

        await this._api.init(this._kubeConfig);

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

        await this._api.init(this._kubeConfig);

        const resources = await this._api.listAll(kind, namespace);

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
        await this._api.init(this._kubeConfig);

        return this._api.deleteAll([k8sObjectHandle.manifest]);
    }
}

export { K8sClient };
import k8s from '@kubernetes/client-node';
import {K8sApi} from './k8s-api.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import {k8sManifest} from './k8s-manifest.mjs';
import yaml from "yaml";

class K8sClient {

    constructor() {
        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromCluster();
        this._api = new K8sApi();
    }

    async create (yamlString) {

        await this._api.init(this._kubeConfig);

        const parsedYaml = yaml.parse(yamlString);

        const manifest = k8sManifest(parsedYaml);

        await this._api.createAll([manifest]);

        return new K8sObjectHandle(manifest);
    }

    async applyAll(configurations) {

        await this._api.init(this._kubeConfig);

        return Promise.all(configurations.map((configuration) => this.apply(configuration)));
    }

    async apply(configuration) {

        await this._api.init(this._kubeConfig);

        if (typeof configuration === 'string') {
            configuration = await this.create(configuration);
        }

        await this._api.patchAll([configuration.manifest]);
    }

    async get(kind, name, namespace) {

        await this._api.init(this._kubeConfig);

        const manifest = await this._api.read(kind, name, namespace);

        return new K8sObjectHandle(manifest);
    }

    async getAll(kind, namespace) {

        await this._api.init(this._kubeConfig);

        const resources = await this._api.listAll(kind, namespace);

        let targets = [];
        for (const resource of resources) {
            for (const item of resource.items) {
                targets.push(new K8sObjectHandle(item));
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
import k8s from '@kubernetes/client-node';
import {K8sApi} from './k8s-api.mjs';
import {k8sManifest, stringify} from './k8s-manifest.mjs';
import yaml from "yaml";

class K8sClient {

    constructor() {
        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromCluster();
        this._api = new K8sApi();
    }

    async createAll(configurations) {

        await this._api.init(this._kubeConfig);

        const targets = [];
        for (const configuration of configurations) {
            targets.push(await this.create(configuration));
        }

        return targets;
    }

    async create (configuration) {

        await this._api.init(this._kubeConfig);

        const manifest = this._manifest(configuration);

        await this._api.createAll([manifest]);

        return manifest;
    }

    async applyAll(configurations) {

        await this._api.init(this._kubeConfig);

        const targets = [];
        for (const configuration of configurations) {
            targets.push(await this.apply(configuration));
        }

        return targets;
    }

    async apply(configuration) {

        await this._api.init(this._kubeConfig);

        const manifest = this._manifest(configuration);

        const alreadyExists = await this._api.exists(manifest.kind, manifest.metadata.name, manifest.metadata.namespace);
        if (!alreadyExists) {
            return this.create(configuration);
        }

        const modifiedManifests = await this._api.patchAll([manifest]);

        return modifiedManifests[0];
    }

    async get(kind, name, namespace) {

        await this._api.init(this._kubeConfig);

        return this._api.read(kind, name, namespace);
    }

    async getAll(kind, namespace) {

        await this._api.init(this._kubeConfig);

        const resources = await this._api.listAll(kind, namespace);

        let targets = [];
        for (const resource of resources) {
            for (const item of resource.items) {
                targets.push(item);
            }
        }

        return targets;
    }

    async delete (manifest) {

        await this._api.init(this._kubeConfig);

        return this._api.deleteAll([manifest]);
    }

    _parse(yamlString) {
        const parsedYaml = yaml.parse(yamlString);

        return k8sManifest(parsedYaml);
    }

    _manifest(configuration) {
        return (typeof configuration === 'string') ? this._parse(configuration) : configuration;
    }
}

export { K8sClient, stringify };
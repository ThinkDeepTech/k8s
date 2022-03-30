import {K8sApi} from './k8s-api.mjs';
import {manifest, stringify} from './manifest.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import { mapKindToApiVersion } from './map-kind-to-api-version.mjs';
import yaml from "yaml";

class K8sClient {

    async create (yamlString) {

        const parsedYaml = yaml.parse(yamlString);

        const manifest = manifest(parsedYaml);

        const api = new K8sApi(manifest.apiVersion);

        await api.create(manifest);

        return new K8sObjectHandle(api, manifest);
    }

    async edit() {
        // TODO
    }

    async get(kind, name, namespace) {

        const handles = await this.getAll(kind, namespace);

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

        const api = new K8sApi(mapKindToApiVersion(kind));

        const {response: { body } } = await api.listAll(kind, namespace);

        if (!body) {
            throw new Error(`The body returned from the k8s node client was invalid. Response body: ${JSON.stringify(body)}`);
        }

        const listManifest = manifest(body);

        let targets = [];
        for (const resource of listManifest.items) {
            targets.push(new K8sObjectHandle(api, manifest(resource)));
        }

        return targets;
    }

    async delete (k8sObjectHandle) {

        const api = k8sObjectHandle.api;

        const manifest = k8sObjectHandle.manifest;

        return api.delete(manifest);
    }
}

export { K8sClient };
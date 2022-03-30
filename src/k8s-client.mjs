import {K8sApi} from './k8s-api.mjs';
import {K8sManifest} from './manifest.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import { mapKindToApiVersion } from './map-kind-to-api-version.mjs';
import yaml from "yaml";

class K8sClient {

    async create (yamlString) {

        const parsedYaml = yaml.parse(yamlString);

        const manifest = new K8sManifest(parsedYaml);

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

                console.info(`Target resource found:\n\n${handle.manifest.toString()}`);
                target = handle;
                break;
            }
        }

        return target;
    }

    async getAll(kind, namespace) {

        const api = new K8sApi(mapKindToApiVersion(kind));

        const {response} = await api.listAll(kind, namespace);

        console.log(`Resource list in getAll:\n\n${JSON.stringify(response)}`);

        const body = response?.body;

        if (!body) {
            throw new Error(`The body returned from the k8s node client was invalid. Response body: ${JSON.stringify(body)}`);
        }

        const listManifest = new K8sManifest(body);

        const k8sObject = listManifest.k8sClientObject();

        console.log(`Received list manifest:\n\n${listManifest.toString()}`);

        let targets = [];
        for (const resource of k8sObject.items) {
            const manifest = new K8sManifest(resource);
            targets.push(new K8sObjectHandle(api, manifest));
        }

        return targets;
    }

    async delete (k8sObjectHandle) {

        const api = k8sObjectHandle.api;

        const manifest = k8sObjectHandle.manifest;

        console.log(`Deleting object with manifest:\n\n${manifest.toString()}`);

        return api.delete(manifest);
    }
}

export { K8sClient };
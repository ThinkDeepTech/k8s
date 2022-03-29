import { capitalizeFirstLetter } from './capitalize-first-letter.mjs';
import {K8sApi} from './k8s-api.mjs';
import {K8sManifest} from './k8s-manifest.mjs';
import {K8sObjectHandle} from './k8s-object-handle.mjs';
import yaml from "yaml";

const kindToApiVersionMap = {
    "Binding": "v1",
    "ComponentStatus": "v1",
    "ConfigMap": "v1",
    "Endpoints": "v1",
    "LimitRange": "v1",
    "Namespace": "v1",
    "Node": "v1",
    "PersistentVolume": "v1",
    "PersistentVolumeClaim": "v1",
    "Pod": "v1",
    "PodTemplate": "v1",
    "ReplicationController": "v1",
    "ResourceQuota": "v1",
    "Secret": "v1",
    "Service": "v1",
    "ServiceAccount": "v1",
    "ControllerRevision": "apps/v1",
    "DaemonSet": "apps/v1",
    "Deployment": "apps/v1",
    "ReplicaSet": "apps/v1",
    "StatefulSet": "apps/v1",
    "CronJob": "batch/v1",
    "Job": "batch/v1",
    "HorizontalPodAutoscaler": "autoscaling/v1",
    "PriorityClass": "scheduling.k8s.io/v1",
    "EndpointSlice": "discovery.k8s.io/v1",
    "Ingress": "networking.k8s.io/v1",
    "IngressClass": "networking.k8s.io/v1",
    "NetworkPolicy": "networking.k8s.io/v1",
    "CSIDriver": "storage.k8s.io/v1",
    "CSINode": "storage.k8s.io/v1",
    "CSIStorageCapacity": "storage.k8s.io/v1beta1",
    "StorageClass": "storage.k8s.io/v1",
    "VolumeAttachment": "storage.k8s.io/v1",
    "TokenRequest": "authentication.k8s.io/v1",
    "TokenReview": "authentication.k8s.io/v1",
    "CertificateSigningRequest": "certificates.k8s.io/v1",
    "LocalSubjectAccessReview": "authorization.k8s.io/v1",
    "SelfSubjectAccessReview": "authorization.k8s.io/v1",
    "SelfSubjectRulesReview": "authorization.k8s.io/v1",
    "SubjectAccessReview": "authorization.k8s.io/v1",
    "ClusterRole": "rbac.authorization.k8s.io/v1",
    "ClusterRoleBinding": "rbac.authorization.k8s.io/v1",
    "Role": "rbac.authorization.k8s.io/v1",
    "RoleBinding": "rbac.authorization.k8s.io/v1",
    "PodDisruptionBudget": "policy/v1",
    "PodSecurityPolicy": "policy/v1beta1",
    "CustomResourceDefinition": "apiextensions.k8s.io/v1",
    "MutatingWebhookConfiguration": "admissionregistration.k8s.io/v1",
    "ValidatingWebhookConfiguration": "admissionregistration.k8s.io/v1",
    "Event": "events.k8s.io/v1",
    "APIService": "apiregistration.k8s.io/v1",
    "Lease": "coordination.k8s.io/v1",
    "RuntimeClass": "node.k8s.io/v1",
    "FlowSchema": "flowcontrol.apiserver.k8s.io/v1beta1",
    "PriorityLevelConfiguration": "flowcontrol.apiserver.k8s.io/v1beta1",
};

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

        const apiVersion = this._apiVersion(kind);

        const api = new K8sApi(apiVersion);

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
            resource.apiVersion = apiVersion;
            resource.kind = capitalizeFirstLetter(kind);
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

    _apiVersion(kind) {

        const apiVersion = kindToApiVersionMap[capitalizeFirstLetter(kind)];

        if (!apiVersion) {
            throw new Error(`The kind ${kind} specified doesn't map to a known api version.`);
        }

        console.info(`Found api version ${apiVersion} for kind ${kind}`);

        return apiVersion;
    }
}

export { K8sClient };
import k8s from '@kubernetes/client-node';
import {capitalizeFirstLetter} from './capitalize-first-letter.mjs';
import { stringify } from './manifest.mjs';

const apiVersionToClientMap = {
    "admissionregistration.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AdmissionregistrationV1Api),
    "admissionregistration.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AdmissionregistrationV1beta1Api),
    "apiregistration.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.ApiregistrationV1Api),
    "apiregistration.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.ApiregistrationV1beta1Api),
    "apps/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AppsV1Api),
    "apiextensions.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.ApiextensionsV1Api),
    "apiextensions.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.ApiextensionsV1beta1Api),
    "authentication.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AuthenticationV1Api),
    "authentication.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AuthenticationV1beta1Api),
    "autoscaling/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AutoscalingV1Api),
    "autoscaling/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.AutoscalingV2beta1Api),
    "autoscaling/v1beta2": (kubeConfig) => kubeConfig.makeApiClient(k8s.AutoscalingV2beta2Api),
    "batch/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.BatchV1Api),
    "batch/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.BatchV1beta1Api),
    "certificates.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.CertificatesV1Api),
    "certificates.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.CertificatesV1beta1Api),
    "coordination.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.CoordinationV1Api),
    "coordination.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.CoordinationV1beta1Api),
    "discovery.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.DiscoveryV1Api),
    "extensions/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.ExtensionsV1beta1Api),
    "events.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.EventsV1Api),
    "events.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.EventsV1beta1Api),
    "flowcontrol.apiserver.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.FlowcontrolApiserverV1beta1Api),
    "networking.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.NetworkingV1Api),
    "node.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.NodeV1Api),
    "node.k8s.io/v1alpha1": (kubeConfig) => kubeConfig.makeApiClient(k8s.NodeV1alpha1Api),
    "node.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.NodeV1beta1Api),
    "policy/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.PolicyV1Api),
    "policy/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.PolicyV1beta1Api),
    "rbac.authorization.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api),
    "rbac.authorization.k8s.io/v1alpha1": (kubeConfig) => kubeConfig.makeApiClient(k8s.RbacAuthorizationV1alpha1Api),
    "rbac.authorization.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.RbacAuthorizationV1beta1Api),
    "scheduling.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.SchedulingV1Api),
    "scheduling.k8s.io/v1alpha1": (kubeConfig) => kubeConfig.makeApiClient(k8s.SchedulingV1alpha1Api),
    "scheduling.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.SchedulingV1beta1Api),
    "storage.k8s.io/v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.StorageV1Api),
    "storage.k8s.io/v1alpha1": (kubeConfig) => kubeConfig.makeApiClient(k8s.StorageV1alpha1Api),
    "storage.k8s.io/v1beta1": (kubeConfig) => kubeConfig.makeApiClient(k8s.StorageV1beta1Api),
    "v1": (kubeConfig) => kubeConfig.makeApiClient(k8s.CoreV1Api)
};

class K8sApi {
    constructor(apiVersion) {

        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromCluster();

        this._api = this._clientApi(apiVersion, apiVersionToClientMap);
    }

    async create(manifest) {
        console.log(`Creating k8s object:\n\n${stringify(manifest)}`);
        return this._creationStrategy(manifest)();
    }

    async listAll(kind, namespace) {
        console.log(`Listing all objects with kind ${kind}${ !!namespace ? ` in namespace ${namespace}`: ``}.`);
        return this._listAllStrategy(kind, namespace)();
    }

    async delete(manifest) {
        console.log(`Deleting k8s object:\n\n${stringify(manifest)}`);
        return this._deletionStrategy(manifest)();
    }

    _listAllStrategy(kind, namespace) {

        const capitalizedKind = capitalizeFirstLetter(kind);

        if (!namespace && this._api[`list${capitalizedKind}ForAllNamespaces`]) {

            return this._api[`list${capitalizedKind}ForAllNamespaces`].bind(this._api);
        } else if (this._api[`listNamespaced${capitalizedKind}`] && !!namespace) {

            return this._api[`listNamespaced${capitalizedKind}`].bind(this._api, namespace);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new Error(`
                The list all function for kind ${capitalizedKind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    _creationStrategy(manifest) {

        const kind = capitalizeFirstLetter(manifest.kind);
        if (this._api[`createNamespaced${kind}`]) {

            return this._api[`createNamespaced${kind}`].bind(this._api, manifest.metadata.namespace, manifest);
        } else if (this._api[`create${kind}`]) {

            return this._api[`create${kind}`].bind(this._api, manifest);
        } else {
            throw new Error(`
                The creation function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    _deletionStrategy(manifest) {

        const kind = capitalizeFirstLetter(manifest.kind);
        if (this._api[`deleteNamespaced${kind}`]) {

            return this._api[`deleteNamespaced${kind}`].bind(this._api, manifest.metadata.name, manifest.metadata.namespace);
        } else if (this._api[`delete${kind}`]) {

            return this._api[`delete${kind}`].bind(this._api, manifest.metadata.name);
        } else {
            throw new Error(`
                The deletion function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    _clientApi(apiVersion, apiVersionMap) {

        const constructApi = apiVersionMap[apiVersion];

        if (!constructApi) {
            throw new Error(`The k8s apiVersion not yet supported. Received: ${apiVersion}`);
        }

        return constructApi(this._kubeConfig);
    }
}

export { K8sApi };
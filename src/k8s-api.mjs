import k8s from '@kubernetes/client-node';
import { k8sKind } from './k8s-kind.mjs';
import { k8sManifest, stringify } from './k8s-manifest.mjs';

var apiVersionToApiClientConstructor = { };

const initApiVersionToApiClientConstructorMap = async (kubeConfig) => {

    const apiConstructor = (kubeConfig, api) => kubeConfig.makeApiClient(api);

    await forEachApiResourceList(kubeConfig, (resourceList) => {
        apiVersionToApiClientConstructor[resourceList.groupVersion.toLowerCase()] = apiConstructor.bind(kubeConfig, api);
    })

    console.log(`Api Map:\n\n${JSON.stringify(apiVersionToApiClientConstructor)}`);
}

var kindToApiClientConstructors = {};

const initKindToClientConstructorMap = async (kubeConfig) => {

    const apiConstructor = (kubeConfig, api) => kubeConfig.makeApiClient(api);
    await forEachApiResourceList(kubeConfig, (resourceList) => {
        for (const resource of resourceList.resources) {

            const resourceName = resource.name.toLowerCase();
            if (!kindToApiClientConstructors[resourceName]) {
                kindToApiClientConstructors[resourceName] = [];
            }

            kindToApiClientConstructors[resourceName].push(apiConstructor.bind(kubeConfig, api));
        }
    });

    console.log(`Kind Map:\n\n${JSON.stringify(kindToApiClientConstructors)}`);

};

const forEachApiResourceList = async (kubeConfig, callback) => {

    for (const api of k8s.APIS) {

        const apiClient = kubeConfig.makeApiClient(api);

        console.log(`Made API client\n\n${apiClient}`);
        const fetchResources = apiClient['getAPIResources'];

        console.log(`Fetch resources:\n\n${fetchResources}`);

        console.log(`Type of Fetch Resources:\n\n${typeof fetchResources}`);
        if (typeof fetchResources === 'function') {

            console.log(`Getting ready to fetch resources...`);

            const response = await fetchResources();

            console.log(`API Group response:\n\n${JSON.stringify(response)}`)

            const resourceList = response?.body;

            callback(k8sManifest(resourceList));
        }
    }
}

class K8sApi {

    constructor(kubeConfig) {
        this._kubeConfig = kubeConfig;
    }

    async init() {

        const dummy = new k8s.KubeConfig();

        dummy.loadFromCluster();

        const api = dummy.makeApiClient(k8s.EventsV1Api);

        api.getAPIResources().then((response) => {
            console.log(`Response in dummy:\n\n${JSON.stringify(response)}`);
        })

        if (Object.keys(apiVersionToApiClientConstructor).length === 0) {
            console.log(`Initializing api to client constructor map.`)
            await initApiVersionToApiClientConstructorMap(this._kubeConfig);
        }

        if (Object.keys(kindToApiClientConstructors).length === 0) {
            console.log(`Initializing kind to client constructors map.`)
            await initKindToClientConstructorMap(this._kubeConfig);
        }

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

    _listAllStrategy(prospectiveKind, namespace) {

        const kind = k8sKind(prospectiveKind.toLowerCase());
        const apis = this._clientApis(kind);
        const fetchAllData = async (listOperations) => listOperations.map((listOperation) => listOperation());

        let listOperations = [];
        for (const api of apis) {

            let listOperation = null;
            if (!namespace && api[`list${kind}ForAllNamespaces`]) {

                listOperation = api[`list${kind}ForAllNamespaces`].bind(api);
            } else if (api[`listNamespaced${kind}`] && !!namespace) {

                listOperation = api[`listNamespaced${kind}`].bind(api, namespace);
            } else {

                const namespaceText = namespace ? `and namespace ${namespace}` : ``;

                throw new Error(`
                    The list all function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
                `)
            }

            listOperations.push(listOperation);
        }

        return fetchAllData.bind(listOperations);
    }

    _creationStrategy(manifest) {

        const kind = k8sKind(manifest.kind.toLowerCase());
        const api = this._clientApi(manifest.apiVersion);
        if (api[`createNamespaced${kind}`]) {

            return api[`createNamespaced${kind}`].bind(api, manifest.metadata.namespace, manifest);
        } else if (api[`create${kind}`]) {

            return api[`create${kind}`].bind(api, manifest);
        } else {
            throw new Error(`
                The creation function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    _deletionStrategy(manifest) {

        const kind = k8sKind(manifest.kind.toLowerCase());
        const api = this._clientApi(manifest.apiVersion);
        if (api[`deleteNamespaced${kind}`]) {

            return api[`deleteNamespaced${kind}`].bind(api, manifest.metadata.name, manifest.metadata.namespace);
        } else if (api[`delete${kind}`]) {

            return api[`delete${kind}`].bind(api, manifest.metadata.name);
        } else {
            throw new Error(`
                The deletion function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    _clientApis(kind) {

        const constructApis = (kubeConfig) => kindToApiClients[kind.toLowerCase()].map((constructApi) => constructApi(kubeConfig));

        if (!constructApi) {
            throw new Error(`The k8s apiVersion not yet supported. Received: ${apiVersion}`);
        }

        return constructApis(this._kubeConfig);
    }

    _clientApi(apiVersion) {

        const constructApi = apiVersionToApiClientConstructor[apiVersion.toLowerCase()];

        if (!constructApi) {
            throw new Error(`The k8s apiVersion not yet supported. Received: ${apiVersion}`);
        }

        return constructApi(this._kubeConfig);
    }
}

export { K8sApi };
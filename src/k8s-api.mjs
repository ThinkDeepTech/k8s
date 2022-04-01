import k8s from '@kubernetes/client-node';
import { k8sKind } from './k8s-kind.mjs';
import { k8sManifest } from './k8s-manifest.mjs';

class K8sApi {

    constructor(kubeConfig) {
        this._apiVersionToApiClient = { };
        this._kindToApiClients = {};
        this._kindToGroupVersion = {};
        this._groupVersionToPreferredVersion = {};

        this.init(kubeConfig);
    }

    async init(kubeConfig) {
        if (!this.initialized()) {
            console.log(`Initializing kind maps.`)
            await this._initKindMaps(kubeConfig);

            console.log(`Initializing api version to client map.`)
            await this._initApiVersionToApiClientMap(kubeConfig);
        }
    };

    initialized() {
        return (Object.keys(this._apiVersionToApiClient).length > 0) && (Object.keys(this._kindToApiClients).length > 0)
            && (Object.keys(this._kindToGroupVersion).length > 0) && (Object.keys(this._groupVersionToPreferredVersion).length > 0);
    }

    async _initApiVersionToApiClientMap(kubeConfig) {

        await this._forEachApiResourceList(kubeConfig, (apiClient, resourceList) => {
            this._apiVersionToApiClient[resourceList.groupVersion.toLowerCase()] = apiClient;
        })
    }

    async _initKindMaps(kubeConfig) {

        return Promise.all([
            this._forEachApiResourceList(kubeConfig, (apiClient, resourceList) => {

                for (const resource of resourceList.resources) {

                    const resourceName = resource.name.toLowerCase();
                    if (!this._kindToApiClients[resourceName]) {
                        this._kindToApiClients[resourceName] = [];
                    }

                    this._kindToApiClients[resourceName].push(apiClient);

                    this._kindToGroupVersion[resourceName] = resourceList.groupVersion;
                }
            }),
            this._forEachApiGroup(kubeConfig, (apiClient, apiGroup) => {
                for (const entry of apiGroup.versions) {
                    this._groupVersionToPreferredVersion[entry.groupVersion] = apiGroup.preferredVersion.groupVersion;
                }
            })
        ]);
    };

    _clientApis(kind) {
        return this._kindToApiClients[kind.toLowerCase()] || [];
    }

    _clientApi(apiVersion) {
        return this._apiVersionToApiClient[apiVersion.toLowerCase()] || null;
    }

    async _forEachApiGroup(kubeConfig, callback) {
        await this._forEachApi(kubeConfig, 'getAPIGroup', callback);
    }

    async _forEachApiResourceList(kubeConfig, callback) {
        await this._forEachApi(kubeConfig, 'getAPIResources', callback);
    }

    async _forEachApi(kubeConfig, resourceFunctionName, callback) {
        for (const api of k8s.APIS) {

            const apiClient = kubeConfig.makeApiClient(api);

            const fetchResources = apiClient[resourceFunctionName];

            if (typeof fetchResources === 'function') {

                try {
                    const {response: {body}} = await fetchResources.bind(apiClient)();

                    callback(apiClient, k8sManifest(body));
                } catch (e) {

                    const {response: {statusCode}} = e;
                    if (statusCode !== 404) {
                        throw e;
                    }
                }
            }
        }
    }

    static preferredVersion(kind) {

        const kindGroup = this._kindToGroupVersion[kind.toLowerCase()];

        if (!kindGroup) {
            throw new Error(`The kind ${kind} didn't have a registered group version.`);
        }

        const targetVersion = this._groupVersionToPreferredVersion[kindGroup];

        if (!targetVersion) {
            throw new Error(`The kind ${kind} didn't have a registered preferred version. Received: ${version}`);
        }

        return targetVersion;
    }

    async createAll(manifests) {
        return Promise.all(manifests.map(async(manifest) => {
            try {
                await this._creationStrategy(manifest)();
            } catch (e) {

                const {response: {statusCode}} = e;
                if (statusCode !== 409) {
                    throw e;
                }
            }
        }));
    }

    async deleteAll(manifests) {
        return Promise.all(manifests.map(async (manifest) => await this._deletionStrategy(manifest)()));
    }

    async listAll(kind, namespace) {
        console.log(`Listing all objects with kind ${kind}${ !!namespace ? ` in namespace ${namespace}`: ``}.`);
        const responses = await this._listAllStrategy(kind, namespace)();

        console.log(`List all response:\n\n${JSON.stringify(responses)}`);

        return Promise.all(responses.map((data) => {

            const {response: {body}} = data;

            if (!body) {
                throw new Error(`The API response didn't include a valid body. Received: ${body}`);
            }

            console.log(`In List all.\n\nReceived body:\n\n${JSON.stringify(body)}`);

            if (!body.apiVersion) {
                body.apiVersion = K8sApi.preferredVersion(body.kind);
                console.log(`Set api version to ${body.apiVersion} for object ${body.kind}`);
            }

            return k8sManifest(body);
        }));
    }

    _listAllStrategy(prospectiveKind, namespace) {

        const kind = k8sKind(prospectiveKind.toLowerCase());
        const apis = this._clientApis(kind);

        console.log(`Client APIs returned:\n\n${JSON.stringify(apis)}`);
        const fetchAllData = async (listOperations) => Promise.all(listOperations.map(async (listOperation) =>  {
            console.log(`Running listing operation.\n\n`)
            const result = await listOperation();

            console.log(`Result of list:\n\n${JSON.stringify(result)}`);

            return result;
        }));

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

        console.log(`Fetching api strategy for api ${manifest.apiVersion}`);
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
};



export { K8sApi };
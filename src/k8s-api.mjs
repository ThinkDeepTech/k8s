import k8s from '@kubernetes/client-node';
import { k8sKind } from './k8s-kind.mjs';
import { k8sManifest } from './k8s-manifest.mjs';

class K8sApi {

    constructor() {
        this._apiVersionToApiClient = { };
        this._kindToApiClients = {};
        this._kindToGroupVersion = {};
        this._groupVersionToPreferredVersion = {};
    }

    async init(kubeConfig) {
        if (!this.initialized()) {
            await Promise.all([
                this._initKindMaps(kubeConfig),
                this._initApiVersionToApiClientMap(kubeConfig)
            ]);
            console.log(`Initialized the k8s api.`);
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

                    const resourceKind = resource.kind.toLowerCase();
                    if (!this._kindToApiClients[resourceKind]) {
                        this._kindToApiClients[resourceKind] = [];
                    }

                    this._kindToApiClients[resourceKind].push(apiClient);

                    this._kindToGroupVersion[resourceKind] = resourceList.groupVersion;
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

    preferredVersion(kind) {

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

    createAll(manifests) {
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

    async read(kind, name, namespace) {
        const results = await this._readStrategy(kind, name, namespace)();

        if (results.length === 0) {
            throw new Error(`The resource of kind ${kind} with name ${name}${ !!namespace ? ` in namespace ${namespace}` : ``} wasn't found.`);
        }

        return results.map((received) => k8sManifest(received.response.body))[0];
    }

    _readStrategy(prospectiveKind, name, namespace) {
        const kind = k8sKind(prospectiveKind.toLowerCase());

        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._readKindThroughApiStrategy(api, kind, name, namespace));
        }

        const fetchKindFromAllRelevantApis = async (strategies) => (await Promise.all(strategies.map(async (strategy) =>  {
            try {
                return await strategy();
            } catch (e) {
                const {response: {statusCode}} = e;

                if (statusCode !== 404) {
                    throw e;
                }

                return null;
            }
        }))).filter((value) => !!value);

        return fetchKindFromAllRelevantApis.bind(null, strategies);
    }

    _readKindThroughApiStrategy(api, kind, name, namespace) {

        if (api[`read${kind}`]) {

            return api[`read${kind}`].bind(api, name);
        } else if (!!namespace && api[`readNamespaced${kind}`]) {

            return api[`readNamespaced${kind}`].bind(api, name, namespace);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new Error(`
                The read function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    patchAll(manifests) {
        return Promise.all(manifests.map(async(manifest) => {
                const responses = await this._patchStrategy(manifest)();
                return responses.map((received) => k8sManifest(received.response.body));
        }));
    }

    _patchStrategy(manifest) {

        const kind = k8sKind(manifest.constructor.name.toLowerCase());

        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._patchKindThroughApiStrategy(api, kind, manifest));
        }

        const sendPatchToAllKindApis = async (strategies) => (await Promise.all(strategies.map(async (strategy) =>  {
            try {

                return await strategy();
            } catch (e) {
                const {response: {statusCode}} = e;

                if (statusCode !== 404) {
                    throw e;
                }

                return null;
            }
        }))).filter((value) => !!value);

        return sendPatchToAllKindApis.bind(null, strategies);
    }

    _patchKindThroughApiStrategy(api, kind, manifest) {
        if (api[`patchNamespaced${kind}`]) {

            return api[`patchNamespaced${kind}`].bind(api, manifest.metadata.name, manifest.metadata.namespace, manifest);
        } else if (api[`patch${kind}`]) {

            return api[`patch${kind}`].bind(api, manifest.metadata.name, manifest);
        } else {
            throw new Error(`
                The patch function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    async listAll(kind, namespace) {
        console.log(`Listing all objects with kind ${kind}${ !!namespace ? ` in namespace ${namespace}`: ``}.`);
        const responses = await this._listStrategy(kind, namespace)();

        return Promise.all(responses.map((data) => {

            const {response: {body}} = data;

            if (!body) {
                throw new Error(`The API response didn't include a valid body. Received: ${body}`);
            }

            return k8sManifest(body);
        }));
    }

    _listStrategy(prospectiveKind, namespace) {

        const kind = k8sKind(prospectiveKind.toLowerCase());
        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._listKindThroughApiStrategy(api, kind, namespace));
        }

        const gatherAllKindLists = (strategies) => Promise.all(strategies.map((strategy) =>  strategy()));

        return gatherAllKindLists.bind(null, strategies);
    }

    _listKindThroughApiStrategy(api, kind, namespace) {
        if (!namespace && api[`list${kind}ForAllNamespaces`]) {

            return api[`list${kind}ForAllNamespaces`].bind(api);
        } else if (!!namespace && api[`listNamespaced${kind}`]) {

            return api[`listNamespaced${kind}`].bind(api, namespace);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new Error(`
                The list function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }



    deleteAll(manifests) {
        return Promise.all(manifests.map(async (manifest) => await this._deletionStrategy(manifest)()));
    }

    _deletionStrategy(manifest) {

        const kind = k8sKind(manifest.constructor.name.toLowerCase());
        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._deleteKindThroughApiStrategy(api, kind, manifest));
        }

        const sendDeleteToAllKindApis = (strategies) => Promise.all(strategies.map(async (strategy) =>  {
            try {
                await strategy();
            } catch(e) {
                const {response: {statusCode}} = e;

                if (statusCode !== 404) {
                    throw e;
                }
            }
        }));

        return sendDeleteToAllKindApis.bind(null, strategies);
    }

    _deleteKindThroughApiStrategy(api, kind, manifest) {
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
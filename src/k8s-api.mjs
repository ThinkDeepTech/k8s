import k8s from '@kubernetes/client-node';
import {ErrorNotFound} from './error/error-not-found.mjs'
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

        await this._forEachApiResourceList(kubeConfig, (apiClient, resourceList) => {

            for (const resource of resourceList.resources) {

                const resourceKind = resource.kind.toLowerCase();
                if (!this._kindToApiClients[resourceKind]) {
                    this._kindToApiClients[resourceKind] = [];
                }

                this._kindToApiClients[resourceKind].push(apiClient);

                this._kindToGroupVersion[resourceKind] = resourceList.groupVersion;
            }
        });
        await this._forEachApiGroup(kubeConfig, (_, apiGroup) => {
            for (const entry of apiGroup.versions) {
                this._groupVersionToPreferredVersion[entry.groupVersion] = apiGroup.preferredVersion.groupVersion;
            }
        });
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

    async exists(kind, name, namespace) {
        try {
            await this.read(kind, name, namespace);
            return true;
        } catch (e) {
            if (e.constructor.name !== 'ErrorNotFound') {
                throw e;
            }
            return false;
        }
    }

    async createAll(manifests) {
        return (await Promise.all(manifests.map(async(manifest) => {
            try {

                const received = await this._creationStrategy(manifest)();

                return this._configuredManifest(received.response.body);
            } catch (e) {

                const {response: {statusCode}} = e;
                if (statusCode !== 409) {
                    throw e;
                }

                return null;
            }
        }))).filter((val) => !!val);
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

    async read(kind, name, namespace) {
        const results = await this._readStrategy(kind, name, namespace)();

        if (results.length === 0) {
            const namespaceMessage = !!namespace ? ` in namespace ${namespace}` : ``;
            throw new ErrorNotFound(`The resource of kind ${kind} with name ${name}${namespaceMessage} wasn't found.`);
        }

        return results.map((received) => this._configuredManifest(received.response.body))[0];
    }

    _readStrategy(prospectiveKind, name, namespace) {
        const kind = k8sKind(prospectiveKind.toLowerCase());

        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._readKindThroughApiStrategy(api, kind, name, namespace));
        }

        return this._handleStrategyExecution.bind(this, strategies);
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

                if (responses.length === 0) {
                    const namespaceMessage = !!manifest.metadata.namespace ?  `in namespace ${manifest.metadata.namespace}` : '';
                    throw new ErrorNotFound(`The resource ${manifest.metadata.name} of kind ${manifest.kind} ${namespaceMessage} wasn't found and, therefore, can't be updated.`);
                }

                const received = responses[0];

                return this._configuredManifest(received.response.body);
        }));
    }

    _patchStrategy(manifest) {

        const kind = k8sKind(manifest.kind.toLowerCase());

        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._patchKindThroughApiStrategy(api, kind, manifest));
        }

        return this._handleStrategyExecution.bind(this, strategies);
    }

    _patchKindThroughApiStrategy(api, kind, manifest) {

        const pretty = undefined;

        const dryRun = undefined;

        const fieldManager = undefined;

        const force = undefined;

        const options = {
            headers: {
                'Content-type': 'application/merge-patch+json'
            }
        };

        if (api[`patchNamespaced${kind}`]) {

            return api[`patchNamespaced${kind}`].bind(
                api, manifest.metadata.name, manifest.metadata.namespace, manifest,
                pretty, dryRun, fieldManager, force, options
                );
        } else if (api[`patch${kind}`]) {

            return api[`patch${kind}`].bind(
                api, manifest.metadata.name, manifest,
                pretty, dryRun, fieldManager, force, options);
        } else {
            throw new Error(`
                The patch function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    async listAll(kind, namespace) {

        const responses = await this._listStrategy(kind, namespace)();

        return Promise.all(responses.map((data) => {

            const {response: {body}} = data;

            if (!body) {
                throw new Error(`The API response didn't include a valid body. Received: ${body}`);
            }

            const listManifest = k8sManifest(body);

            for (let i = 0; i < listManifest.items.length; i++) {
                listManifest.items[i].apiVersion = listManifest.apiVersion;

                const itemTypeName = listManifest.items[i].constructor.name || '';
                listManifest.items[i].kind = k8sKind(itemTypeName.toLowerCase());
            }

            return listManifest;
        }));
    }

    _listStrategy(prospectiveKind, namespace) {

        const kind = k8sKind(prospectiveKind.toLowerCase());
        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._listKindThroughApiStrategy(api, kind, namespace));
        }

        const gatherAllKindLists = (stgs) => Promise.all(stgs.map((strategy) =>  strategy()));

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
        return Promise.all(manifests.map((manifest) => this._deletionStrategy(manifest)()));
    }

    _deletionStrategy(manifest) {

        if (!manifest) {
            throw new Error(`The manifest value is invalid: ${manifest}`);
        }

        if (!manifest.kind) {
            throw new Error(`The manifest requires a kind.`);
        }

        if (!manifest.apiVersion) {
            throw new Error(`The manifest requires an api version.`);
        }

        const kind = k8sKind(manifest.kind.toLowerCase());
        const api = this._clientApi(manifest.apiVersion);
        return this._handleStrategyExecution.bind(this, [this._deleteKindThroughApiStrategy(api, kind, manifest)]);
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

    async _handleStrategyExecution(strategies) {
        return (await Promise.all(strategies.map(async (strategy) =>  {
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
    }

    _configuredManifest(configuration) {

        const manifest = k8sManifest(configuration);

        if (!manifest.kind) {
            manifest.kind = k8sKind(manifest.constructor.name);
        }

        return manifest;
    }
};



export { K8sApi };
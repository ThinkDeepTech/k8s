import k8s from '@kubernetes/client-node';
import { k8sManifest, stringify } from '@thinkdeep/k8s-manifest';
import {ErrorNotFound} from './error/error-not-found.mjs'
import { normalizeKind } from './normalize-kind.mjs';

const DEFAULT_NAMESPACE = 'default';

class K8sApi {

    constructor() {
        this._apiVersionToApiClient = {};
        this._kindToApiClients = {};
        this._kindToGroupVersion = {};
        this._groupVersionToPreferredVersion = {};
    }

    /**
     * Initialize the api maps.
     *
     * @param {Object} kubeConfig K8s javascript client KubeConfig object.
     * @param {Array<any>} [apis = k8s.APIS] The k8s API objects to use. This is intended for testing.
     */
    async init(kubeConfig, apis = k8s.APIS) {
        if (!this.initialized()) {
            await this._initClientMappings(kubeConfig, apis);
            console.log(`Initialized the k8s api.`);
        }
    };

    /**
     * Determine if the api has been initialized.
     *
     * @returns True if initialized. False otherwise.
     */
    initialized() {
        return (Object.keys(this._apiVersionToApiClient).length > 0) && (Object.keys(this._kindToApiClients).length > 0)
            && (Object.keys(this._kindToGroupVersion).length > 0) && (Object.keys(this._groupVersionToPreferredVersion).length > 0);
    }


    _applyPreferredVersionToGroupMap(_, apiGroup) {

        for (const entry of apiGroup.versions) {

            /**
             * Initialize group version to preferred api version.
             */
            this._groupVersionToPreferredVersion[entry.groupVersion.toLowerCase()] = apiGroup.preferredVersion.groupVersion;
        }
    }

    _applyResourceListValuesToMaps(apiClient, resourceList) {
        /**
         * Initialize apiVersion-specific client mappings.
         */
        this._apiVersionToApiClient[resourceList.groupVersion.toLowerCase()] = apiClient;

        for (const resource of resourceList.resources) {

            const resourceKind = normalizeKind(resource.kind).toLowerCase();
            if (!this._kindToApiClients[resourceKind]) {
                this._kindToApiClients[resourceKind] = [];
            }

            /**
             * Initialize broadcast capability based on kind.
             */
            this._kindToApiClients[resourceKind].push(apiClient);


            if (!this._kindToGroupVersion[resourceKind]) {
                this._kindToGroupVersion[resourceKind] = new Set();
            }

            /**
             * Enable mapping of kind to group version for preferred version determination.
             */
            this._kindToGroupVersion[resourceKind].add(resourceList.groupVersion);

            /**
             * Some API groups aren't listed so the initial preferred version will be equivalent to
             * the current group version.
             */
            this._groupVersionToPreferredVersion[resourceList.groupVersion.toLowerCase()] = resourceList.groupVersion;
        }

    }

    async _initClientMappings(kubeConfig, apis = k8s.APIS) {

        /**
         * The ordering of the following functions is important due to group to preferred version mapping.
         * Some api groups may not return (i.e, v1). The first function initializes the preferred group
         * version to its current group version and the second overwrites that with the actual registered
         * preferred version returned by the API. Therefore, the order should be:
         *
         * resource list processing -> api group processing.
         */
        await this._forEachApiResourceList(kubeConfig, this._applyResourceListValuesToMaps.bind(this), apis);

        await this._forEachApiGroup(kubeConfig, this._applyPreferredVersionToGroupMap.bind(this), apis);
    };

    async _forEachApiGroup(kubeConfig, callback, apis = k8s.APIS) {
        await this._forEachApi(kubeConfig, 'getAPIGroup', callback, apis);
    }

    async _forEachApiResourceList(kubeConfig, callback, apis = k8s.APIS) {
        await this._forEachApi(kubeConfig, 'getAPIResources', callback, apis);
    }

    async _forEachApi(kubeConfig, resourceFunctionName, callback, apis) {

        if (!(kubeConfig instanceof k8s.KubeConfig)) {
            throw new Error(`Supplied k8s kube configuration was invalid.`);
        }

        if (!Array.isArray(apis)) {
            throw new Error(`Supplied APIs must be an array.`);
        }

        for (const api of apis) {

            const apiClient = kubeConfig.makeApiClient(api);

            if (!(resourceFunctionName in apiClient)) {

                /**
                 * These cases should be ignored because the k8s javascript client APIs don't
                 * all include the same functions. Therefore, when iterating over all the APIs,
                 * it's necessary to take that into account.
                 */
                continue;
            }

            const fetchResources = apiClient[resourceFunctionName];

            if (typeof fetchResources !== 'function') {
                throw new Error(`The resource function provided was not a function: ${resourceFunctionName}`);
            }

            try {
                const {response: {body}} = await fetchResources.bind(apiClient)();

                callback(apiClient, k8sManifest(body));
            } catch (e) {

                if (!e?.response?.statusCode || e?.response?.statusCode !== 404) {
                    throw e;
                }
            }
        }
    }

    _groupVersions(kind) {

        const groupVersions = this._kindToGroupVersion[normalizeKind(kind).toLowerCase()] || new Set();

        if (groupVersions.size <= 0) {
            throw new ErrorNotFound(`The kind ${kind} didn't have any registered group versions. Are you sure you're using an accepted kind?`);
        }

        return groupVersions;
    }

    _clientApis(kind) {
        return this._kindToApiClients[normalizeKind(kind).toLowerCase()] || [];
    }

    _clientApi(apiVersion) {

        const client = this._apiVersionToApiClient[apiVersion.toLowerCase()] || null;

        if (!client) {
            throw new ErrorNotFound(`The specified api version ${apiVersion} was not recognized. Are you sure you're using one accepted by k8s?`);
        }

        return client;
    }

    _preferredVersions(groupVersions) {

        /**
         * A given kind can be part of multiple groups. Therefore, there are multiple preferred versions.
         */
        let preferredVersions = [];
        for (const groupVersion of groupVersions) {
            const registeredPreferredVersion = this._groupVersionToPreferredVersion[groupVersion.toLowerCase()] || '';
            preferredVersions.push(registeredPreferredVersion);
        }
        return new Set(preferredVersions.filter((val) => !!val));
    }

    _registeredKind(kind) {
        return kind.toLowerCase() in this._kindToGroupVersion;
    }

    /**
     * Get the preferred api versions for the specified kind.
     *
     * NOTE: One kind can be part of multiple groups. Therefore, multiple preferred versions can exist.
     *
     * @param {String} kind K8s Kind.
     * @returns Preferred api versions.
     */
    preferredVersions(kind) {

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const kindGroups = this._groupVersions(kind);

        const targetVersions = this._preferredVersions(kindGroups);

        if (targetVersions.size <= 0) {
            throw new ErrorNotFound(`The kind ${kind} didn't have registered preferred versions. Are you sure you're using an accepted kind?`);
        }

        return targetVersions;
    }

    /**
     *  Create all objects on the cluster.
     *
     * @param {Array<any>} manifests K8s javascript client objects.
     * @returns K8s client objects or [] if the objects already exist.
     */
    async createAll(manifests) {

        let targets = [];
        for (const manifest of manifests) {
            try {

                const strategy = this._creationStrategy(manifest);

                const received = await strategy();

                targets.push( this._configuredManifest( k8sManifest(received.response.body)) );
            } catch (e) {

                if (!e?.response?.statusCode || e?.response?.statusCode !== 409) {
                    throw e;
                }
            }
        }

        return targets;
    }

    _creationStrategy(manifest) {

        const kind = normalizeKind(manifest.kind);

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const api = this._clientApi(manifest.apiVersion);
        if (api[`create${kind}`]) {

            return api[`create${kind}`].bind(api, manifest);
        } else if (api[`createNamespaced${kind}`]) {

            return api[`createNamespaced${kind}`].bind(api, manifest.metadata.namespace || DEFAULT_NAMESPACE, manifest);
        } else {

            throw new Error(`
                The creation function for kind ${kind} wasn't found. This may be because it has an incorrect api version or that it hasn't yet been implemented yet. Please double-check the api version you used in the manifest and if the issue persists submit an issue on the github repo.
            `)
        }
    }

    /**
     * Determine if the specified object exists on the cluster.
     *
     * @param {String} kind K8s kind.
     * @param {String} name K8s object metadata name.
     * @param {String} namespace K8s namespace.
     *
     * @returns True if the object exists on the cluster. False otherwise.
     */
    async exists(kind, name, namespace) {

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        try {
            await this.read( normalizeKind(kind), name, namespace );
            return true;
        } catch (e) {
            if (e.constructor.name !== 'ErrorNotFound') {
                throw e;
            }
            return false;
        }
    }

    /**
     * Read an object from the cluster.
     *
     * NOTE: If the object doesn't exist on the cluster a ErrorNotFound exception will be thrown.
     *
     * @param {String} kind K8s kind.
     * @param {String} name Name of the object as seen in the metadata.name field.
     * @param {String} [namespace = DEFAULT_NAMESPACE] Namespace of the object as seen in the metadata.namespace field.
     *
     * @returns A kubernetes javascript client representation of the object on the cluster.
     */
    async read(kind, name, namespace = DEFAULT_NAMESPACE) {

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const results = await this._broadcastReadStrategy( normalizeKind(kind), name, namespace )();

        if (results.length <= 0) {
            const namespaceMessage = !!namespace ? `in namespace ${namespace}` : ``;
            throw new ErrorNotFound(`The resource of kind ${kind} with name ${name} ${namespaceMessage} wasn't found.`);
        }

        return results.map((received) => this._configuredManifest( k8sManifest(received.response.body)))[0];
    }

    /**
     * Get the k8s javascript client strategy for reading cluster objects.
     *
     * @param {String} kind K8s kind.
     * @param {String} name Name of the object as seen in the metadata.name field.
     * @param {String} [namespace = DEFAULT_NAMESPACE] Namespace of the object as seen in the metadata.namespace field.
     * @returns Read function broadcasting to all kind apis.
     */
    _broadcastReadStrategy(kind, name, namespace = DEFAULT_NAMESPACE) {

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const apis = this._clientApis(_kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._readClusterObjectStrategy(api, _kind, name, namespace));
        }

        return this._handleStrategyExecution.bind(this, strategies);
    }

    /**
     * Get the read function from the k8s javascript client API.
     *
     * @param {any} api K8s javascript client API with the needed function.
     * @param {String} kind K8s kind.
     * @param {String} name Name of the object as seen in the metadata.name field.
     * @param {String} [namespace = DEFAULT_NAMESPACE] Namespace of the object as seen in the metadata.namespace field.
     * @returns Function to use to read the specified cluster object.
     */
    _readClusterObjectStrategy(api, kind, name, namespace = DEFAULT_NAMESPACE) {

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        if(!api) {
            throw new Error(`Api needs to be defined.`);
        }

        if (api[`read${_kind}`]) {

            return api[`read${_kind}`].bind(api, name);
        } else if (api[`readNamespaced${_kind}`]) {

            return api[`readNamespaced${_kind}`].bind(api, name, namespace);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new ErrorNotFound(`
                The read function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    /**
     * Update the cluster objects with the specified manifests.
     *
     * @param {Array<any>} manifests K8s javascript client objects.
     * @returns K8s client objects.
     */
    patchAll(manifests) {
        return Promise.all(manifests.map(async(manifest) => {

                const responses = await this._broadcastPatchStrategy(manifest)();

                if (responses.length === 0) {
                    const namespaceMessage = !!manifest.metadata.namespace ?  `in namespace ${manifest.metadata.namespace}` : '';
                    throw new ErrorNotFound(`The resource ${manifest.metadata.name} of kind ${manifest.kind} ${namespaceMessage} wasn't found and, therefore, can't be updated.`);
                }

                const received = responses[0];

                return this._configuredManifest( k8sManifest(received.response.body) );
        }));
    }

    _broadcastPatchStrategy(manifest) {

        const kind = normalizeKind(manifest.kind);

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._patchClusterObjectStrategy(api, kind, manifest));
        }

        return this._handleStrategyExecution.bind(this, strategies);
    }

    _patchClusterObjectStrategy(api, kind, manifest) {

        const pretty = undefined;

        const dryRun = undefined;

        const fieldManager = undefined;

        const force = undefined;

        const options = {
            headers: {
                'Content-type': 'application/merge-patch+json'
            }
        };

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        if (api[`patchNamespaced${_kind}`]) {

            return api[`patchNamespaced${_kind}`].bind(
                api, manifest.metadata.name, manifest.metadata.namespace, manifest,
                pretty, dryRun, fieldManager, force, options
                );
        } else if (api[`patch${_kind}`]) {

            return api[`patch${_kind}`].bind(
                api, manifest.metadata.name, manifest,
                pretty, dryRun, fieldManager, force, options);
        } else {
            throw new Error(`
                The patch function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }

    /**
     * List all cluster objects.
     *
     * @param {String} kind The k8s kind (i.e, CronJob).
     * @param {String} namespace The namespace of the object as seen in the k8s metadata namespace field.
     * @returns Array of kind list objects (i.e, CronJobList).
     */
    async listAll(kind, namespace) {

        if (!this._registeredKind(kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const responses = await this._broadcastListStrategy(kind, namespace)();

        return Promise.all(responses.map((data) => {

            const {response: {body}} = data;

            if (!body) {
                throw new Error(`The API response didn't include a valid body. Received: ${body}`);
            }

            const kindList = k8sManifest(body);

            console.log(`Listed manifest:\n\n${stringify(kindList)}`);

            for (let i = 0; i < kindList.items.length; i++) {
                kindList.items[i].apiVersion = kindList.apiVersion;
                kindList.items[i].kind = normalizeKind(kindList.items[i]?.constructor?.name || '');
            }

            return kindList;
        }));
    }

    _broadcastListStrategy(kind, namespace) {

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        const apis = this._clientApis(_kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._listClusterObjectsStrategy(api, _kind, namespace));
        }

        return this._handleStrategyExecution.bind(this, strategies)
    }

    _listClusterObjectsStrategy(api, kind, namespace) {

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        if (api[`list${kind}`]) {

            return api[`list${kind}`].bind(api);
        } else if (!!namespace && api[`listNamespaced${_kind}`]) {

            return api[`listNamespaced${_kind}`].bind(api, namespace);
        } else if (!namespace && api[`list${_kind}ForAllNamespaces`]) {

            return api[`list${_kind}ForAllNamespaces`].bind(api);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new Error(`
                The list function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `)
        }
    }


    /**
     * Delete all the specified objects on the cluster.
     *
     * @param {Array<any>} manifests K8s javascript client objects.
     */
    deleteAll(manifests) {
        return Promise.all(manifests.map((manifest) => this._deletionStrategy(manifest)()));
    }

    _deletionStrategy(manifest) {

        if (!manifest) {
            throw new Error(`The manifest value wasn't defined.`);
        }

        if (!this._registeredKind(manifest.kind)) {
            throw new ErrorNotFound(`Kind ${manifest.kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        if (!manifest.apiVersion) {
            throw new Error(`The api version wasn't defined.`);
        }

        const api = this._clientApi(manifest.apiVersion);
        return this._handleStrategyExecution.bind(this, [this._deleteClusterObjectStrategy(api, normalizeKind(manifest.kind), manifest)]);
    }

    _deleteClusterObjectStrategy(api, kind, manifest) {

        const _kind = normalizeKind(kind);

        if (!this._registeredKind(_kind)) {
            throw new ErrorNotFound(`Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`);
        }

        if (api[`deleteNamespaced${_kind}`]) {

            return api[`deleteNamespaced${_kind}`].bind(api, manifest.metadata.name, manifest.metadata.namespace);
        } else if (api[`delete${_kind}`]) {

            return api[`delete${_kind}`].bind(api, manifest.metadata.name);
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

                if (!e?.response?.statusCode || e?.response?.statusCode !== 404) {
                    throw e;
                }

                return null;
            }
        }))).filter((value) => !!value);
    }

    _configuredManifest(configuration) {

        if (!configuration.kind) {
            configuration.kind = normalizeKind(configuration.constructor.name);
        }

        return configuration;
    }
};



export { K8sApi };
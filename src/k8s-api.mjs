import k8s from '@kubernetes/client-node';
import { k8sManifest } from '@thinkdeep/k8s-manifest';
import {ErrorNotFound} from './error/error-not-found.mjs'
import { k8sKind } from './k8s-kind.mjs';

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

            const resourceKind = k8sKind(resource.kind).toLowerCase();
            if (!this._kindToApiClients[resourceKind]) {
                this._kindToApiClients[resourceKind] = [];
            }

            /**
             * Initialize broadcast capability based on kind.
             */
            this._kindToApiClients[resourceKind].push(apiClient);


            if (!this._kindToGroupVersion[resourceKind]) {
                this._kindToGroupVersion[resourceKind] = [];
            }

            /**
             * Enable mapping of kind to group version for preferred version determination.
             */
            this._kindToGroupVersion[resourceKind].push(resourceList.groupVersion);
        }

    }

    async _initClientMappings(kubeConfig, apis = k8s.APIS) {

        return Promise.all([
            this._forEachApiGroup(kubeConfig, this._applyPreferredVersionToGroupMap.bind(this), apis),
            this._forEachApiResourceList(kubeConfig, this._applyResourceListValuesToMaps.bind(this), apis)
        ]);
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
        return this._kindToGroupVersion[k8sKind(kind).toLowerCase()] || [];
    }

    _clientApis(kind) {
        return this._kindToApiClients[k8sKind(kind).toLowerCase()] || [];
    }

    _clientApi(apiVersion) {
        return this._apiVersionToApiClient[apiVersion.toLowerCase()] || null;
    }

    _preferredVersions(groupVersions) {

        /**
         * A given kind can be part of multiple groups. Therefore, there are multiple preferred versions.
         */
        let preferredVersions = [];
        for (const groupVersion of groupVersions) {
            preferredVersions.push(this._groupVersionToPreferredVersion[groupVersion.toLowerCase()] || null);
        }
        return preferredVersions.filter((val) => !!val);
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

        const kindGroups = this._groupVersions(kind);

        if (kindGroups.length <= 0) {
            throw new Error(`The kind ${kind} didn't have any registered group versions.`);
        }

        const targetVersions = this._preferredVersions(kindGroups);

        if (targetVersions.length <= 0) {
            throw new Error(`The kind ${kind} didn't have registered preferred versions.`);
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
        return (await Promise.all(manifests.map(async(manifest) => {
            try {

                const received = await this._creationStrategy(manifest)();

                return this._configuredManifest(received.response.body);
            } catch (e) {

                if (!e?.response?.statusCode || e?.response?.statusCode !== 409) {
                    throw e;
                }

                return null;
            }
        }))).filter((val) => !!val);
    }

    _creationStrategy(manifest) {

        const kind = k8sKind(manifest.kind);
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

        try {
            await this.read( k8sKind(kind), name, namespace );
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
     * @param {String} kind The k8s kind (i.e, CronJob).
     * @param {String} name The name of the object as seen in the k8s metadata name field.
     * @param {String} namespace The k8s object's namespace.
     *
     * @returns A kubernetes javascript client representation of the object on the cluster.
     */
    async read(kind, name, namespace) {

        const results = await this._readStrategy( k8sKind(kind), name, namespace )();

        if (results.length === 0) {
            const namespaceMessage = !!namespace ? ` in namespace ${namespace}` : ``;
            throw new ErrorNotFound(`The resource of kind ${kind} with name ${name}${namespaceMessage} wasn't found.`);
        }

        return results.map((received) => this._configuredManifest(received.response.body))[0];
    }

    _readStrategy(kind, name, namespace) {

        const _kind = k8sKind(kind);

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

        const _kind = k8sKind(kind);
        if (api[`read${_kind}`]) {

            return api[`read${_kind}`].bind(api, name);
        } else if (api[`readNamespaced${_kind}`]) {

            return api[`readNamespaced${_kind}`].bind(api, name, namespace);
        } else {

            const namespaceText = namespace ? `and namespace ${namespace}` : ``;

            throw new Error(`
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

        const kind = k8sKind(manifest.kind);

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

        const _kind = k8sKind(kind);
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

        const responses = await this._listStrategy(kind, namespace)();

        return Promise.all(responses.map((data) => {

            const {response: {body}} = data;

            if (!body) {
                throw new Error(`The API response didn't include a valid body. Received: ${body}`);
            }

            const kindList = k8sManifest(body);
            for (let i = 0; i < kindList.items.length; i++) {
                kindList.items[i].apiVersion = kindList.apiVersion;
                kindList.items[i].kind = k8sKind(kindList.items[i]?.constructor?.name || '');
            }

            return kindList;
        }));
    }

    _listStrategy(kind, namespace) {

        const _kind = k8sKind(kind);
        const apis = this._clientApis(kind);

        let strategies = [];
        for (const api of apis) {
            strategies.push(this._listKindThroughApiStrategy(api, _kind, namespace));
        }

        const gatherAllKindLists = (stgs) => Promise.all(stgs.map((strategy) =>  strategy()));

        return gatherAllKindLists.bind(null, strategies);
    }

    _listKindThroughApiStrategy(api, kind, namespace) {

        const _kind = k8sKind(kind);
        if (!namespace && api[`list${_kind}ForAllNamespaces`]) {

            return api[`list${_kind}ForAllNamespaces`].bind(api);
        } else if (!!namespace && api[`listNamespaced${_kind}`]) {

            return api[`listNamespaced${_kind}`].bind(api, namespace);
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
            throw new Error(`The manifest value is invalid: ${manifest}`);
        }

        if (!manifest.kind) {
            throw new Error(`The manifest requires a kind.`);
        }

        if (!manifest.apiVersion) {
            throw new Error(`The manifest requires an api version.`);
        }

        const api = this._clientApi(manifest.apiVersion);
        return this._handleStrategyExecution.bind(this, [this._deleteKindThroughApiStrategy(api, k8sKind(manifest.kind), manifest)]);
    }

    _deleteKindThroughApiStrategy(api, kind, manifest) {

        const _kind = k8sKind(kind);
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
            configuration.kind = k8sKind(configuration.constructor.name);
        }

        return k8sManifest(configuration);
    }
};



export { K8sApi };
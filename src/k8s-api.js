import k8s from '@kubernetes/client-node';
import {k8sManifest} from '@thinkdeep/k8s-manifest';
import {ErrorNotFound} from './error/error-not-found.js';
import {normalizeKind} from './normalize-kind.js';

const DEFAULT_NAMESPACE = 'default';

/**
 * Wrapper around K8s javascript client handling interactions with the cluster.
 */
class K8sApi {
  /**
   * Constructor for theeee K8sApi object.
   */
  constructor() {
    this._apiVersionToApiClient = {};
    this._kindToApiClients = {};
    this._kindToGroupVersion = {};
    this._groupVersionToPreferredVersion = {};

    this._kindApiVersionMemo = {};
    this.defaultNamespace = DEFAULT_NAMESPACE;
  }

  /**
   * Initialize the api maps.
   *
   * @param {object} kubeConfig K8s javascript client KubeConfig object.
   * @param {Array<any>} [apis = k8s.APIS] The k8s API objects to use. This is intended for testing.
   */
  async init(kubeConfig, apis = k8s.APIS) {
    if (!this.initialized()) {
      await this._initClientMappings(kubeConfig, apis);
      console.log(`Initialized the k8s api.`);
    }
  }

  /**
   * Set the default namespace to use.
   *
   * @param {string} [val = DEFAULT_NAMESPACE] Default namespace to apply.
   */
  set defaultNamespace(val = DEFAULT_NAMESPACE) {
    this._defaultNamespace = val;
  }

  /**
   * Read the default namespace in use.
   *
   * @return {String} Default namespace.
   */
  get defaultNamespace() {
    return this._defaultNamespace || DEFAULT_NAMESPACE;
  }

  /**
   * Determine if the api has been initialized.
   *
   * @return {Boolean} True if initialized. False otherwise.
   */
  initialized() {
    return (
      Object.keys(this._apiVersionToApiClient).length > 0 &&
      Object.keys(this._kindToApiClients).length > 0 &&
      Object.keys(this._kindToGroupVersion).length > 0 &&
      Object.keys(this._groupVersionToPreferredVersion).length > 0
    );
  }

  /**
   * Map groups to group preferred version.
   * @param {Object} _ Unused API client object.
   * @param {any} apiGroup K8s javascript client APIGroup manifest.
   */
  _applyPreferredVersionToGroupMap(_, apiGroup) {
    for (const entry of apiGroup.versions) {
      /**
       * Initialize group version to preferred api version.
       */
      this._groupVersionToPreferredVersion[entry.groupVersion.toLowerCase()] =
        apiGroup.preferredVersion.groupVersion;
    }
  }

  /**
   * Store resource list data in maps.
   *
   * @param {Object} apiClient K8s javascript client API object.
   * @param {any} resourceList K8s javascript client ResourceList manifest.
   */
  _applyResourceListValuesToMaps(apiClient, resourceList) {
    /**
     * Initialize apiVersion-specific client mappings.
     */
    this._apiVersionToApiClient[resourceList.groupVersion.toLowerCase()] =
      apiClient;

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
      this._groupVersionToPreferredVersion[
        resourceList.groupVersion.toLowerCase()
      ] = resourceList.groupVersion;
    }
  }

  /**
   * Initialize mappings to clients.
   *
   * @param {k8s.KubeConfig} kubeConfig
   * @param {Array<Object>} apis APIs against which the resource function will be executed. This is primarily used for testing.
   */
  async _initClientMappings(kubeConfig, apis = k8s.APIS) {
    /**
     * The ordering of the following functions is important due to group to preferred version mapping.
     * Some api groups may not return (i.e, v1). The first function initializes the preferred group
     * version to its current group version and the second overwrites that with the actual registered
     * preferred version returned by the API. Therefore, the order should be:
     *
     * resource list processing -> api group processing.
     */
    await this._forEachApiResourceList(
      kubeConfig,
      this._applyResourceListValuesToMaps.bind(this),
      apis
    );

    await this._forEachApiGroup(
      kubeConfig,
      this._applyPreferredVersionToGroupMap.bind(this),
      apis
    );
  }

  /**
   * Execute a callback over each cluster API group.
   * @param {k8s.KubeConfig} kubeConfig K8s javascript client kube config.
   * @param {Function<Object, any>} callback Function to execute of the form (apiClient, manifest) => {...}
   * @param {Array<Object>} apis APIs against which the resource function will be executed. This is primarily used for testing.
   */
  async _forEachApiGroup(kubeConfig, callback, apis = k8s.APIS) {
    await this._forEachApi(kubeConfig, 'getAPIGroup', callback, apis);
  }

  /**
   * Execute a callback over each cluster API resource list.
   * @param {k8s.KubeConfig} kubeConfig K8s javascript client kube config.
   * @param {Function<Object, any>} callback Function to execute of the form (apiClient, manifest) => {...}
   * @param {Array<Object>} apis APIs against which the resource function will be executed. This is primarily used for testing.
   */
  async _forEachApiResourceList(kubeConfig, callback, apis = k8s.APIS) {
    await this._forEachApi(kubeConfig, 'getAPIResources', callback, apis);
  }

  /**
   * Run a callback over the results from executing a resource function.
   * @param {k8s.KubeConfig} kubeConfig K8s javascript client kube config.
   * @param {String} resourceFunctionName Name of the function to execute on each API.
   * @param {Function<apiClient, any>} callback Callback to execute with resultant data.
   * @param {Array<Object>} apis APIs against which the resource function will be executed. This is primarily used for testing.
   */
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
        throw new Error(
          `The resource function provided was not a function: ${resourceFunctionName}`
        );
      }

      try {
        const {
          response: {body},
        } = await fetchResources.bind(apiClient)();

        const manifest = k8sManifest(this._configuredManifestObject(body));

        this._memoizeManifestMetadata(manifest);

        callback(apiClient, manifest);
      } catch (e) {
        if (!e?.response?.statusCode || e?.response?.statusCode !== 404) {
          throw e;
        }
      }
    }
  }

  /**
   * Fetch all registered group versions.
   * @param {String} kind  K8s kind.
   * @return {Set<String>} Group versions.
   */
  _groupVersions(kind) {
    return (
      this._kindToGroupVersion[normalizeKind(kind).toLowerCase()] || new Set()
    );
  }

  /**
   * Fetch all relevant client APIs.
   *
   * @param {String} kind K8s kind.
   * @return {Array<Object>} K8s javascript client APIs (i.e, from kubeConfig.makeApiClient(...))
   */
  _clientApis(kind) {
    return this._kindToApiClients[normalizeKind(kind).toLowerCase()] || [];
  }

  /**
   * Get the registered client API associated with a specific api version.
   * @param {String} apiVersion K8s api version.
   * @return {Object} K8s javascript client API instance (i.e, from kubeConfig.makeApiClient(...))
   */
  _clientApi(apiVersion) {
    const client =
      this._apiVersionToApiClient[apiVersion.toLowerCase()] || null;

    if (!client) {
      throw new ErrorNotFound(
        `The specified api version ${apiVersion} was not recognized. Are you sure you're using one accepted by k8s?`
      );
    }

    return client;
  }

  /**
   * Check if the kind has been registered with the API.
   *
   * @param {String} kind K8s kind.
   * @return {Boolean} True if it was registered. False otherwise.
   */
  _registeredKind(kind) {
    return kind.toLowerCase() in this._kindToGroupVersion;
  }

  /**
   * Get the preferred api versions for the specified kind.
   *
   * NOTE: One kind can be part of multiple groups. Therefore, multiple preferred versions can exist.
   *
   * @param {string} kind K8s Kind.
   * @return {Array<String>} Preferred api versions or [] if none exist.
   */
  preferredApiVersions(kind) {
    const kindGroups = this._groupVersions(kind);

    return this._preferredApiVersions(kindGroups);
  }

  /**
   * Get the preferred API version for each group mentioned.
   * @param {Array<String>} groupVersions K8s cluster group versions.
   * @return {Array<String>} Preferred API versions for each group or [].
   */
  _preferredApiVersions(groupVersions) {
    /**
     * A given kind can be part of multiple groups. Therefore, there are multiple preferred versions.
     */
    const preferredVersions = new Set();
    for (const groupVersion of groupVersions) {
      const registeredPreferredVersion =
        this._groupVersionToPreferredVersion[groupVersion.toLowerCase()] || '';
      preferredVersions.add(registeredPreferredVersion);
    }

    return [...preferredVersions].filter((val) => Boolean(val));
  }

  /**
   *  Create all objects on the cluster.
   *
   * @param {Array<any>} manifests K8s javascript client objects.
   * @return {Promise< Array<any> >} K8s client objects or [] if the objects already exist.
   */
  async createAll(manifests) {
    const targets = [];
    for (const manifest of manifests) {
      try {
        const strategy = this._creationStrategy(manifest);

        const received = await strategy();

        const returnedManifest = k8sManifest(
          this._configuredManifestObject(received.response.body)
        );

        this._memoizeManifestMetadata(returnedManifest);

        targets.push(returnedManifest);
      } catch (e) {
        if (!e?.response?.statusCode || e?.response?.statusCode !== 409) {
          throw e;
        }
      }
    }

    return targets;
  }

  /**
   * Fetch the strategy to use for object creation.
   * @param {any} manifest K8s javascript client manifest object.
   * @return {Function} Strategy to use to create the specified object on the cluster with arguments bound.
   */
  _creationStrategy(manifest) {
    const kind = normalizeKind(manifest.kind);

    if (!this._registeredKind(kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const api = this._clientApi(manifest.apiVersion);
    if (api[`create${kind}`]) {
      return api[`create${kind}`].bind(api, manifest);
    } else if (api[`createNamespaced${kind}`]) {
      return api[`createNamespaced${kind}`].bind(
        api,
        manifest?.metadata?.namespace || this.defaultNamespace,
        manifest
      );
    }

    throw new Error(`
                The creation function for kind ${kind} wasn't found. This may be because it has an incorrect api version or that it hasn't yet been implemented yet. Please double-check the api version you used in the manifest and if the issue persists submit an issue on the github repo.
            `);
  }

  /**
   * Determine if the specified object exists on the cluster.
   *
   * @param {string} kind K8s kind.
   * @param {string} name K8s object metadata name.
   * @param {string} namespace K8s namespace.
   * @return {Boolean} True if the object exists on the cluster. False otherwise.
   */
  async exists(kind, name, namespace) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    try {
      await this.read(_kind, name, namespace);
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
   * @param {string} kind K8s kind.
   * @param {string} name Name of the object as seen in the metadata.name field.
   * @param {string} [namespace = this.defaultNamespace] Namespace of the object as seen in the metadata.namespace field.
   * @return {any} A kubernetes javascript client representation of the object on the cluster.
   */
  async read(kind, name, namespace = this.defaultNamespace) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const results = await this._broadcastReadStrategy(_kind, name, namespace)();

    if (results.length <= 0) {
      const namespaceMessage = namespace ? `in namespace ${namespace}` : ``;
      throw new ErrorNotFound(
        `The resource of kind ${kind} with name ${name} ${namespaceMessage} wasn't found.`
      );
    }

    return results.map((received) => {
      const manifest = k8sManifest(
        this._configuredManifestObject(received.response.body)
      );

      this._memoizeManifestMetadata(manifest);

      return manifest;
    })[0];
  }

  /**
   * Get the k8s javascript client strategy for reading cluster objects.
   *
   * @param {string} kind K8s kind.
   * @param {string} name Name of the object as seen in the metadata.name field.
   * @param {string} [namespace = this.defaultNamespace] Namespace of the object as seen in the metadata.namespace field.
   * @return {Function} Read function broadcasting to all kind apis with arguments bound.
   */
  _broadcastReadStrategy(kind, name, namespace = this.defaultNamespace) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const apis = this._clientApis(_kind);

    const strategies = [];
    for (const api of apis) {
      strategies.push(
        this._readClusterObjectStrategy(api, _kind, name, namespace)
      );
    }

    return this._handleStrategyExecution.bind(this, strategies);
  }

  /**
   * Get the read function from the k8s javascript client API.
   *
   * @param {any} api K8s javascript client API with the needed function.
   * @param {string} kind K8s kind.
   * @param {string} name Name of the object as seen in the metadata.name field.
   * @param {string} [namespace = this.defaultNamespace] Namespace of the object as seen in the metadata.namespace field.
   * @return {Function} Function to use to read the specified cluster object with arguments bound.
   */
  _readClusterObjectStrategy(
    api,
    kind,
    name,
    namespace = this.defaultNamespace
  ) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    if (!api) {
      throw new Error(`Api needs to be defined.`);
    }

    if (api[`read${_kind}`]) {
      return api[`read${_kind}`].bind(api, name);
    } else if (api[`readNamespaced${_kind}`]) {
      return api[`readNamespaced${_kind}`].bind(api, name, namespace);
    }

    const namespaceText = namespace ? `and namespace ${namespace}` : ``;

    throw new ErrorNotFound(`
                The read function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `);
  }

  /**
   * Update the cluster objects with the specified manifests.
   *
   * @param {Array<any>} manifests K8s javascript client objects.
   * @return {Promise< Array<any> >} Promise that resolves to the updated k8s client objects.
   */
  patchAll(manifests) {
    return Promise.all(
      manifests.map(async (manifest) => {
        const responses = await this._broadcastPatchStrategy(manifest)();

        if (responses.length === 0) {
          const namespaceMessage = manifest.metadata.namespace
            ? `in namespace ${manifest.metadata.namespace}`
            : '';
          throw new ErrorNotFound(
            `The resource ${manifest.metadata.name} of kind ${manifest.kind} ${namespaceMessage} wasn't found and, therefore, can't be updated.`
          );
        }

        const received = responses[0];

        const returnedManifest = k8sManifest(
          this._configuredManifestObject(received.response.body)
        );

        this._memoizeManifestMetadata(returnedManifest);

        return returnedManifest;
      })
    );
  }

  /**
   * Fetch the strategy for broadcasting the patch to the relevant APIs.
   *
   * @param {any} manifest K8s javascript client manifest object.
   * @return {Function} Strategy to use to broadcast the patch update to the relevant APIs with the arguments bound.
   */
  _broadcastPatchStrategy(manifest) {
    const kind = normalizeKind(manifest.kind);

    if (!this._registeredKind(kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const apis = this._clientApis(kind);

    const strategies = [];
    for (const api of apis) {
      strategies.push(this._patchClusterObjectStrategy(api, kind, manifest));
    }

    return this._handleStrategyExecution.bind(this, strategies);
  }

  /**
   * Fetch the patch strategy for the specified cluster object.
   *
   * @param {any} api K8s client API object (i.e, those in k8s.APIS).
   * @param {String} kind K8s kind.
   * @param {any} manifest K8s javascript client manifest object.
   * @return {Function} Strategy for interfacing with the cluster.
   */
  _patchClusterObjectStrategy(api, kind, manifest) {
    const pretty = undefined;

    const dryRun = undefined;

    const fieldManager = undefined;

    const force = undefined;

    const options = {
      headers: {
        'Content-type': 'application/merge-patch+json',
      },
    };

    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    if (api[`patchNamespaced${_kind}`]) {
      return api[`patchNamespaced${_kind}`].bind(
        api,
        manifest.metadata.name,
        manifest.metadata.namespace,
        manifest,
        pretty,
        dryRun,
        fieldManager,
        force,
        options
      );
    } else if (api[`patch${_kind}`]) {
      return api[`patch${_kind}`].bind(
        api,
        manifest.metadata.name,
        manifest,
        pretty,
        dryRun,
        fieldManager,
        force,
        options
      );
    }
    throw new Error(`
                The patch function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `);
  }

  /**
   * List all cluster objects.
   *
   * @param {string} kind The k8s kind (i.e, CronJob).
   * @param {string} namespace The namespace of the object as seen in the k8s metadata namespace field.
   * @return {Promise<Array<any>>} Promise that resolves to array of kind list objects (i.e, CronJobList) taken from the various relevant APIs (i.e, batch/v1 and batch/v1beta1).
   */
  async listAll(kind, namespace) {
    if (!this._registeredKind(kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const responses = await this._broadcastListStrategy(kind, namespace)();

    return Promise.all(
      responses.map((data) => {
        const {
          response: {body},
        } = data;

        if (!body) {
          throw new Error(
            `The API response didn't include a valid body. Received: ${body}`
          );
        }

        const kindList = k8sManifest(this._configuredManifestObject(body));

        for (let i = 0; i < kindList.items.length; i++) {
          const itemKind = normalizeKind(
            kindList.items[i]?.constructor?.name || ''
          );
          kindList.items[i].kind = itemKind;
          kindList.items[i].apiVersion = kindList.apiVersion;
          kindList.items[i] = this._configuredManifestObject(kindList.items[i]);
        }

        this._memoizeManifestMetadata(kindList);

        if (Array.isArray(kindList.items) && kindList.items.length > 0) {
          this._memoizeManifestMetadata(kindList.items[0]);
        }

        return kindList;
      })
    );
  }

  /**
   * Fetch the strategy to use to broadcast the list request across the relevant apis.
   *
   * @param {String} kind K8s kind.
   * @param {String} namespace K8s namespace.
   * @return {Function} Strategy that will broadcast list request with arguments bound.
   */
  _broadcastListStrategy(kind, namespace) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    const apis = this._clientApis(_kind);

    const strategies = [];
    for (const api of apis) {
      strategies.push(this._listClusterObjectsStrategy(api, _kind, namespace));
    }

    return this._handleStrategyExecution.bind(this, strategies);
  }

  /**
   * Fetch the k8s client list function usable to interface with the cluster.
   *
   * @param {any} api K8s client api type defined in k8s.APIS.
   * @param {string} kind K8s kind.
   * @param {string} namespace K8s cluster namespace
   * @return {Function} Strategy to use to interface with the cluster with the arguments bound.
   */
  _listClusterObjectsStrategy(api, kind, namespace) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    if (api[`list${_kind}`]) {
      return api[`list${_kind}`].bind(api);
    } else if (!namespace && api[`list${_kind}ForAllNamespaces`]) {
      return api[`list${_kind}ForAllNamespaces`].bind(api);
    } else if (api[`listNamespaced${_kind}`]) {
      return api[`listNamespaced${_kind}`].bind(
        api,
        namespace || this.defaultNamespace
      );
    }

    const namespaceText = namespace ? `and namespace ${namespace}` : ``;

    throw new Error(`
                The list function for kind ${kind} ${namespaceText} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `);
  }

  /**
   * Delete all the specified objects on the cluster.
   *
   * @param {Array<any>} manifests K8s javascript client objects.
   * @return {Promise} Promise that resolves once deletion completes for all manifests.
   */
  deleteAll(manifests) {
    return Promise.all(
      manifests.map((manifest) => this._deletionStrategy(manifest)())
    );
  }

  /**
   * Fetch the deletion strategy.
   *
   * @param {any} manifest K8s client object manifest.
   * @return {Function} Deletion strategy with parameters bound.
   */
  _deletionStrategy(manifest) {
    if (!manifest) {
      throw new Error(`The manifest value wasn't defined.`);
    }

    if (!this._registeredKind(manifest.kind)) {
      throw new ErrorNotFound(
        `Kind ${manifest.kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    if (!manifest.apiVersion) {
      throw new Error(`The api version wasn't defined.`);
    }

    const api = this._clientApi(manifest.apiVersion);

    return this._handleStrategyExecution.bind(this, [
      this._deleteClusterObjectStrategy(
        api,
        normalizeKind(manifest.kind),
        manifest
      ),
    ]);
  }

  /**
   * Fetch the strategy to use to delete the specified cluster object.
   *
   * @param {Object} api Api object of a type included in k8s.APIS.
   * @param {string} kind K8s kind.
   * @param {any} manifest K8s client object manifest.
   * @return {Function} Deletion strategy to use for the specified object with the necessary parameters bound.
   */
  _deleteClusterObjectStrategy(api, kind, manifest) {
    const _kind = normalizeKind(kind);

    if (!this._registeredKind(_kind)) {
      throw new ErrorNotFound(
        `Kind ${kind} was not found in the API. Are you sure it's correctly spelled?`
      );
    }

    if (api[`deleteNamespaced${_kind}`]) {
      return api[`deleteNamespaced${_kind}`].bind(
        api,
        manifest.metadata.name,
        manifest.metadata.namespace
      );
    } else if (api[`delete${_kind}`]) {
      return api[`delete${_kind}`].bind(api, manifest.metadata.name);
    }
    throw new Error(`
                The deletion function for kind ${kind} wasn't found. This may be because it hasn't yet been implemented. Please submit an issue on the github repo relating to this.
            `);
  }

  /**
   * Execute all the provided strategies and filter out falsy values.
   *
   * @param {Array<Function>} strategies Strategies to execute.
   * @return {Promise< Array<Object> >} Array containing the response from the strategy. This typically has the form:
   * {
   *      response: {
   *         body: { ... }
   *      }
   * }
   */
  async _handleStrategyExecution(strategies) {
    return (
      await Promise.all(
        strategies.map(async (strategy) => {
          try {
            return await strategy();
          } catch (e) {
            if (!e?.response?.statusCode || e?.response?.statusCode !== 404) {
              throw e;
            }

            return null;
          }
        })
      )
    ).filter((value) => Boolean(value));
  }

  /**
   * Check that required fields are defined on the incoming object and, if they aren't, attempt to fill them in with known data.
   *
   * @param {Object} configuration Manifest object.
   * @return {Object} Configuration with inferred fields if they weren't already present.
   */
  _configuredManifestObject(configuration) {
    if (!configuration) {
      throw new Error(`The configuration must be defined.`);
    }

    if (!configuration.apiVersion) {
      const kind = configuration.kind || '';
      configuration.apiVersion =
        this._inferApiVersion(kind) || configuration.groupVersion || '';
    }

    return configuration;
  }

  /**
   * Infer the api version from those preferred by the cluster or, if there aren't any, from those that have been seen on the objects encountered.
   *
   * @param {string} kind K8s kind.
   * @return {string|null} Inferred API version or null.
   */
  _inferApiVersion(kind) {
    const _kind = normalizeKind(kind).toLowerCase();
    return (
      this.preferredApiVersions(_kind)[0] ||
      this._memoizedApiVersions(_kind)[0] ||
      null
    );
  }

  /**
   * Memoize manifest metadata.
   *
   * @param {any} manifest K8s client object with a valid kind.
   */
  _memoizeManifestMetadata(manifest) {
    const kind = manifest.kind || '';

    if (!kind) {
      throw new Error(`The kind must be defined`);
    }

    const _kind = kind.toLowerCase();
    if (!this._memoizedApiVersions(_kind)) {
      this._kindApiVersionMemo[_kind] = new Set();
    }

    const apiVersion = manifest.apiVersion || '';
    if (
      Boolean(apiVersion) &&
      !this._memoizedApiVersions(_kind).includes(apiVersion)
    ) {
      this._kindApiVersionMemo[_kind].add(apiVersion);
    }
  }

  /**
   * Fetch the memoized api versions.
   *
   * @param {string} kind K8s kind.
   * @return {Array<string>} The api versions or [].
   */
  _memoizedApiVersions(kind) {
    const _kind = kind.toLowerCase();
    if (!this._kindApiVersionMemo[_kind]) {
      this._kindApiVersionMemo[_kind] = new Set();
    }

    return [...this._kindApiVersionMemo[_kind]] || [];
  }
}

export {K8sApi};

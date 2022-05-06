import {K8sApi} from './k8s-api.js';
import {k8sManifest, stringify} from '@thinkdeep/k8s-manifest';

const createApi = () => new K8sApi();

/**
 * Kubernetes client implementation.
 */
class K8sClient {
  /**
   * @param {KubeConfig} kubeConfig Kubernetes javascript client KubeConfig to apply.
   * @param {K8sApi} api K8sApi object. The presence of this parameter is primarily for testing.
   */
  constructor(kubeConfig, api = createApi()) {
    this._kubeConfig = kubeConfig;
    this._api = api;
  }

  /**
   * Initialize the K8sClient for use.
   *
   * Usage:
   * const config = new KubeConfig();
   * const client = await new K8sClient(config).init();
   *
   * @return {Promise<K8sClient>} Promise that resolves to the K8sClient instance.
   */
  async init() {
    await this._api.init(this._kubeConfig);

    return this;
  }

  /**
   * Set the default namespace to use.
   *
   * Usage:
   *
   * const client = await new K8sClient().init();
   *
   * client.defaultNamespace = 'development';
   *
   * //...
   *
   * @param {string} [val = 'default'] Default namespace to use.
   */
  set defaultNamespace(val = 'default') {
    this._api.defaultNamespace = val;
  }

  /**
   * Get the default namespace in use.
   *
   * @return {string} Default namespace string || 'default'.
   */
  get defaultNamespace() {
    return this._api.defaultNamespace || 'default';
  }

  /**
   * Get the cluster preferred api versions.
   *
   * NOTE: One kind can be part of multiple groups. Therefore, multiple preferred versions can exist.
   *
   * @param {string} kind K8s kind.
   * @return {Array<string>} Preferred api versions or [] if none exist.
   */
  preferredApiVersions(kind) {
    return this._api.preferredApiVersions(kind);
  }

  /**
   * Determine if an object exists on the cluster.
   *
   * @param {string} kind The k8s kind (i.e, CronJob).
   * @param {string} name The name of the object as seen in the k8s metadata name field.
   * @param {string} namespace The k8s object's namespace.
   * @return {Boolean} True if the object exists. False otherwise.
   */
  async exists(kind, name, namespace) {
    return this._api.exists(kind, name, namespace);
  }

  /**
   * Create an array of objects on your k8s cluster.
   *
   * NOTE: If a specific order for the objects being created is required by kubernetes this function will fail unless the array is ordered as needed.
   *
   * @param {Array<string> | Array<any>} configurations Accepted configurations include either valid yaml strings of the same form accepted by kubectl or kubernetes javascript API objects (i.e, k8s.V1CronJob). Make sure the kind and apiVersion fields are populated.
   * @return {Array<any>} Array of k8s javascript client objects of the associated form (i.e, k8s.V1CronJob for kind CronJob, etc).
   */
  async createAll(configurations) {
    const targets = [];
    for (const configuration of configurations) {
      targets.push(await this.create(configuration));
    }

    return targets;
  }

  /**
   * Create an object on your k8s cluster.
   *
   * @param {string | any} configuration Accepted configuration includes either a valid yaml string of the same form accepted by kubectl or a kubernetes javascript API object (i.e, k8s.V1CronJob). Make sure the kind and apiVersion fields are populated.
   * @return {any} The k8s javascript client object returned from the API or the manifest as constructed by the configuration. The latter case is necessary in the event that creation actually doesn't occur because the object already exists.
   */
  async create(configuration) {
    const manifest = k8sManifest(configuration);

    return (await this._api.createAll([manifest]))[0] || manifest;
  }

  /**
   * Create or update an array of configurations. This command has similar meaning to kubectl apply -f <...>. If an object doesn't already exist on the cluster it's created. Otherwise, it's updated.
   *
   * @param {Array<string> | Array<any>} configurations Accepted configurations include either valid yaml strings of the same form accepted by kubectl or kubernetes javascript API objects (i.e, k8s.V1CronJob). Make sure the kind and apiVersion fields are populated.
   * @return {Array<any>} Array of k8s javascript client objects of the associated form (i.e, k8s.V1CronJob for kind CronJob, etc).
   */
  async applyAll(configurations) {
    const targets = [];
    for (const configuration of configurations) {
      targets.push(await this.apply(configuration));
    }

    return targets;
  }

  /**
   * Create or update a configuration. This command has similar meaning to kubectl apply -f <...>. If the object doesn't already exist on the cluster it's created. Otherwise, it's updated.
   *
   * @param {string | any} configuration Accepted configuration includes either a valid yaml string of the same form accepted by kubectl or a kubernetes javascript API object (i.e, k8s.V1CronJob). Make sure the kind and apiVersion fields are populated.
   * @return {any} The k8s javascript client object returned from the API or the manifest as constructed by the configuration.
   */
  async apply(configuration) {
    const manifest = k8sManifest(configuration);

    const alreadyExists = await this.exists(
      manifest.kind,
      manifest.metadata.name,
      manifest.metadata.namespace
    );
    if (!alreadyExists) {
      return this.create(configuration);
    }

    const modifiedManifests = await this._api.patchAll([manifest]);

    return modifiedManifests[0];
  }

  /**
   * Get all objects of the specified kind in the associated namespace.
   *
   * @param {string} kind The k8s kind (i.e, CronJob).
   * @param {string} namespace The k8s object's namespace.
   * @return {Array<any>} Array of k8s javascript client objects of the specified kind from the specified namespace.
   */
  async getAll(kind, namespace) {
    const resources = await this._api.listAll(kind, namespace);

    const targets = [];
    for (const resource of resources) {
      for (const item of resource.items) {
        targets.push(item);
      }
    }

    return targets;
  }

  /**
   * Get an object from the cluster.
   *
   * NOTE: If the object doesn't exist on the cluster a ErrorNotFound exception will be thrown.
   *
   * @param {string} kind The k8s kind (i.e, CronJob).
   * @param {string} name The name of the object as seen in the k8s metadata name field.
   * @param {string} namespace The k8s object's namespace.
   * @return {any} A kubernetes javascript client representation of the object on the cluster.
   */
  async get(kind, name, namespace) {
    return this._api.read(kind, name, namespace);
  }

  /**
   * Delete all the specified objects on the k8s cluster.
   *
   * @param {Array<any>} manifests - K8s javascript client objects representing the cluster objects to be deleted.
   */
  async deleteAll(manifests) {
    for (const manifest of manifests) {
      await this.delete(manifest);
    }
  }

  /**
   * Delete an object from your cluster.
   *
   * @param {any} manifest The kubernetes javascript client representation of the object you want to delete. Remember to include a valid kind and apiVersion.
   */
  async delete(manifest) {
    await this._api.deleteAll([manifest]);
  }
}

export {K8sClient, stringify};

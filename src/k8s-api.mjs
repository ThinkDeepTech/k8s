import k8s from '@kubernetes/client-node';
import { k8sKind } from './k8s-kind.mjs';
import { k8sManifest } from './k8s-manifest.mjs';

const init = async (kubeConfig) => {
    if (!initialized()) {
        console.log(`Initializing kind maps.`)
        await initKindMaps(kubeConfig);

        console.log(`Initializing api version to client map.`)
        await initApiVersionToApiClientMap(kubeConfig);
    }
};

const initialized = () => {
    return (Object.keys(apiVersionToApiClient).length > 0) && (Object.keys(kindToApiClients).length > 0)
        && (Object.keys(kindToPreferredVersion).length > 0);
}

const apiVersionToApiClient = { };
const initApiVersionToApiClientMap = async (kubeConfig) => {

    await forEachApiResourceList(kubeConfig, (apiClient, resourceList) => {
        apiVersionToApiClient[resourceList.groupVersion.toLowerCase()] = apiClient;
    })

    console.log(`Api Map:\n\n${JSON.stringify(apiVersionToApiClient)}`);
}

const kindToApiClients = {};
const kindToPreferredVersion = {};
const initKindMaps = async (kubeConfig) => {

    await forEachApiResourceList(kubeConfig, (apiClient, resourceList) => {
        for (const resource of resourceList.resources) {

            const resourceName = resource.name.toLowerCase();
            if (!kindToApiClients[resourceName]) {
                kindToApiClients[resourceName] = [];
            }

            kindToApiClients[resourceName].push(apiClient);
            kindToPreferredVersion[resourceName] = `${resource.group}/${resource.version}`;
        }
    });

    console.log(`Kind Map:\n\n${JSON.stringify(kindToApiClients)}\n\n`);

    console.log(`Preferred version Map:\n\n${JSON.stringify(kindToPreferredVersion)}\n\n`);
};

const clientApis = (kind) => {
    return kindToApiClients[kind.toLowerCase()] || [];
}

const clientApi = (apiVersion) => {
    return apiVersionToApiClient[apiVersion.toLowerCase()] || null;
}

const forEachApiResourceList = async (kubeConfig, callback) => {
    await forEachApi(kubeConfig, 'getAPIResources', callback);
}

const forEachApi = async (kubeConfig, resourceFunctionName, callback) => {
    for (const api of k8s.APIS) {

        const apiClient = kubeConfig.makeApiClient(api);

        const fetchResources = apiClient[resourceFunctionName];

        if (typeof fetchResources === 'function') {

            const {response: {body}} = await fetchResources.bind(apiClient)();

            console.log(`API ${resourceFunctionName} response body:\n\n${JSON.stringify(body)}`)

            // TODO: Verify this is correct handling. Are objects not available?
            if (typeof body !== 'object' && Object.keys(body).length === 0) {
                continue;
            }

            callback(apiClient, k8sManifest(body));
        }
    }
};

const preferredVersion = (kind) => {
    const version = kindToPreferredVersion[kind.toLowerCase()];

    if (!version) {
        throw new Error(`The kind ${kind} didn't have a registered preferred version. Received: ${version}`);
    }

    return version;
};

const createAll = async (manifests) => {
    return Promise.all(manifests.map(async(manifest) => await creationStrategy(manifest)()));
}

const deleteAll = async (manifests) => {
    return Promise.all(manifests.map(async (manifest) => await deletionStrategy(manifest)()));
}

const listAll = async (kind, namespace) => {
    console.log(`Listing all objects with kind ${kind}${ !!namespace ? ` in namespace ${namespace}`: ``}.`);
    const responses = listAllStrategy(kind, namespace)();

    return Promise.all(responses.map((data) => {

        const {response: {body}} = data;

        if (!body) {
            throw new Error(`The API response didn't include a valid body. Received: ${body}`);
        }

        console.log(`In List all.\n\nReceived body:\n\n${JSON.stringify(body)}`);

        if (!body.apiVersion) {
            body.apiVersion = preferredVersion(body.kind);
            console.log(`Set api version to ${body.apiVersion} for object ${body.kind}`);
        }

        return k8sManifest(body);
    }));
}

const listAllStrategy = (prospectiveKind, namespace) => {

    const kind = k8sKind(prospectiveKind.toLowerCase());
    const apis = clientApis(kind);
    const fetchAllData = async (listOperations) => Promise.all(listOperations.map(async (listOperation) => await listOperation()));

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

const creationStrategy = (manifest) => {

    const kind = k8sKind(manifest.kind.toLowerCase());

    console.log(`Fetching api strategy for api ${manifest.apiVersion}`);
    const api = clientApi(manifest.apiVersion);
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

const deletionStrategy = (manifest) => {

    const kind = k8sKind(manifest.kind.toLowerCase());
    const api = clientApi(manifest.apiVersion);
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

export default { init, createAll, listAll, deleteAll };
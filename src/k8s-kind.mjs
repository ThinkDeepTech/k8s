import k8s from '@kubernetes/client-node';

const kindStringToManifestKindMap = {};

const initKindMap = () => {
    for (const registeredKind in k8s) {

        const versionlessRegisteredKind = removeVersion(registeredKind);
        kindStringToManifestKindMap[versionlessRegisteredKind.toLowerCase()] = versionlessRegisteredKind;
    }
}

const k8sKind = (prospectiveKind) => {

    if (Object.keys(kindStringToManifestKindMap).length === 0) {
        initKindMap();
    }

    const versionlessKind = removeVersion(prospectiveKind)

    const targetKind = kindStringToManifestKindMap[versionlessKind.toLowerCase()] || '';

    if (!targetKind) {
        throw new Error(`The kind ${prospectiveKind} wasn't found in the k8s client library. Are you sure you supplied an accepted kind?`);
    }

    return targetKind;
}

const removeVersion = (constructorName) => {

    const matches = constructorName.match(/[A-Za-z]+(?!\d+)(?=[A-Za-z]*$)/);

    if (!matches) {
        return constructorName;
    }

    return matches[0];
}

export { k8sKind };
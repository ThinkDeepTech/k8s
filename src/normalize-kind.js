import k8s from '@kubernetes/client-node';

const kindStringToManifestKindMap = {};

const initKindMap = () => {
  for (const registeredKind in k8s) {
    if (Object.prototype.hasOwnProperty.call(k8s, registeredKind)) {
      const versionlessRegisteredKind = removeVersion(registeredKind);
      kindStringToManifestKindMap[versionlessRegisteredKind.toLowerCase()] =
        versionlessRegisteredKind;
    }
  }
};

const normalizeKind = (prospectiveKind) => {
  if (Object.keys(kindStringToManifestKindMap).length === 0) {
    initKindMap();
  }

  const versionlessKind = removeVersion(prospectiveKind);

  const targetKind =
    kindStringToManifestKindMap[versionlessKind.toLowerCase()] ||
    versionlessKind;

  if (!targetKind) {
    throw new Error(
      `The kind ${prospectiveKind} wasn't found in the k8s client library. The kind found was ${targetKind}. Are you sure you supplied an accepted kind?`
    );
  }

  return targetKind;
};

const removeVersion = (constructorName) => {
  const indexLastNumber = constructorName.search(/\d+(?=[A-Za-z]+$)/);
  if (indexLastNumber < 0) {
    return constructorName;
  }

  return constructorName.slice(indexLastNumber + 1);
};

export {normalizeKind};

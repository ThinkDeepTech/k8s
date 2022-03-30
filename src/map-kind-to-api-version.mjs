const kindToApiVersionMap = {
    "binding": "v1",
    "componentstatus": "v1",
    "configmap": "v1",
    "endpoints": "v1",
    "limitrange": "v1",
    "namespace": "v1",
    "node": "v1",
    "persistentvolume": "v1",
    "persistentvolumeclaim": "v1",
    "pod": "v1",
    "podtemplate": "v1",
    "replicationcontroller": "v1",
    "resourcequota": "v1",
    "secret": "v1",
    "service": "v1",
    "serviceaccount": "v1",
    "controllerrevision": "apps/v1",
    "daemonset": "apps/v1",
    "deployment": "apps/v1",
    "replicaset": "apps/v1",
    "statefulset": "apps/v1",
    "cronjob": "batch/v1",
    "job": "batch/v1",
    "horizontalpodautoscaler": "autoscaling/v1",
    "priorityclass": "scheduling.k8s.io/v1",
    "endpointslice": "discovery.k8s.io/v1",
    "ingress": "networking.k8s.io/v1",
    "ingressclass": "networking.k8s.io/v1",
    "networkpolicy": "networking.k8s.io/v1",
    "csidriver": "storage.k8s.io/v1",
    "csinode": "storage.k8s.io/v1",
    "csistoragecapacity": "storage.k8s.io/v1beta1",
    "storageclass": "storage.k8s.io/v1",
    "volumeattachment": "storage.k8s.io/v1",
    "tokenrequest": "authentication.k8s.io/v1",
    "tokenreview": "authentication.k8s.io/v1",
    "certificatesigningrequest": "certificates.k8s.io/v1",
    "localsubjectaccessreview": "authorization.k8s.io/v1",
    "selfsubjectaccessreview": "authorization.k8s.io/v1",
    "selfsubjectrulesreview": "authorization.k8s.io/v1",
    "subjectaccessreview": "authorization.k8s.io/v1",
    "clusterrole": "rbac.authorization.k8s.io/v1",
    "clusterrolebinding": "rbac.authorization.k8s.io/v1",
    "role": "rbac.authorization.k8s.io/v1",
    "rolebinding": "rbac.authorization.k8s.io/v1",
    "poddisruptionbudget": "policy/v1",
    "podsecuritypolicy": "policy/v1beta1",
    "customresourcedefinition": "apiextensions.k8s.io/v1",
    "mutatingwebhookconfiguration": "admissionregistration.k8s.io/v1",
    "validatingwebhookconfiguration": "admissionregistration.k8s.io/v1",
    "event": "events.k8s.io/v1",
    "apiservice": "apiregistration.k8s.io/v1",
    "lease": "coordination.k8s.io/v1",
    "runtimeclass": "node.k8s.io/v1",
    "flowschema": "flowcontrol.apiserver.k8s.io/v1beta1",
    "prioritylevelconfiguration": "flowcontrol.apiserver.k8s.io/v1beta1",
};

const mapKindToApiVersion = (kind) => {

    const apiVersion = kindToApiVersionMap[kind.toLowerCase()];

    if (!apiVersion) {
        throw new Error(`The kind ${kind} specified doesn't map to a known api version.`);
    }

    console.info(`Found api version ${apiVersion} for kind ${kind}`);

    return apiVersion;
};

export { mapKindToApiVersion };
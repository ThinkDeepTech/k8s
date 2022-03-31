import {stringify} from './k8s-manifest.mjs';

class K8sObjectHandle {
    constructor(manifest) {
        this._manifest = manifest;
    }

    get manifest () {
        return this._manifest;
    }

    toString() {
        return stringify(this.manifest);
    }
}

export { K8sObjectHandle };
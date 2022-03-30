import {stringify} from './k8s-manifest.mjs';

class K8sObjectHandle {
    constructor(api, manifest) {
        this._api = api;
        this._manifest = manifest;
    }

    get api() {
        return this._api;
    }

    get manifest () {
        return this._manifest;
    }

    toString() {
        return stringify(this.manifest);
    }
}

export { K8sObjectHandle };
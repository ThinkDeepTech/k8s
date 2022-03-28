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
        return this._manifest.toString();
    }
}

export { K8sObjectHandle };
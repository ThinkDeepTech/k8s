import k8s from "@kubernetes/client-node";
import { capitalizeFirstLetter } from "./capitalize-first-letter.mjs";
import { mapKindToApiVersion } from "./map-kind-to-api-version.mjs";
import yaml from "yaml";

class K8sManifest {
    constructor(configuration) {

        if (configuration.constructor.name in k8s) {

            configuration.kind = this._kind(configuration.constructor.name);
            configuration.apiVersion = mapKindToApiVersion(configuration.kind);
            this._obj = configuration;
            console.log(`Initialized with k8s client object of type: ${configuration.constructor.name}`);
        } else {
            this._yaml = configuration;

            console.log(`Yaml configuration found. ${yaml.stringify(configuration)}`);

            const objectPrefix = this._objectVersion(this._yaml.apiVersion);
            const objectKind = this._kind(`${objectPrefix}${this._yaml.kind}`);
            console.log(`Creating object with prefix: ${objectPrefix}${objectKind}`);
            this._obj = this._k8sClientObject(`${objectPrefix}${objectKind}`, this._yaml);
        }

        if (!this.apiVersion) {
            throw new Error(`${this.apiVersion} wasn't recognized as a valid API version. Are you sure you spelled it correctly?`);
        }

        if (!this.kind) {
            throw new Error(`${this.kind} wasn't recognized as a valid kind. Are you sure you spelled it correctly?`);
        }
    }

    get apiVersion() {
        return this._obj.apiVersion;
    }

    get kind() {
        return this._obj.kind;
    }

    get metadata() {
        return this._obj.metadata;
    }

    toString() {
        return k8s.dumpYaml(this._obj);
    }

    k8sClientObject() {
        return this._obj;
    }

    _k8sClientObject(typeName, value) {

        if (this._baseType(typeName, value)) {

            if (this._dateType(typeName) && !!value) {
                return new Date(value);
            }

            return value;
        } else if (this._arrayType(typeName)) {

            return this._handleArrayType(typeName, value);
        } else if (this._mapType(typeName)) {

            return this._handleMap(typeName, value);
        } else {

            return this._handleClientObjectType(typeName, value);
        }
    }

    _baseType(typeName, value) {
        return (!this._mapType(typeName) && !this._arrayType(typeName) && !this._object(value)) || this._dateType(typeName);
    }

    _object(value) {
        return typeof value === 'object';
    }

    _dateType(typeName) {
        return typeName === 'Date';
    }

    _arrayType(typeName) {
        return typeName.includes('Array');
    }

    _mapType(typeName) {
        return typeName.includes('{');
    }

    _attributeTypeMap(typeName, attributeName) {

        const attributeTypeMaps = k8s[typeName]['getAttributeTypeMap']();

        let targetTypeMap = {};
        for (const prospectiveTypeMap of attributeTypeMaps) {
            if (prospectiveTypeMap.name === attributeName) {
                targetTypeMap = prospectiveTypeMap;
            }
        }

        if (this._emptyMap(targetTypeMap)) {
            throw new Error(`
                The attribute with name ${attributeName} and type ${typeName} wasn't found in the type map. Are you sure it's acceptible in kubernetes yaml configurations?
            `);
        }

        return targetTypeMap;
    }

    _handleArrayType(typeName, value) {

        let subject = [];

        const elementType = typeName.match(/(?<=Array\<)(.*?)(?=\>)/)[0];

        if (!elementType) {
            throw new Error(`Could not match array element type for type ${typeName}`);
        }

        for (const entry of value) {
            subject.push(this._k8sClientObject(elementType, entry));
        }

        return subject;
    }

    _handleMap(typeName, value) {

        let subject = {};

        const propertyType = typeName.match(/(?<=\{ \[key: \w+\]: )(.*?)(?=; \})/)[0];

        for (const attribute in value) {
            subject[attribute] = this._k8sClientObject(propertyType, value[attribute]);
        }

        return subject;
    }

    _handleClientObjectType(typeName, value) {

        console.log(`Creating object of type: ${typeName}`);

        if (typeName === 'object') {
            console.log(`Value: ${JSON.stringify(value)}`)
            return value;
        }

        let subject = new k8s[typeName]();

        for (const attribute in value) {

            const targetTypeMap = this._attributeTypeMap(typeName, attribute);

            console.log(`Handling attribute ${attribute} for type ${typeName} `)
            subject[attribute] = this._k8sClientObject(targetTypeMap.type, value[attribute]);

        }

        return subject;
    }

    _objectVersion(apiVersion) {
        if (!apiVersion.includes('/')) {
            return capitalizeFirstLetter(apiVersion);
        } else {

            const parts = apiVersion.split('/');
            const lastPart = parts[parts.length - 1];
            return capitalizeFirstLetter(lastPart);
        }
    }


    _emptyMap(map) {
        return Object.keys(map).length === 0;
    }

    _kind(prospectiveKind) {

        let targetKind = "";
        for (const registeredKind in k8s) {

            if (registeredKind.toLowerCase() === prospectiveKind.toLowerCase()) {
                targetKind = this._removeVersion(registeredKind);
                break;
            }
        }

        if (!targetKind) {
            throw new Error(`The kind ${prospectiveKind} wasn't found in the k8s client library. Are you sure you supplied an accepted kind?`);
        }

        return targetKind;
    }

    _removeVersion(constructorName) {

        console.log(`Constructor name: ${constructorName}`);

        const matches = constructorName.match(/[A-Za-z]+(?!\d+)(?=[A-Za-z]*$)/);

        if (!matches) {
            return constructorName;
        }

        const versionlessConstructorName = matches[0];

        console.log(`Versionless constructor name ${versionlessConstructorName} used for constructor ${constructorName}`);

        return versionlessConstructorName;
    }
}

export { K8sManifest };
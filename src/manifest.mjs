import k8s from "@kubernetes/client-node";
import { capitalizeFirstLetter } from "./capitalize-first-letter.mjs";
import { kind } from "./kind.mjs";
import { mapKindToApiVersion } from "./map-kind-to-api-version.mjs";
import yaml from "yaml";

const manifest = (configuration) => {

    let target = null;
    if (configuration.constructor.name in k8s) {

        configuration.kind = kind(configuration.constructor.name);
        configuration.apiVersion = mapKindToApiVersion(configuration.kind);
        target = configuration;
    } else {

        const objectPrefix = objectVersion(configuration.apiVersion);
        const objectKind = kind(configuration.kind);
        target = k8sClientObject(`${objectPrefix}${objectKind}`, configuration);
    }

    if (!target.apiVersion) {
        throw new Error(`${this.apiVersion} wasn't recognized as a valid API version. Are you sure you spelled it correctly?`);
    }

    if (!target.kind) {
        throw new Error(`${this.kind} wasn't recognized as a valid kind. Are you sure you spelled it correctly?`);
    }

    return target;
};

const stringify = () => {
    return k8s.dumpYaml(this._obj);
}

const k8sClientObject = (typeName, value) => {

    if (baseType(typeName, value)) {

        if (dateType(typeName) && !!value) {
            return new Date(value);
        }

        return value;
    } else if (arrayType(typeName)) {

        return handleArrayType(typeName, value);
    } else if (mapType(typeName)) {

        return handleMap(typeName, value);
    } else {

        return handleClientObjectType(typeName, value);
    }
}

const baseType = (typeName, value) => {
    return (!mapType(typeName) && !arrayType(typeName) && !object(value)) || dateType(typeName);
}

const object = (value) =>  {
    return typeof value === 'object';
}

const dateType = (typeName) => {
    return typeName === 'Date';
}

const arrayType = (typeName) => {
    return typeName.includes('Array');
}

const mapType = (typeName) => {
    return typeName.includes('{');
}

const attributeTypeMap = (typeName, attributeName) => {

    const attributeTypeMaps = k8s[typeName]['getAttributeTypeMap']();

    let targetTypeMap = {};
    for (const prospectiveTypeMap of attributeTypeMaps) {
        if (prospectiveTypeMap.name === attributeName) {
            targetTypeMap = prospectiveTypeMap;
        }
    }

    if (emptyMap(targetTypeMap)) {
        throw new Error(`
            The attribute with name ${attributeName} and type ${typeName} wasn't found in the type map. Are you sure it's acceptible in kubernetes yaml configurations?
        `);
    }

    return targetTypeMap;
}

const handleArrayType = (typeName, value) => {

    let subject = [];

    const elementType = typeName.match(/(?<=Array\<)(.*?)(?=\>)/)[0];

    if (!elementType) {
        throw new Error(`Could not match array element type for type ${typeName}`);
    }

    for (const entry of value) {
        subject.push(k8sClientObject(elementType, entry));
    }

    return subject;
}

const handleMap = (typeName, value) => {

    let subject = {};

    const propertyType = typeName.match(/(?<=\{ \[key: \w+\]: )(.*?)(?=; \})/)[0];

    for (const attribute in value) {
        subject[attribute] = k8sClientObject(propertyType, value[attribute]);
    }

    return subject;
}

const handleClientObjectType = (typeName, value) => {

    if (typeName === 'object') {
        return value;
    }

    let subject = new k8s[typeName]();

    for (const attribute in value) {

        const targetTypeMap = attributeTypeMap(typeName, attribute);

        subject[attribute] = k8sClientObject(targetTypeMap.type, value[attribute]);

    }

    return subject;
}

const objectVersion = (apiVersion) => {
    if (!apiVersion.includes('/')) {
        return capitalizeFirstLetter(apiVersion);
    } else {

        const parts = apiVersion.split('/');
        const lastPart = parts[parts.length - 1];
        return capitalizeFirstLetter(lastPart);
    }
}


const emptyMap = (map) => {
    return Object.keys(map).length === 0;
}

export { manifest, stringify };
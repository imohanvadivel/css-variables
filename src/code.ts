import Color from "colorjs.io";

export type Config = {
    preserveAlias: boolean;
    ignoreCodeSyntax: boolean;
    colorUnit: "hex" | "rgb" | "hsl" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "display-p3";
    numberUnit: "px" | "rem";
};

let config: Config = {
    preserveAlias: true,
    ignoreCodeSyntax: false,
    colorUnit: "hex",
    numberUnit: "px",
};

figma.showUI(__html__, { themeColors: true, height: 520, width: 320 });

figma.ui.onmessage = (message) => {
    switch (message.type) {
        case "GET_LOCAL_COLLECTIONS":
            const collections = figma.variables.getLocalVariableCollections();
            const data = collections.map((c) => ({ id: c.id, modes: c.modes, name: c.name, variables: c.variableIds }));

            figma.ui.postMessage({ type: "LOCAL_COLLECTIONS", data });
            break;
        case "EXPORTS":
            config = message.config;
            const processedData = processExports(message.value);
            figma.ui.postMessage({ type: "PROCESSED_DATA", data: { processedData, config } });
            break;
        case "NOTIFY":
            figma.notify(message.data);
            break;

        case "IMPORT":
            let variableCount = Object.keys(message.data).length;

            // New collection
            if (message.importType === "newCollection") {
                importNewCollection(message);
                figma.closePlugin(`${variableCount} variable${variableCount > 1 ? "s" : ""} has been imported successfully`);

                // Existing Collection
            } else if (message.importType === "existingCollection") {
                importExistingCollection(message);
                figma.closePlugin(`${variableCount} variable${variableCount > 1 ? "s" : ""} has been imported successfully`);
            }
            break;
    }
};

function resolveAliase(id) {
    let variable = figma.variables.getVariableById(id);
    let modes = Object.keys(variable.valuesByMode);
    let value = variable.valuesByMode[modes[0]];

    if (value["type"] === "VARIABLE_ALIAS") {
        return resolveAliase(value["id"]);
    } else {
        return value;
    }
}

function processExports(exports: string[]) {
    let exportData = exports.map((c) => c.split("|"));

    return exportData.map((data) => {
        let collectionId = data[0];
        let modeId = data[1];

        let collection = figma.variables.getVariableCollectionById(collectionId);
        let collectionName = collection.name;
        let modeName = collection.modes.find((m) => m.modeId === modeId).name;
        let variableIds = collection.variableIds;

        let variableData = variableIds.map((varId) => {
            let variable = figma.variables.getVariableById(varId);
            let key = variable.name.split("/").slice(-1)[0];
            let type = variable.resolvedType;
            let value = variable.valuesByMode[modeId];
            if (type === "BOOLEAN" || type === "STRING") return null;
            let alias = false;
            let webSyntax = null;
            if (variable.codeSyntax && variable.codeSyntax.WEB) webSyntax = variable.codeSyntax.WEB;

            if (value["type"] === "VARIABLE_ALIAS") {
                alias = true;
                if (config.preserveAlias) {
                    let parentVariable = figma.variables.getVariableById(value["id"]);
                    value = parentVariable.name;
                    // Case: if codeSyntax is true and preserveAlias is true
                    // then we should use the webSyntax of the parent variable
                    if (!config.ignoreCodeSyntax && parentVariable.codeSyntax && parentVariable.codeSyntax.WEB)
                        value = parentVariable.codeSyntax.WEB;
                } else {
                    value = resolveAliase(value["id"]);
                }
            }

            return { key, value, type, alias, webSyntax };
        });

        // Color Conversion
        variableData = variableData.map((variable) => {
            if (!variable || variable.type !== "COLOR") return variable;
            if (variable.alias && config.preserveAlias) return variable;

            // @ts-ignore
            let { r, g, b, a } = variable.value;
            let color = new Color(`srgb`, [r, g, b], a);

            let convertedColor;
            let newValue: string;

            switch (config.colorUnit) {
                case "hex":
                    convertedColor = color.to("srgb");
                    newValue = convertedColor.toString({ format: "hex" });

                    break;
                default:
                    convertedColor = color.to(config.colorUnit);
                    newValue = convertedColor.toString({ precision: 3 });

                    break;
            }

            let inSrgbGamut = convertedColor.inGamut("srgb");

            return { ...variable, cssValue: newValue, inSrgbGamut };
        });

        // Number Conversion
        variableData = variableData.map((variable) => {
            if (!variable || variable.type !== "FLOAT") return variable;
            if (variable.alias && config.preserveAlias) return variable;
            let newValue: string;

            switch (config.numberUnit) {
                case "px":
                    newValue = `${variable.value}px`;
                    break;
                case "rem":
                    newValue = `${(variable.value as number) / 16}rem`;

                    break;
            }
            return { ...variable, cssValue: newValue };
        });

        variableData = variableData.filter((v) => v);

        return { collectionName, collectionId, modeName, modeId, variableData };
    });
}

function parseData(varObj) {
    let keyAry = Object.keys(varObj);

    let data = [];

    keyAry.forEach((key) => {
        let value = varObj[key];

        try {
            let str = new Color(value).toString({
                format: {
                    name: "rgba",
                    coords: ["<number>[0, 1]", "<number>[0, 1]", "<number>[0, 1]", "<number>[0, 1]"],
                },
            });

            let pattern1 = /rgba\((.*?) (.*?) (.*?) \/ (.*?)\)/;
            let pattern2 = /rgba\((.*?) (.*?) (.*?)\)/;
            let match;

            if (pattern1.test(str)) {
                match = str.match(pattern1);
            } else if (pattern2.test(str)) {
                match = str.match(pattern2);
            }

            data.push({
                key,
                resolvedType: "COLOR",
                value: {
                    r: parseFloat(match[1]),
                    g: parseFloat(match[2]),
                    b: parseFloat(match[3]),
                    a: parseFloat(match[4]) || 1,
                },
            });
        } catch (err) {
            const unitsInPx = {
                px: 1,
                in: 96, // 1 inch = 96 pixels (CSS standard)
                cm: 37.8, // 1 cm = 37.8 pixels (CSS standard)
                mm: 3.78, // 1 mm = 3.78 pixels (CSS standard)
                pt: 1.33, // 1 pt = 1.33 pixels (CSS standard)
                pc: 16, // 1 pica = 16 pixels (CSS standard)
                rem: 16, // Assuming default font size of 16px
            };

            const unit = value.match(/[a-zA-Z]+/);
            const numericValue = parseFloat(value);

            if (unit && unitsInPx.hasOwnProperty(unit[0])) {
                data.push({ key, resolvedType: "FLOAT", value: numericValue * unitsInPx[unit] });
            }
        }
    });

    return data;
}

function importNewCollection(payload) {
    let collection = figma.variables.createVariableCollection(payload.collectionName);
    let modeId = collection.modes[0].modeId;
    collection.renameMode(modeId, payload.modeName);
    let data = parseData(payload.data);

    data.forEach((d) => {
        let variable = figma.variables.createVariable(d.key, collection.id, d.resolvedType);
        variable.setValueForMode(modeId, d.value);
    });
}

function importExistingCollection(payload) {
    let collection = figma.variables.getVariableCollectionById(payload.collectionId);
    let modeId = payload.modeId;
    let varIds = collection.variableIds;
    let data = parseData(payload.data);

    let varAry = varIds.map(figma.variables.getVariableById);

    data.forEach((d) => {
        let key = d.key;

        let selVar = varAry.find((variable) => variable.name === key);

        if (selVar && selVar.resolvedType === d.resolvedType) {
            selVar.setValueForMode(modeId, d.value);
        } else {
            let variable = figma.variables.createVariable(d.key, collection.id, d.resolvedType);
            variable.setValueForMode(modeId, d.value);
        }
    });
}

import JSZip from "jszip";
import FileSaver from "file-saver";
import type { Config } from "../code.ts";
export function postFigma(data) {
    window.parent.postMessage({ pluginMessage: data }, "*");
}

type ProcessedData = {
    collectionId: string;
    collectionName: string;
    css: string;
    modeId: string;
    modeName: string;
};

type VariableData = {
    key: string;
    alias: boolean;
    type: string;
    cssValue: string;
    value: any;
    inSrgbGamut: boolean;
    webSyntax: string | null;
};

export function convertToCss(variableData: VariableData[], config: Config) {
    let head = `:root {\n`;
    let foot = `\n}`;

    let bodyData = variableData.map((data) => {
        let key = CSS.escape(data.key);
        let value = data.cssValue;

        if (config.preserveAlias && data.alias) {
            value = `var(--${CSS.escape(data.value)})`;
        }

        if (!config.ignoreCodeSyntax && data.webSyntax) {
            key = data.webSyntax;
        } else {
            key = `--${key}`;
        }

        return `\t${key}: ${value};`;
    });

    let body = bodyData.join("\n");

    return head + body + foot;
}

export async function generateZip(processedData: ProcessedData[]) {
    let zip = new JSZip();
    return new Promise(async (res, rej) => {
        try {
            processedData.map((data) => {
                zip.folder(data.collectionName).file(`${data.modeName}.css`, data.css);
            });
            const blob = await zip.generateAsync({ type: "blob" });
            FileSaver.saveAs(blob, "variables.zip");
            res(1);
        } catch (err) {
            rej(err);
        }
    });
}

export function parseCSS(string: string) {
    const regex = /--(.*?):(.*?);/g;
    let match;
    let data = {};
    while ((match = regex.exec(string))) {
        const key = match[1].trim();
        const value = match[2].trim();
        data[key] = value;
    }

    return data;
}

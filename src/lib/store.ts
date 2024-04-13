import { readable } from "svelte/store";
import { convertToCss, generateZip, postFigma } from "./util.ts";

type Mode = {
    name: string;
    modeId: string;
};

type LocalCollectionItem = {
    id: string;
    modes: Mode[];
    name: string;
    variables: string[];
};

export const localCollections = readable<LocalCollectionItem[]>([], (set) => {
    postFigma({ type: "GET_LOCAL_COLLECTIONS" });

    var fun = (event) => {
        let message = event.data.pluginMessage;
        console.log("localCollections", message);
        if (message && message.type === "LOCAL_COLLECTIONS") set(message.data);
    };

    window.addEventListener("message", fun);

    return () => {
        window.removeEventListener("message", fun);
    };
});

function processAndSaveZip(data: any) {
    let { processedData, config } = data;

    // Converting processed data to CSS
    processedData = processedData.map((d) => {
        let css = convertToCss(d.variableData, config);
        return { ...d, css };
    });

    generateZip(processedData)
        .then((res) => {
            postFigma({ type: "NOTIFY", data: "Saving your file..." });
        })
        .catch((err) => {
            console.log(err);
            postFigma({ type: "NOTIFY", data: "Something went worng, unable to save the file" });
        });
}

window.addEventListener("message", (event) => {
    let message = event.data.pluginMessage;
    if (!message) return;

    switch (message.type) {
        case "PROCESSED_DATA":
            processAndSaveZip(message.data);
            break;
    }
});

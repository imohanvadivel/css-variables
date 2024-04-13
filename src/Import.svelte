<script lang="ts">
    import { parseCSS, postFigma } from "$lib/util.ts";
    import { Button, Label, Radio, Input, Select } from "figblocks";
    // import { localCollections } from "$lib/store.ts";
    import { onMount } from "svelte";
    import Icon from "$lib/import.svg";
    export let variableData;
    export let fileName: string;
    export let variableCount: number;
    export let fileImported = false;
    let localCollections = [];
    let collectionMenu = [];
    let modeMenu = [];

    onMount(() => {
        postFigma({ type: "GET_LOCAL_COLLECTIONS" });

        var fun = (event) => {
            let message = event.data.pluginMessage;
            if (message && message.type === "LOCAL_COLLECTIONS") {
                localCollections = message.data;
                collectionMenu = message.data.map((e, i) => {
                    return {
                        label: e.name,
                        value: e.id,
                        selected: i === 0,
                    };
                });
                modeMenu = message.data[0].modes.map((e, i) => ({ label: e.name, value: e.modeId, selected: i === 0 }));
            }
        };

        window.addEventListener("message", fun);

        return () => {
            window.removeEventListener("message", fun);
        };
    });

    let collectionValue;
    let modeValue;

    function handleMenuChange(event: CustomEvent) {
        let selectedCollection = localCollections.find((e) => e.id === event.detail.value);
        modeMenu = selectedCollection.modes.map((e, i) => ({ label: e.name, value: e.modeId, selected: i === 0 }));
    }

    let inputEl;
    let dragOver = false;
    let importType = "newCollection";
    let collectionName: string;
    let modeName: string;

    function handleFileSelect(ev) {
        ev.preventDefault();
        dragOver = false;
        const fileList = ev.dataTransfer ? ev.dataTransfer.files : ev.target.files;

        // Check if atleast one file is imported
        if (!fileList || fileList.length === 0) return;

        const file = fileList[0];
        fileName = file.name;

        if (file.type !== "text/css") {
            postFigma({ type: "NOTIFY", data: "Only CSS file are supported!" });
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target.result as string;
            variableData = parseCSS(content);

            variableCount = Object.keys(variableData).length;

            // Check for the variable count in the CSS file
            if (variableCount === 0) {
                postFigma({ type: "NOTIFY", data: "The CSS file doesn't have any variables" });
                return;
            }

            fileImported = true; // Changes UI from darg&drop to import form
        };

        reader.readAsText(file);
    }

    function handleImport() {
        if (importType === "newCollection") {
            // Check if collection and mode name exist
            if (!collectionName.trim()) {
                postFigma({ type: "NOTIFY", data: "Please enter the collection name" });
                return;
            }

            if (!modeName.trim()) {
                postFigma({ type: "NOTIFY", data: "Please enter the mode name" });
                return;
            }

            let payload = {
                type: "IMPORT",
                importType: "newCollection",
                collectionName,
                modeName,
                data: variableData,
            };

            postFigma(payload);
        } else if (importType === "existingCollection") {
            // Check if collection and mode name exist
            if (!collectionValue) {
                postFigma({ type: "NOTIFY", data: "Please choose your desired collection" });
                return;
            }

            if (!modeValue) {
                postFigma({ type: "NOTIFY", data: "Please choose a mode" });
                return;
            }

            let payload = {
                type: "IMPORT",
                importType: "existingCollection",
                collectionId: collectionValue.value,
                modeId: modeValue.value,
                data: variableData,
            };
            postFigma(payload);
        }
    }
</script>

{#if fileImported}
    <div class="import-form">
        <div class="file-info">
            <span class="file-name">{fileName}</span>
            <span class="var-cnt">{`${variableCount} ${variableCount === 1 ? "variable" : "variables"}`}</span>
        </div>

        {#if localCollections.length > 0}
            <div class="field-cnt">
                <Label>Import as</Label>
                <Radio bind:group={importType} name="importType" value="newCollection">New collection</Radio>
                <Radio bind:group={importType} name="importType" value="existingCollection">Update existing collection</Radio>
            </div>
        {/if}

        {#if importType === "newCollection"}
            <div class="field-cnt">
                <Label>Collection Name</Label>
                <Input bind:value={collectionName} borders placeholder="eg: semantic-colors" />
            </div>
            <div class="field-cnt">
                <Label>Mode Name</Label>
                <Input bind:value={modeName} borders placeholder="eg: light" />
            </div>
        {:else}
            <div class="field-cnt">
                <Label>Collection</Label>
                <Select
                    on:change={handleMenuChange}
                    bind:menuItems={collectionMenu}
                    bind:value={collectionValue}
                    placeholder="Choose a collection"
                />
            </div>

            <div class="field-cnt">
                <Label>Mode</Label>
                <Select bind:menuItems={modeMenu} bind:value={modeValue} placeholder="Choose a mode" />
            </div>
        {/if}
        <div class="footer">
            <Button on:click={handleImport}>Import Variables</Button>
            <Button variant="secondary" on:click={() => (fileImported = false)}>Cancel</Button>
        </div>
    </div>
{:else}
    <div
        class="wrapper"
        class:drag-over={dragOver}
        on:drop|preventDefault={handleFileSelect}
        on:dragover|preventDefault={() => (dragOver = true)}
        on:dragleave|preventDefault={() => (dragOver = false)}
        role="button"
        tabindex="0"
    >
        <div class="icon">{@html Icon}</div>
        <div class="content">
            <span>Drag & Drop in a CSS file</span>
            <span> or </span>
        </div>
        <input on:change={handleFileSelect} bind:this={inputEl} type="file" accept=".css" style="display: none;" />
        <Button on:click={() => inputEl.click()} variant="tertiary">Choose a file</Button>
    </div>
{/if}

<style>
    .file-info {
        display: flex;
        justify-content: space-between;
        padding-inline: var(--figma-size-xxsmall);
        padding-block: var(--figma-size-xxsmall);
        background-color: var(--figma-color-bg-secondary);
        border-radius: 2px;
        margin-inline: var(--figma-size-xxsmall);
        margin-block-start: var(--figma-size-xxsmall);
        margin-block-end: var(--figma-size-xxxsmall);
    }

    .file-info .var-cnt {
        color: var(--figma-color-text-secondary);
    }

    .file-info .file-name {
        font-weight: var(--font-weight-bold);
        color: var(--figma-color-text);
    }

    .wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: var(--figma-size-xsmall);
        border: 1px dashed var(--figma-color-border);
        background-color: var(--figma-color-bg-secondary);
        border-radius: 4px;
    }

    .wrapper.drag-over {
        border: 1px dashed var(--figma-color-border-brand-strong);
    }

    .field-cnt {
        margin-inline: var(--figma-size-xxsmall);
        margin-block-end: var(--figma-size-xxxsmall);
    }

    .content {
        display: flex;
        flex-direction: column;
        row-gap: 0.75rem;
        align-items: center;
        margin-block-start: var(--figma-size-xsmall);
        color: var(--figma-color-text-secondary);
    }

    .import-form {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .footer {
        display: flex;
        column-gap: var(--figma-size-xxsmall);
        margin-top: auto;
        width: 100%;
        padding-block: var(--figma-size-xsmall);
        padding-inline: var(--figma-size-xsmall);
    }
</style>

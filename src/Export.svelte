<script>
    import { Disclosure, DisclosureItem, Checkbox, Button, Select, Label, Divider, Icon, SectionTitle } from "figblocks";
    import { IconWarningLarge } from "figblocks/icons";
    import { localCollections } from "$lib/store.ts";
    import { postFigma } from "$lib/util.ts";
    $: collections = [...$localCollections];

    let checkboxGroup = [];

    let colorUnitsMenu = [
        { label: "hex", value: "hex", selected: true },
        { label: "rgb", value: "srgb", selected: false },
        { label: "hsl", value: "hsl", selected: false },
        { label: "hwb", value: "hwb", selected: false },
        { label: "lab", value: "lab", selected: false },
        { label: "lch", value: "lch", selected: false },
        { label: "oklab", value: "oklab", selected: false },
        { label: "oklch", value: "oklch", selected: false },
        { label: "display-p3", value: "p3", selected: false },
    ];

    let numberUnitsMenu = [
        { label: "px", value: "px", selected: true },
        { label: "rem", value: "rem", selected: false },
    ];

    let preserveAlias = false;
    let ignoreCodeSyntax = false;

    function sendExports() {
        let colorUnit = colorUnitsMenu.find((c) => c.selected).value;
        let numberUnit = numberUnitsMenu.find((n) => n.selected).value;
        let config = { colorUnit, numberUnit, preserveAlias, ignoreCodeSyntax };

        postFigma({ type: "EXPORTS", value: checkboxGroup, config });
    }
</script>

<div class="wrapper">
    {#if collections.length === 0}
        <div class="message">
            <Icon iconSvg={IconWarningLarge} color="--figma-color-icon-danger" />
            <p>The current file doesn't have any variable collections to export</p>
        </div>
    {:else}
        <section class="collection-list">
            <div class="title">
                <SectionTitle>Select the modes for exporting</SectionTitle>
            </div>
            <Disclosure border={false}>
                {#each collections as collection, i}
                    <DisclosureItem title={collection.name} open={i === 0 ? true : false}>
                        {#each collection.modes as mode}
                            <!-- {@debug mode, checkboxGroup} -->
                            <Checkbox bind:group={checkboxGroup} value={`${collection.id}|${mode.modeId}`}>{mode.name}</Checkbox
                            >
                        {/each}
                    </DisclosureItem>
                {/each}
            </Disclosure>
        </section>

        <footer>
            <div class="pref">
                <Divider />
                <div class="units">
                    <Label>Color unit</Label>
                    <Select bind:menuItems={colorUnitsMenu} />

                    <Label>Number unit</Label>
                    <Select bind:menuItems={numberUnitsMenu} />
                </div>
                <div class="alias">
                    <Checkbox bind:checked={preserveAlias}>Preserve alias</Checkbox>
                    <Checkbox bind:checked={ignoreCodeSyntax}>Ignore code syntax</Checkbox>
                </div>
            </div>
            <div class="button">
                <Button on:click={sendExports}>Export Selected Modes</Button>
            </div>
        </footer>
    {/if}
</div>

<style>
    .wrapper {
        display: flex;
        flex-direction: column;
        /* height: calc(100%  - 41px); */
        height: 100%;
        overflow: hidden;
    }
    .collection-list {
        padding: 0 var(--figma-size-xxxsmall);
        overflow-y: auto;
    }
    .title {
        margin-top: var(--figma-size-xxxsmall);
    }

    .message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        color: var(--figma-color-text);
        padding: var(--figma-size-small);
        padding-block-end: var(--figma-size-xxlarge);
        text-align: center;
        row-gap: var(--figma-size-xxsmall);
    }

    footer {
        margin-top: auto;
        margin-bottom: var(--figma-size-xsmall);
        flex-shrink: 0;
    }
    footer :global(button) {
        width: 100%;
    }
    .units {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: var(--figma-size-xxxsmall);
        padding: var(--figma-size-xxxsmall) var(--figma-size-xxsmall) 0;
    }
    .alias {
        padding-left: var(--figma-size-xxsmall);
    }
    .pref {
        margin-bottom: var(--figma-size-xxsmall);

    }
    .button {
        padding: 0 var(--figma-size-xsmall);
    }
</style>

<script lang="ts">
    import { Tabs, TabItem } from "figblocks";
    import Export from "./Export.svelte";
    import Import from "./Import.svelte";
    let variableData;
    let fileName: string;
    let variableCount: number;
    let fileImported = false;
</script>

<main>
    <Tabs>
        <TabItem title="Import" open>
            <Import bind:variableData bind:fileName bind:variableCount bind:fileImported />
        </TabItem>
        <TabItem title="Export"><Export /></TabItem>
    </Tabs>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
</style>

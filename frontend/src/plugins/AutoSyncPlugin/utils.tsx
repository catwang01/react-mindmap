import { Controller } from "@blink-mind/core";
import { connection } from "./connection";
import { log } from "./log";
import { SyncingStatus } from ".";

export const uploadGraph = async ({ controller, model, callback }) => {
    controller.run('setSyncingStatus', { controller, model, status: "uploading" });
    try 
    {
        const props = { controller, model }
        const version = controller.run('getVersion', props);
        // const parentVersion = controller.run('getParentVersion', props);
        const parentVersion = version;
        const serializedModel = controller.run('serializeModel', props);
        const serializedModelJson = JSON.stringify(serializedModel)
        log(`Pushing to remote with version: ${parentVersion}`)
        await connection.push(serializedModelJson, parentVersion, version);
        log("Auto sync successfully!");
        controller.run('moveVersionForward', { controller, model });
        callback && callback();
    }
    finally
    {
        controller.run('setSyncingStatus', { controller, model, status: "idle" });
    }
}

export interface SyncWithCloudArgs {
    controller: Controller;
    callback?: () => void;
}

export async function syncWithCloud(args: SyncWithCloudArgs): Promise<void> 
{
    const { controller, callback } = args;
    const model = controller.currentModel;
    const syncingStatus: SyncingStatus = controller.run('getSyncingStatus', {
         controller,
         model
    });
    if (syncingStatus !== "idle") {
        log(`Current Syncing status is ${syncingStatus}, skip syncing`)
        return;
    }
    log(`Try to auto-sync at ${new Date()}`, { controller, model });
    if (!model) {
        log("model is null");
        return;
    }
    const remoteGraph = (await connection.pull()).data;

    const version = controller.run('getVersion', { controller, model })

    const parentVersion = controller.run('getParentVersion', { controller, model });
    log("Version informations are:")
    log(JSON.stringify({
        version,
        remoteVersion: remoteGraph?.version,
        parentVersion,
        remoteParentVersion: remoteGraph?.parentVersion
    }, null, 2))

    const upload = async () => await uploadGraph({ controller, model, callback });

    if (remoteGraph === undefined) {
        throw new Error("Failed to get remoteGraph");
    }

    if (remoteGraph === null) {
        log("The remote graph is null. Uploading the local graph.");
        await upload();
        return;
    }

    if (remoteGraph.version === null) {
        log("No remote version or current version");
        await upload();
        return;
    }

    if (remoteGraph.version === version) {
        log("The local graph is the same as the remote graph. No need to upload.");
        return;
    }

    if (remoteGraph.version === parentVersion) {
        log("The local version is ahead of the remote version. Uploading the local graph.");
        await upload();
        return;
    }

    throw new Error(`The remote graph conflicts with the local graph. Please try to take actions to resolve the conflicts!\n\nremote version: ${remoteGraph.version}\nlocal version: ${version}\nremote parent version: ${remoteGraph.parentVersion}\nlocal parent version: ${parentVersion}`);
}
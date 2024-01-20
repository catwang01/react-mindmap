import { connection } from "./connection";
import { log } from "./log";
export { AutoSyncPlugin } from "./plugin";

const uploadGraph = async ({ controller, model, callback }) => {
    controller.run('operation', { controller, model, opType: 'moveVersionForward' });
    const newModel = controller.currentModel;
    const parentVersion = controller.run('getParentVersion', { controller, model: newModel });
    const version = controller.run('getVersion', { controller, model: newModel });
    const serializedModel = controller.run('serializeModel', { controller, model: newModel });
    const serializedModelJson = JSON.stringify(serializedModel)
    await connection.push(serializedModelJson, parentVersion, version);
    log("Auto sync successfully!");
    callback && callback();
}

export async function saveCache({ controller }, callback = () => { }) {
    const model = controller.currentModel;
    log(`Try to auto-sync at ${new Date()}`, { controller, model });
    if (!model) {
        log("model is null");
        return;
    }
    const remoteGraph = (await connection.pull()).data;

    const version = controller.run('getVersion', { controller, model })
    const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model: controller.currentModel });
    log({ remoteGraph, model, version, workingTreeVersion });

    const upload = async () => await uploadGraph({ controller, model, callback });

    if (remoteGraph === undefined) {
        log("Failed to get remoteGraph");
        return;
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
        log("The remote graph is the same as the local graph.")
        if (version === workingTreeVersion) {
            log("No need to push data to the cloud because the working tree is the same.");
        } else {
            log("The local graph is updated based on the remote graph, uploading the local graph");
            await upload();
        }
        return;
    }
    log("The remote graph conflicts with the local graph. Please try to take actions to resolve the conflicts!");
}
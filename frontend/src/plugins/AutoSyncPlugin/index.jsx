// @ts-check
import debug from "debug";
import { DEFAULT_INTERVAL } from "../../constants";
import { DbConnectionFactory } from "../../db/db";
import { md5 } from "../../utils/md5";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";

const log = debug("plugin:AutoSyncPlugin");
const connection = DbConnectionFactory.getDbConnection()

const uploadGraph = async ({ controller, model, callback }) => {
    controller.run('operation', { controller, model, opType: 'moveVersionForward' });
    const newModel = controller.currentModel;
    const parentVersion = controller.run('getParentVersion', { controller, model: newModel });
    const version = controller.run('getVersion', { controller, model: newModel });
    const serializedModel = controller.run('serializeModel', { controller, model: newModel });
    const serializedModelJson = JSON.stringify(serializedModel)
    await connection.push(serializedModelJson, parentVersion, version);
    console.log("Auto sync successfully!");
    callback && callback();
}

async function saveCache({ controller }, callback = () => { }) {

    const model = controller.currentModel;
    console.log(`Try to auto-sync at ${new Date()}`, { controller, model });
    if (!model) {
        console.error("model is null");
        return;
    }
    const remoteGraph = (await connection.pull()).data;

    const version = controller.run('getVersion', { controller, model })
    const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model: controller.currentModel });
    console.log({ remoteGraph, model, version, workingTreeVersion });

    const upload = async () => await uploadGraph({ controller, model, callback });

    if (remoteGraph === undefined) {
        console.log("Failed to get remoteGraph");
        return;
    }

    if (remoteGraph === null) {
        console.log("The remote graph is null. Uploading the local graph.");
        await upload();
        return;
    }

    if (remoteGraph.version === null) {
        console.log("No remote version or current version");
        await upload();
        return;
    }
    if (remoteGraph.version === version) {
        console.log("The remote graph is the same as the local graph.")
        if (version === workingTreeVersion) {
            console.log("No need to push data to the cloud because the working tree is the same.");
        } else {
            console.log("The local graph is updated based on the remote graph, uploading the local graph");
            await upload();
        }
        return;
    }
    console.error("The remote graph conflicts with the local graph. Please try to take actions to resolve the conflicts!");
}

export function AutoSyncPlugin() {
    return {
        getOpMap(props, next) {
            const opMap = next();
            opMap.set("moveVersionForward", ({ controller, model }) => {
                const version = controller.run('getVersion', { controller, model });
                const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model });
                const newModel = model.setIn(["extData", "versionInfo", 'parentVersion'], version)
                    .setIn(["extData", "versionInfo", 'version'], workingTreeVersion);
                return newModel;
            });
            return opMap;
        },

        getParentVersion({ controller, model }) {
            const parentVersion = model.getIn(['extData', 'versionInfo', 'parentVersion'], null);
            return parentVersion;
        },

        getWorkingTreeVersion({ controller, model }) {
            const serializedModel = controller.run("serializeModel", { controller, model });
            delete serializedModel.extData.versionInfo;
            const jsonStr = JSON.stringify(serializedModel);
            const version = md5(jsonStr);
            return version;
        },

        getVersion({ controller, model }) {
            return model.getIn(['extData', 'versionInfo', 'version'], null)
                ?? controller.run('getWorkingTreeVersion', { controller, model });
        },

        startRegularJob(props, next) {
            const res = retrieveResultFromNextNode(next)

            // autoSave per 60s
            const autoSyncModel = () => setInterval(() => saveCache(props).then(res => { }), DEFAULT_INTERVAL);
            res.push({
                funcName: autoSyncModel.name,
                func: autoSyncModel
            });
            return res;
        },

        deserializeExtData: (props, next) => {
            next();
            const { extData } = props;
            if (!extData?.versionInfo) {
                extData.versionInfo = {
                    version: '000000000',
                    parentVersion: '000000000',
                }
            }
            return null;
        }
    }
}
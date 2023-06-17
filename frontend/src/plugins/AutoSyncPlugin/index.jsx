// @ts-check
import debug from "debug";
import DBConnection from "../../db/db";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";

const log = debug("plugin:AutoSyncPlugin");
const connection = new DBConnection();

function saveCache(props, callback = () => { }) {
    const { controller, model } = props;
    log(`Auto-Save at ${new Date()}`, { controller, model });
    if (model) {
        const serializedModel = controller.run('serializeModel', { controller, model });
        const serializedModelJson = JSON.stringify(serializedModel);
        connection.push(serializedModelJson)
        callback();
    }
}

export function AutoSyncPlugin() {
    return {
        startRegularJob(props, next) {
            const res = retrieveResultFromNextNode(next)

            // autoSave per 60s
            const autoSyncModel = () => setInterval(() => saveCache(props), 60000);
            res.push({
                funcName: autoSyncModel.name,
                func: autoSyncModel
            });
            return res;
        }
    }
}

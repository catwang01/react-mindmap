import { Model } from '@blink-mind/core';
import { Button } from "@blueprintjs/core";
import { md5, ms } from "../../utils";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";
import { OpType } from "./opType";
import { OpTypeMapping, UpdateSyncStatusProps } from './operationMapping';
import { saveCache } from "./utils";

// export interface SyncComponentArgs {
//     lastSyncTime: Date | null;
// }

// export const SyncComponent = (props: SyncComponentArgs) => {
//     const { lastSyncTime } = props;
//     const text = lastSyncTime ? `last sync at: ${lastSyncTime}` : "not synced yet";
//     return <div>
//         <Button>
//             {text}
//         </Button>
//     </div>
// }

export interface SyncStatus {
    lastSyncTime: Date | null;
    status: string;
}

export interface GetSyncStatusProps {
    model: Model;
}

export function AutoSyncPlugin() {

    return {
        getSyncStatus(props: GetSyncStatusProps): SyncStatus {
            const { model } = props;
            const syncStatus = model.getIn(['extData', 'syncStatus'], {});
            return syncStatus;
        },

        // renderLeftBottomCorner(props, next) {
        //     const res = retrieveResultFromNextNode(next);
        //     const { controller, model } = props;
        //     const { lastSyncTime } = controller.run('getSyncStatus', { model });
        //     res.push(<SyncComponent lastSyncTime={lastSyncTime} />)
        //     return res;
        // },

        getOpMap(props, next) {
            const opMap = next();
            return new Map([...opMap, ...OpTypeMapping]);
        },

        getParentVersion({ controller, model }) {
            const parentVersion = model.getIn(['extData', 'versionInfo', 'parentVersion'], null);
            return parentVersion;
        },

        getWorkingTreeVersion({ controller, model }) {
            const serializedModel = controller.run(
                "serializeModel",
                { controller, model }
            );
            delete serializedModel.extData.versionInfo;
            delete serializedModel.extData.syncStatus;
            const jsonStr = JSON.stringify(serializedModel);
            const version = md5(jsonStr);
            return version;
        },

        getVersion({ controller, model }) {
            return model.getIn(['extData', 'versionInfo', 'version'], null)
                ?? controller.run('getWorkingTreeVersion', { controller, model });
        },

        startRegularJob(props, next) {
            const { model, controller } = props;
            const res = retrieveResultFromNextNode(next);

            // autoSave per 60s
            const autoSyncModel = () => setInterval(
                () => saveCache(props)
                    .then(res => {
                        const updateSyncStatusProps: UpdateSyncStatusProps = {
                            syncTime: new Date(),
                            status: 'synced',
                            model,
                            controller
                        }
                        controller.run('operation', {
                            opType: OpType.UPDATE_SYNC_STATUS,
                            controller,
                            ...updateSyncStatusProps
                        });
                    })
                    .catch(e => console.error(`AutoSync failed! Error Message: ${e.message}`))
                , ms("15 seconds")
            );
            res.push({
                funcName: autoSyncModel.name,
                func: autoSyncModel
            });
            return res;
        },

        deserializeExtData: (props, next) => {
            const res = next();
            if (res !== null) return res;
            let { extData } = props;
            extData = extData ?? {};
            if (!extData?.versionInfo) {
                extData.versionInfo = {
                    version: '000000000',
                    parentVersion: '000000000',
                };
            }
            if (!extData?.syncStatus) {
                extData.syncStatus = {}
            } else {
                if (typeof extData.syncStatus.lastSyncTime === 'string') {
                    extData.syncStatus.lastSyncTime = new Date(extData.syncStatus.lastSyncTime);
                }
            }
            return null;
        }
    };
}
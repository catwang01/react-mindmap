import { Model } from '@blink-mind/core';
import { md5, ms } from "../../utils";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";
import { OpType } from "./opType";
import { OpTypeMapping, UpdateSyncStatusProps } from './operationMapping';
import { syncWithCloud } from "./utils";
import { log } from './log';

export type Version = string | null;

// the version is calculated on the fly and shouldn't be stored into the grpah
// the parent version is saved to the plugin and also shouldn't be stored into the graph

export interface SyncStatus {
    lastSyncTime: Date | null;
    status: string;
}

export interface GetSyncStatusProps {
    model: Model;
}

export type SyncingStatus = "uploading" | "downloading" | "idle";

export function AutoSyncPlugin() {

    let syncingStatus: SyncingStatus = "idle";

    let parentVersion: Version = null;

    return {
        getSyncStatus(props: GetSyncStatusProps): SyncStatus {
            const { model } = props;
            const syncStatus = model.getIn(['extData', 'syncStatus'], {});
            return syncStatus;
        },

        getSyncingStatus({ controller, model }): SyncingStatus {
            return syncingStatus;
        },

        setSyncingStatus({ controller, model, status }): void {
            syncingStatus = status;
        },

        getOpMap(props, next) {
            const opMap = next();
            return new Map([...opMap, ...OpTypeMapping]);
        },

        setVersion({controller, model, version})
        {
            log(`set parent version from ${parentVersion} to ${version}`);
            parentVersion = version;
        },

        moveVersionForward: ({ controller, model }) => {
            const oldVersion = parentVersion;
            const version = controller.run('getVersion', { controller, model });
            controller.run('setVersion', { controller, model, version });
            log(`moveVersionForward from ${oldVersion} to ${version}`);
        },

        getParentVersion({ controller, model }): Version  {
            return parentVersion;
        },

        getVersion({ controller, model }): Version {
            const serializedModel = controller.run(
                "serializeModel",
                { controller, model }
            );
            // exclude properties
            delete serializedModel.editorRootTopicKey;
            delete serializedModel.focusKey;
            delete serializedModel.rootTopicKey;
            delete serializedModel.extData.syncStatus;
            delete serializedModel.extData.versionInfo;
            serializedModel?.topics?.forEach(x => delete x.collapse)
            const jsonStr = JSON.stringify(serializedModel);
            const version = md5(jsonStr);
            return version;
        },

        startRegularJob(props, next) {
            const { model, controller } = props;
            const res = retrieveResultFromNextNode(next);

            // autoSave per 60s
            const autoSyncModel = () => setInterval(
                () => syncWithCloud(props)
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
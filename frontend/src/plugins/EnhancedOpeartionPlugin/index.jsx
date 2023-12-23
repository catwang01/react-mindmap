import { empty } from "../../utils";
import { log } from "./log";

export function EnhancedOperationPlugin() {
    return {
        // enable adhoc allowUndo
        getAllowUndo(props, next) {
            const { allowUndo } = props;
            if (!empty(allowUndo)) {
                return allowUndo;
            }
            return next();
        },
        canUndo(props) {
            const { controller } = props;
            const { undoStack } = controller.run('getUndoRedoStack', props);
            return undoStack.size > 0;
        },
        canRedo(props) {
            const { controller } = props;
            const { redoStack } = controller.run('getUndoRedoStack', props);
            return redoStack.size > 0;
        },
        undo(props) {
            const { controller, model } = props;
            if (!controller.run('canUndo', props)) {
                return;
            }
            const { undoStack, redoStack } = controller.run(
                'getUndoRedoStack',
                props
            );
            const newModel = undoStack.peek();
            if (!newModel) return;
            controller.run('setUndoStack', {
                ...props,
                undoStack: undoStack.shift()
            });
            controller.run('setRedoStack', {
                ...props,
                redoStack: redoStack.push(model)
            });
            log(newModel);
            controller.change(newModel);
        },

        redo(props) {
            const { controller, model } = props;
            if (!controller.run('canRedo', props)) {
                return;
            }
            const { undoStack, redoStack } = controller.run(
                'getUndoRedoStack',
                props
            );
            const newModel = redoStack.peek();
            if (!newModel) return;
            controller.run('setUndoStack', {
                ...props,
                undoStack: undoStack.push(model)
            });
            controller.run('setRedoStack', {
                ...props,
                redoStack: redoStack.shift()
            });
            controller.change(newModel);
        },
    }
}
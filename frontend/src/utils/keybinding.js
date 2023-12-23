function op(opType, props) {
    const { topicKey, model, controller } = props;
    if (topicKey === undefined) {
        props = { ...props, topicKey: model.focusKey };
    }
    if (Array.isArray(opType)) {
        const opArray = opType.map(x => { return { ...props, opType: x } })
        controller.run('operation', { ...props, opArray });
    } else {
        controller.run('operation', { ...props, opType });
    }
}

export const handleHotKeyDown = (opType, props) => e => {
    op(opType, props)
    e.stopImmediatePropagation();
    e.preventDefault();
};

export const invokeMiddleWareOnKeyDown = (middleware, props) => (e) => {
  const { controller } = props;
  controller.run(middleware, props)
  e.stopImmediatePropagation();
  e.preventDefault();
}
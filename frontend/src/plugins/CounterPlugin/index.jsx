import React from "react";
import { Button } from "@blueprintjs/core";

const CounterButton = (props) => {
  const { controller, model } = props;
  const nTopics = controller.run('getAllTopicCount', { model })
  const buttonProps = {
    style: { height: "40px" },
    disable: "true"
  }
  return <div>
    <Button {...buttonProps}> {nTopics} nodes</Button>
  </div>;
}

export function CounterPlugin() {
  return {
    getAllTopicCount: (props) => {
      const { model } = props;
      console.log('getAllTopicCount:', { model })
      return model.topics.size;
    },
    renderLeftBottomCorner: (props, next) => {
      const res = next ? next() ?? [] : []
      res.push(<CounterButton {...props} />)
      return res;
    }
  }
}
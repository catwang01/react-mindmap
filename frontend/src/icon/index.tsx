import React from "react";

export function iconClassName(name) {
  return `iconfont icon-${name}`;
}

export interface IconProps {
  iconName: string
}

export function Icon({ iconName }: IconProps) {
  return <span className={ iconClassName(iconName) } />;
}
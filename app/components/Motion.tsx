"use client";

import { motion } from "motion/react";
import type { ElementType } from "react";
import { createElement, forwardRef, useLayoutEffect, useRef } from "react";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";

const motionPropNames = new Set([
  "initial",
  "animate",
  "exit",
  "whileHover",
  "whileTap",
  "whileInView",
  "viewport",
  "variants",
  "transition",
  "layout",
  "layoutId",
  "layoutRoot",
  "layoutScroll",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "dragListener",
  "dragPropagation",
  "dragControls",
  "dragDirectionLock",
  "dragSnapToOrigin",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDrag",
  "onDragStart",
  "onDragEnd",
  "onDragTransitionEnd",
  "onViewportEnter",
  "onViewportLeave",
  "onLayoutAnimationStart",
  "onLayoutAnimationComplete",
]);

function stripMotionProps(props: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!motionPropNames.has(key)) {
      next[key] = props[key];
    }
  }
  return next;
}

type TagName = keyof HTMLElementTagNameMap;

function createMotionComponent(tag: TagName, MotionTag: ElementType) {
  const Component = forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
    const shouldAnimate = useAnimationsEnabled();
    const innerRef = useRef<HTMLElement | null>(null);
    const styleProp = props.style as Record<string, unknown> | undefined;
    const setRef = (node: HTMLElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useLayoutEffect(() => {
      if (shouldAnimate) {
        return;
      }
      const node = innerRef.current;
      if (!node) {
        return;
      }
      if (!styleProp || styleProp.opacity === undefined) {
        node.style.removeProperty("opacity");
      }
      if (!styleProp || styleProp.transform === undefined) {
        node.style.removeProperty("transform");
        node.style.removeProperty("transform-origin");
      }
      node.style.removeProperty("will-change");
    }, [shouldAnimate, styleProp]);

    if (!shouldAnimate) {
      const safeProps = stripMotionProps(props);
      return createElement(tag, { ...safeProps, ref: setRef });
    }
    return createElement(MotionTag, { ...props, ref: setRef });
  });
  Component.displayName = `Motion.${String(tag)}`;
  return Component;
}

export const M = {
  div: createMotionComponent("div", motion.div),
  a: createMotionComponent("a", motion.a),
  h1: createMotionComponent("h1", motion.h1),
  p: createMotionComponent("p", motion.p),
  header: createMotionComponent("header", motion.header),
  span: createMotionComponent("span", motion.span),
  button: createMotionComponent("button", motion.button),
};

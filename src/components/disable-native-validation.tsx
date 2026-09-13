"use client";

import { useEffect } from "react";

const constraintAttrs = ["required", "minLength", "maxLength", "min", "max", "pattern", "step"];

function disarm(root: ParentNode = document) {
  root.querySelectorAll("form").forEach((form) => {
    form.noValidate = true;
  });

  root.querySelectorAll("input, textarea, select").forEach((field) => {
    const element = field as HTMLInputElement;
    element.required = false;
    for (const name of constraintAttrs) {
      element.removeAttribute(name);
    }
  });

  root.querySelectorAll("button[type='submit'], input[type='submit']").forEach((button) => {
    button.setAttribute("formNoValidate", "true");
  });
}

export function DisableNativeValidation() {
  useEffect(() => {
    function onInvalid(event: Event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    disarm();
    document.addEventListener("invalid", onInvalid, true);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) disarm(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      observer.disconnect();
    };
  }, []);

  return null;
}

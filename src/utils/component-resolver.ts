import { Component, COMPONENTS } from "../config/components.js";

/**
 * Finds a component by name (case-insensitive)
 */
export function findComponentByName(name: string): Component | undefined {
  return COMPONENTS.find(
    (component) => component.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Validates component names and returns found components with any invalid names
 */
export function validateComponentNames(componentNames: string[]): {
  validComponents: Component[];
  invalidNames: string[];
} {
  const validComponents: Component[] = [];
  const invalidNames: string[] = [];

  for (const name of componentNames) {
    const component = findComponentByName(name);
    if (component) {
      validComponents.push(component);
    } else {
      invalidNames.push(name);
    }
  }

  return { validComponents, invalidNames };
}

/**
 * Resolves all required components for a given set of components
 * Returns a flattened list with no duplicates, in the correct order
 */
export function resolveRequiredComponents(
  componentNames: string[]
): Component[] {
  const resolvedComponents = new Map<string, Component>();
  const visited = new Set<string>();

  function resolveComponent(componentName: string): void {
    if (visited.has(componentName)) {
      return; // Avoid circular dependencies
    }

    visited.add(componentName);

    const component = COMPONENTS.find((c) => c.name === componentName);
    if (!component) {
      throw new Error(`Component "${componentName}" not found`);
    }

    // First, resolve all required components recursively
    if (component.requiredComponents) {
      for (const requiredName of component.requiredComponents) {
        resolveComponent(requiredName);
      }
    }

    // Then add this component
    resolvedComponents.set(componentName, component);
  }

  // Resolve all requested components
  for (const componentName of componentNames) {
    resolveComponent(componentName);
  }

  return Array.from(resolvedComponents.values());
}

/**
 * Gets a list of component names that will be installed (including required ones)
 */
export function getInstallationList(componentNames: string[]): {
  requested: string[];
  required: string[];
  total: Component[];
} {
  const allComponents = resolveRequiredComponents(componentNames);
  const requestedSet = new Set(componentNames);

  const requested = allComponents
    .filter((c) => requestedSet.has(c.name))
    .map((c) => c.name);

  const required = allComponents
    .filter((c) => !requestedSet.has(c.name))
    .map((c) => c.name);

  return {
    requested,
    required,
    total: allComponents,
  };
}

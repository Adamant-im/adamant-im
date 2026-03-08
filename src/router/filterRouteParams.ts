import type { RouteParamsGeneric, RouteParamsRawGeneric } from 'vue-router'

const ROUTE_PARAM_NAME_PATTERN = /:([A-Za-z0-9_]+)/g

const isRouteParamValueRaw = (value: unknown): value is RouteParamsRawGeneric[string] => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    (Array.isArray(value) &&
      value.every((item) => typeof item === 'string' || typeof item === 'number'))
  )
}

export const filterRouteParams = (
  targetPath: string,
  currentParams: RouteParamsGeneric
): RouteParamsRawGeneric => {
  const allowedParams = new Set(
    Array.from(targetPath.matchAll(ROUTE_PARAM_NAME_PATTERN), ([, paramName]) => paramName)
  )

  const filteredParams: RouteParamsRawGeneric = {}

  for (const [paramName, paramValue] of Object.entries(currentParams)) {
    if (allowedParams.has(paramName) && isRouteParamValueRaw(paramValue)) {
      filteredParams[paramName] = paramValue
    }
  }

  return filteredParams
}

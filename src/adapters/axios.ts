import { serialize } from '../core/serialize';
import type { SerializeOptions } from '../core/types';
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const hasBody = (method?: string): boolean => {
  const normalized = method?.toUpperCase();
  return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE';
};

const hasContentType = (headers: InternalAxiosRequestConfig['headers']): boolean => {
  if (!headers) {
    return false;
  }

  const entries = Object.entries(headers as Record<string, unknown>);
  return entries.some(([key]) => key.toLowerCase() === 'content-type');
};

const setContentType = (
  config: InternalAxiosRequestConfig,
  value: string
): InternalAxiosRequestConfig => {
  const headers = (config.headers ?? {}) as Record<string, unknown>;

  if (!hasContentType(config.headers)) {
    headers['Content-Type'] = value;
  }

  config.headers = headers as InternalAxiosRequestConfig['headers'];
  return config;
};

export const serializeAxiosConfig = (
  config: AxiosRequestConfig,
  options?: SerializeOptions
): AxiosRequestConfig => {
  if (!hasBody(config.method) || config.data === undefined) {
    return config;
  }

  const result = serialize(config.data, options);
  const nextConfig: AxiosRequestConfig = {
    ...config,
    data: result.body
  };

  if (result.contentType) {
    const headers = (nextConfig.headers ?? {}) as Record<string, unknown>;

    const hasCT = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
    if (!hasCT) {
      headers['Content-Type'] = result.contentType;
    }

    nextConfig.headers = headers as AxiosRequestConfig['headers'];
  }

  return nextConfig;
};

export const attachAxiosSerializer = (
  instance: AxiosInstance,
  options?: SerializeOptions
): (() => void) => {
  const id = instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!hasBody(config.method) || config.data === undefined) {
      return config;
    }

    const result = serialize(config.data, options);
    config.data = result.body;

    if (result.contentType) {
      return setContentType(config, result.contentType);
    }

    return config;
  });

  return () => {
    instance.interceptors.request.eject(id);
  };
};

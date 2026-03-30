import type { CSRequest, BGResponse, PortStartMessage, PortMessage } from '@/shared/types';

type Handler = (
  request: CSRequest,
  sendResponse: (response: BGResponse) => void,
) => void | Promise<void>;

type PortHandler = (
  request: PortStartMessage,
  port: chrome.runtime.Port,
) => void | Promise<void>;

const handlers = new Map<string, Handler>();
const portHandlers = new Map<string, PortHandler>();

export function registerHandler(type: string, handler: Handler): void {
  handlers.set(type, handler);
}

export function registerPortHandler(type: string, handler: PortHandler): void {
  portHandlers.set(type, handler);
}

export function startRouter(): void {
  chrome.runtime.onMessage.addListener((request: CSRequest, _sender, sendResponse) => {
    const handler = handlers.get(request.type);
    if (!handler) {
      sendResponse({ type: 'ERROR', message: `Unknown request type: ${request.type}`, code: 'UNKNOWN_TYPE' });
      return false; // synchronous
    }

    handler(request, sendResponse);
    return true; // keep channel open for async response
  });

  chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
    port.onMessage.addListener((msg: PortStartMessage) => {
      const handler = portHandlers.get(msg.type);
      if (!handler) {
        port.postMessage({ type: 'ERROR', message: `Unknown port request type: ${msg.type}`, code: 'UNKNOWN_TYPE' });
        return;
      }
      handler(msg, port);
    });
  });
}

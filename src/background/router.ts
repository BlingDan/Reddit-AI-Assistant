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

const VALID_HANDLER_TYPES = new Set<string>();
const VALID_PORT_TYPES = new Set<string>();

export function registerHandler(type: string, handler: Handler): void {
  handlers.set(type, handler);
  VALID_HANDLER_TYPES.add(type);
}

export function registerPortHandler(type: string, handler: PortHandler): void {
  portHandlers.set(type, handler);
  VALID_PORT_TYPES.add(type);
}

function validateMessageShape(msg: unknown): { type: string; valid: boolean } {
  if (typeof msg !== 'object' || msg === null) return { type: '', valid: false };
  const type = (msg as Record<string, unknown>).type;
  if (typeof type !== 'string') return { type: '', valid: false };
  return { type, valid: true };
}

export function startRouter(): void {
  chrome.runtime.onMessage.addListener((request: unknown, _sender, sendResponse) => {
    const { type, valid } = validateMessageShape(request);
    if (!valid || !VALID_HANDLER_TYPES.has(type)) {
      sendResponse({ type: 'ERROR', message: `Unknown request type: ${type || 'missing'}`, code: 'UNKNOWN_TYPE' });
      return false;
    }

    const handler = handlers.get(type)!;
    handler(request as CSRequest, sendResponse);
    return true; // keep channel open for async response
  });

  chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
    port.onMessage.addListener((msg: unknown) => {
      const { type, valid } = validateMessageShape(msg);
      if (!valid || !VALID_PORT_TYPES.has(type)) {
        port.postMessage({ type: 'ERROR', message: `Unknown port request type: ${type || 'missing'}`, code: 'UNKNOWN_TYPE' } as PortMessage);
        return;
      }
      const handler = portHandlers.get(type)!;
      handler(msg as PortStartMessage, port);
    });
  });
}

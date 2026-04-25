import { Type } from "typebox";
import type { Static } from "typebox";

export const AuthMessageSchema = Type.Object({
  type: Type.Literal("AUTH"),
  token: Type.String(),
});

export const PingMessageSchema = Type.Object({
  type: Type.Literal("PING"),
});

export const PongMessageSchema = Type.Object({
  type: Type.Literal("PONG"),
  timestamp: Type.Optional(Type.Number()),
});

export const CheckConnectionMessageSchema = Type.Object({
  type: Type.Literal("CHECK_CONNECTION"),
});

export const OpenCanvasMessageSchema = Type.Object({
  type: Type.Literal("OPEN_CANVAS"),
  url: Type.Optional(Type.String()),
  requestId: Type.Optional(Type.Number()),
});

export const CanvasReadyMessageSchema = Type.Object({
  type: Type.Literal("CANVAS_READY"),
  url: Type.String(),
  requestId: Type.Optional(Type.Number()),
});

export const CanvasErrorMessageSchema = Type.Object({
  type: Type.Literal("CANVAS_ERROR"),
  reason: Type.String(),
  requestId: Type.Optional(Type.Number()),
});

export const CanvasTimeoutMessageSchema = Type.Object({
  type: Type.Literal("CANVAS_TIMEOUT"),
  url: Type.Optional(Type.String()),
  requestId: Type.Optional(Type.Number()),
});

export const SessionReplacedMessageSchema = Type.Object({
  type: Type.Literal("SESSION_REPLACED"),
  reason: Type.String(),
});

export const ProtocolMessageSchema = Type.Union([
  AuthMessageSchema,
  PingMessageSchema,
  PongMessageSchema,
  CheckConnectionMessageSchema,
  OpenCanvasMessageSchema,
  CanvasReadyMessageSchema,
  CanvasErrorMessageSchema,
  CanvasTimeoutMessageSchema,
  SessionReplacedMessageSchema,
]);

export const HostMessageSchema = Type.Union([
  PongMessageSchema,
  CanvasReadyMessageSchema,
  CanvasErrorMessageSchema,
  CanvasTimeoutMessageSchema,
  SessionReplacedMessageSchema,
]);

export const ConnectionResultSchema = Type.Object({
  connected: Type.Boolean(),
  error: Type.Optional(Type.String()),
});

export type AuthMessage = Static<typeof AuthMessageSchema>;
export type PingMessage = Static<typeof PingMessageSchema>;
export type PongMessage = Static<typeof PongMessageSchema>;
export type CheckConnectionMessage = Static<typeof CheckConnectionMessageSchema>;
export type OpenCanvasMessage = Static<typeof OpenCanvasMessageSchema>;
export type CanvasReadyMessage = Static<typeof CanvasReadyMessageSchema>;
export type CanvasErrorMessage = Static<typeof CanvasErrorMessageSchema>;
export type CanvasTimeoutMessage = Static<typeof CanvasTimeoutMessageSchema>;
export type SessionReplacedMessage = Static<typeof SessionReplacedMessageSchema>;
export type ProtocolMessage = Static<typeof ProtocolMessageSchema>;
export type HostMessage = Static<typeof HostMessageSchema>;
export type ConnectionResult = Static<typeof ConnectionResultSchema>;

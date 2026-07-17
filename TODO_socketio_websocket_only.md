# Socket.IO WebSocket-only (No polling)

## Steps
- [x] Update client socket init to force WebSocket only (`transports: ['websocket']`, disable upgrade).
- [x] Update server Socket.IO options to prevent upgrades related to polling (`allowUpgrades: false`).
- [x] Verify by running client/server and checking browser devtools for absence of polling requests.

- [ ] (Optional) Add quick logging/guardrails to detect transport fallbacks.



/**
 * Journal Chat v2 - State Controller.
 *
 * Single source of truth for the Chat Canvas UI state (see journal-chat-ui.js
 * for the DOM layer that consumes it). Every transition goes through
 * `transition()`; no other module mutates state directly.
 *
 * Also owns the one-timer-per-request / request-identity-guard machinery so
 * a response that arrives after teardown, dismissal, or supersession by a
 * newer request can never touch the DOM.
 */
(function () {
    "use strict";

    const STATES = Object.freeze({
        IDLE: "IDLE",
        FOCUS: "FOCUS",
        COMPOSING: "COMPOSING",
        SUBMITTING: "SUBMITTING",
        THINKING: "THINKING",
        ANSWER: "ANSWER",
        FOLLOW_UP: "FOLLOW_UP",
        OFFLINE_SEARCH: "OFFLINE_SEARCH",
        QUOTA_LIMITED: "QUOTA_LIMITED",
        CLIENT_INPUT_LIMIT: "CLIENT_INPUT_LIMIT",
        TOKEN_LIMITED: "TOKEN_LIMITED",
        TIMEOUT: "TIMEOUT",
        ERROR: "ERROR"
    });

    function createJournalChatController() {
        let state = STATES.IDLE;
        let generation = 0;
        let mounted = true;
        let activeTimer = null;
        let activeAbort = null;
        const listeners = new Set();

        function emit() {
            listeners.forEach((fn) => {
                try {
                    fn(state);
                } catch (_err) {
                    // A listener throwing must never break the controller itself.
                }
            });
        }

        function transition(next, detail) {
            if (!mounted) return;
            state = next;
            emit(detail);
        }

        function clearActiveTimer() {
            if (activeTimer !== null) {
                clearTimeout(activeTimer);
                activeTimer = null;
            }
        }

        /**
         * Starts exactly one timer + one AbortController for a new request,
         * superseding whatever request (if any) was previously in flight.
         * Returns the signal to pass into fetch and the generation number the
         * caller must present back to isCurrent()/endRequest() before acting
         * on a result - this is what makes a late response a no-op once a
         * newer request has started, the controller was torn down, or the
         * user dismissed the request.
         */
        function beginRequest(timeoutMs) {
            clearActiveTimer();
            if (activeAbort) activeAbort.abort();

            generation += 1;
            const requestGeneration = generation;
            activeAbort = new AbortController();
            activeTimer = setTimeout(() => {
                if (requestGeneration !== generation) return;
                activeAbort.abort();
            }, timeoutMs);

            return { signal: activeAbort.signal, requestGeneration: requestGeneration };
        }

        function isCurrent(requestGeneration) {
            return mounted && requestGeneration === generation;
        }

        function endRequest(requestGeneration) {
            if (requestGeneration === generation) clearActiveTimer();
        }

        /**
         * UI-dismissal only. This never claims a server-side cancellation
         * beyond what AbortSignal genuinely achieves - it supersedes the
         * request's generation (so any late response is ignored) and aborts
         * the in-flight fetch if one exists.
         */
        function dismiss() {
            generation += 1;
            clearActiveTimer();
            if (activeAbort) activeAbort.abort();
        }

        function teardown() {
            dismiss();
            mounted = false;
            listeners.clear();
        }

        return {
            STATES: STATES,
            get state() {
                return state;
            },
            get isMounted() {
                return mounted;
            },
            subscribe: function (fn) {
                listeners.add(fn);
                return function unsubscribe() {
                    listeners.delete(fn);
                };
            },
            transition: transition,
            beginRequest: beginRequest,
            isCurrent: isCurrent,
            endRequest: endRequest,
            dismiss: dismiss,
            teardown: teardown
        };
    }

    window.JournalChatController = {
        STATES: STATES,
        create: createJournalChatController
    };
})();

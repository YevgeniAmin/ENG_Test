/**
 * Journal Chat v2 - Chat Canvas UI + Adapter.
 *
 * This is the ONLY file that talks to the DOM for the new unified chat
 * experience. It is also the Adapter described in the approved plan: it
 * reuses (never duplicates or modifies) the existing mechanism already
 * shipped in notebook-simulator.js -
 *
 *   - resolveJournalInsightEndpoint()  (localhost/production URL selection)
 *   - notebookKnowledgeBase            (grounded journal context)
 *   - matchLocalInsight(prompt)        (offline keyword-match algorithm)
 *   - renderMarkdownSafe(text)         (escape-then-build safe renderer)
 *   - GEMINI_REQUEST_TIMEOUT_MS        (the already-approved 8s timeout)
 *
 * notebook-simulator.js's own requestGeminiInsight() collapses every
 * failure into `null`, which is enough for the legacy single-shot flow but
 * not for a UI that needs to tell TIMEOUT apart from a generic failure. So
 * this file issues its own fetch using the exact same URL/body/timeout
 * inputs above, purely to observe that distinction - it does not change
 * the offline-matching algorithm or any server contract.
 *
 * No-ops entirely unless window.JOURNAL_CHAT_CONFIG.v2Enabled is true.
 */
(function () {
    "use strict";

    // Mirrors functions/src/http/journalInsightProxy.js MAX_PROMPT_LENGTH.
    // This is a UX-only pre-check against an already-approved server cap -
    // it does not estimate tokens and is never presented as a Gemini token
    // limit (that distinction is reserved for TOKEN_LIMITED, which only a
    // structured server response may ever trigger - see journal-chat-ui.js
    // handleRequestFailure()).
    var CLIENT_INPUT_MAX_LENGTH = 500;

    function init() {
        var config = window.JOURNAL_CHAT_CONFIG;
        if (!config || config.v2Enabled !== true) return;

        var chatInterface = document.querySelector(".ai-chat-interface");
        if (!chatInterface) {
            console.warn("[JournalChatV2] .ai-chat-interface not found; leaving legacy UI untouched.");
            return;
        }

        var requiredGlobals = [
            "resolveJournalInsightEndpoint",
            "matchLocalInsight",
            "renderMarkdownSafe",
            "escapeHtml"
        ];
        for (var i = 0; i < requiredGlobals.length; i++) {
            if (typeof window[requiredGlobals[i]] !== "function") {
                console.warn(
                    "[JournalChatV2] Required function \"" + requiredGlobals[i] + "\" from notebook-simulator.js " +
                    "is missing; leaving legacy UI untouched."
                );
                return;
            }
        }

        if (!window.JournalChatController) {
            console.warn("[JournalChatV2] JournalChatController not loaded; leaving legacy UI untouched.");
            return;
        }

        mount(chatInterface);
    }

    function mount(chatInterface) {
        var controller = window.JournalChatController.create();
        var STATES = controller.STATES;
        var dom = buildCanvas();
        chatInterface.insertBefore(dom.root, chatInterface.firstChild);
        chatInterface.classList.add("ai-chat-interface--v2-active");

        var lastPromptText = "";

        controller.subscribe(function (state) {
            dom.root.dataset.state = state.toLowerCase();
            renderChip(dom, state);
            renderFallbackActions(dom, state);
            renderComposerAvailability(dom, controller);
        });
        controller.transition(STATES.IDLE);

        dom.textarea.addEventListener("focus", function () {
            if (controller.state === STATES.IDLE) {
                controller.transition(STATES.FOCUS);
            } else if (controller.state === STATES.ANSWER) {
                controller.transition(STATES.FOLLOW_UP);
            }
        });

        dom.textarea.addEventListener("input", function () {
            autoGrow(dom.textarea);
            var text = dom.textarea.value;
            var overLimit = text.length > CLIENT_INPUT_MAX_LENGTH;

            if (overLimit) {
                controller.transition(STATES.CLIENT_INPUT_LIMIT);
            } else if (controller.state === STATES.CLIENT_INPUT_LIMIT) {
                controller.transition(text.trim() ? STATES.COMPOSING : STATES.FOCUS);
            } else if (
                controller.state === STATES.FOCUS ||
                controller.state === STATES.COMPOSING ||
                controller.state === STATES.FOLLOW_UP
            ) {
                controller.transition(text.trim() ? STATES.COMPOSING : STATES.FOCUS);
            }

            dom.sendBtn.disabled = overLimit || text.trim() === "";
        });

        dom.textarea.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
            } else if (event.key === "Escape") {
                if (!isRequestInFlight(controller)) {
                    controller.transition(STATES.IDLE);
                    dom.textarea.blur();
                }
            }
        });

        dom.textarea.addEventListener("blur", function () {
            var text = dom.textarea.value.trim();
            if (!text && !isRequestInFlight(controller) && controller.state !== STATES.ANSWER) {
                controller.transition(STATES.IDLE);
            }
        });

        dom.sendBtn.addEventListener("click", submit);

        dom.retryBtn.addEventListener("click", function () {
            if (!lastPromptText) return;
            hideFallbackActions(dom);
            runRequest(lastPromptText);
        });

        dom.searchJournalBtn.addEventListener("click", function () {
            if (!lastPromptText) return;
            hideFallbackActions(dom);
            controller.transition(STATES.OFFLINE_SEARCH);
            var offlineAnswer = matchLocalInsight(lastPromptText);
            renderAssistantMessage(dom, offlineAnswer, "journal");
            controller.transition(STATES.ANSWER);
        });

        window.addEventListener("beforeunload", function () {
            controller.teardown();
        });
        window.addEventListener("pagehide", function () {
            controller.teardown();
        });

        function submit() {
            var raw = dom.textarea.value;
            var sanitized = raw.replace(/<[^>]*>/g, "").trim();
            if (!sanitized) return; // BASE-005 parity: no request for empty input.
            if (sanitized.length > CLIENT_INPUT_MAX_LENGTH) {
                controller.transition(STATES.CLIENT_INPUT_LIMIT);
                return;
            }
            if (isRequestInFlight(controller)) return; // duplicate-submit guard (CHAT-017)

            lastPromptText = sanitized;
            renderUserMessage(dom, sanitized);
            dom.textarea.value = "";
            autoGrow(dom.textarea);
            hideFallbackActions(dom);
            runRequest(sanitized);
        }

        function runRequest(prompt) {
            controller.transition(STATES.SUBMITTING);

            var timeoutMs = typeof GEMINI_REQUEST_TIMEOUT_MS === "number" ? GEMINI_REQUEST_TIMEOUT_MS : 8000;
            var begun = controller.beginRequest(timeoutMs);
            var requestGeneration = begun.requestGeneration;

            controller.transition(STATES.THINKING);

            fetch(resolveJournalInsightEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    context: Object.values(typeof notebookKnowledgeBase !== "undefined" ? notebookKnowledgeBase : {})
                }),
                signal: begun.signal
            })
                .then(function (response) {
                    if (!controller.isCurrent(requestGeneration)) return;
                    if (!response.ok) {
                        handleRequestFailure(requestGeneration, "http_error");
                        return;
                    }
                    return response.json().then(function (data) {
                        if (!controller.isCurrent(requestGeneration)) return;
                        if (typeof data.response !== "string") {
                            handleRequestFailure(requestGeneration, "malformed_response");
                            return;
                        }
                        renderAssistantMessage(dom, data.response, "gemini");
                        controller.endRequest(requestGeneration);
                        controller.transition(STATES.ANSWER);
                    });
                })
                .catch(function (error) {
                    if (!controller.isCurrent(requestGeneration)) return;
                    if (error && error.name === "AbortError") {
                        handleRequestFailure(requestGeneration, "timeout");
                    } else {
                        handleRequestFailure(requestGeneration, "network_error");
                    }
                });
        }

        function handleRequestFailure(requestGeneration, kind) {
            controller.endRequest(requestGeneration);
            if (kind === "timeout") {
                controller.transition(STATES.TIMEOUT);
            } else {
                controller.transition(STATES.ERROR);
            }
            dom.lastFailureKind = kind;
            showFallbackActions(dom);
        }
    }

    function isRequestInFlight(controller) {
        var s = controller.state;
        return s === controller.STATES.SUBMITTING || s === controller.STATES.THINKING;
    }

    // ==========================================================================
    // DOM construction
    // ==========================================================================

    function buildCanvas() {
        var root = document.createElement("div");
        root.className = "jc-canvas";

        var frame = document.createElement("div");
        frame.className = "jc-frame";
        root.appendChild(frame);

        var header = document.createElement("div");
        header.className = "jc-header";
        frame.appendChild(header);

        var title = document.createElement("span");
        title.className = "jc-header-title";
        title.textContent = "Ask Gemini";
        header.appendChild(title);

        var chip = document.createElement("span");
        chip.className = "jc-status-chip";
        chip.setAttribute("aria-live", "polite");
        header.appendChild(chip);

        var chipDot = document.createElement("span");
        chipDot.className = "jc-status-dot";
        chipDot.setAttribute("aria-hidden", "true");
        var chipText = document.createElement("span");
        chipText.className = "jc-status-text";
        chip.appendChild(chipDot);
        chip.appendChild(chipText);

        var messages = document.createElement("div");
        messages.className = "jc-messages";
        frame.appendChild(messages);

        var fallbackActions = document.createElement("div");
        fallbackActions.className = "jc-fallback-actions";
        fallbackActions.hidden = true;
        frame.appendChild(fallbackActions);

        var retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "jc-action-btn";
        retryBtn.textContent = "Try Gemini again";
        fallbackActions.appendChild(retryBtn);

        var searchJournalBtn = document.createElement("button");
        searchJournalBtn.type = "button";
        searchJournalBtn.className = "jc-action-btn";
        searchJournalBtn.textContent = "Search Journal";
        fallbackActions.appendChild(searchJournalBtn);

        var composer = document.createElement("div");
        composer.className = "jc-composer";
        frame.appendChild(composer);

        var textarea = document.createElement("textarea");
        textarea.className = "jc-textarea";
        textarea.rows = 1;
        textarea.placeholder = "Ask Gemini about my engineering work, methodologies, or active projects...";
        textarea.setAttribute("aria-label", "Journal prompt");
        composer.appendChild(textarea);

        var sendBtn = document.createElement("button");
        sendBtn.type = "button";
        sendBtn.className = "jc-send-btn";
        sendBtn.setAttribute("aria-label", "Send prompt");
        sendBtn.disabled = true;
        sendBtn.textContent = "➔";
        composer.appendChild(sendBtn);

        var hint = document.createElement("p");
        hint.className = "jc-hint";
        frame.appendChild(hint);

        return {
            root: root,
            frame: frame,
            chip: chip,
            chipText: chipText,
            messages: messages,
            fallbackActions: fallbackActions,
            retryBtn: retryBtn,
            searchJournalBtn: searchJournalBtn,
            textarea: textarea,
            sendBtn: sendBtn,
            hint: hint,
            lastFailureKind: null
        };
    }

    function autoGrow(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }

    // ==========================================================================
    // Rendering (state -> DOM). All text passed to innerHTML goes through
    // renderMarkdownSafe()/escapeHtml() from notebook-simulator.js first.
    // ==========================================================================

    var CHIP_COPY = {
        SUBMITTING: { text: "Sending…", tone: "default" },
        THINKING: { text: "Generating response…", tone: "default" },
        OFFLINE_SEARCH: { text: "🔍 Searching your Engineering Journal…", tone: "offline" },
        TIMEOUT: { text: "⚠ Gemini didn't respond in time", tone: "error" },
        ERROR: { text: "⚠ Request failed", tone: "error" },
        QUOTA_LIMITED: { text: "⛔ Gemini request limit reached. Journal Search remains available.", tone: "error" },
        TOKEN_LIMITED: { text: "⛔ That request is too large for Gemini's context limit.", tone: "error" },
        CLIENT_INPUT_LIMIT: { text: "Prompt is too long (max " + CLIENT_INPUT_MAX_LENGTH + " characters)", tone: "warning" }
    };

    function renderChip(dom, state) {
        var copy = CHIP_COPY[state];
        if (!copy) {
            dom.chip.dataset.visible = "false";
            return;
        }
        dom.chip.dataset.visible = "true";
        dom.chip.dataset.tone = copy.tone;
        dom.chip.setAttribute("aria-live", copy.tone === "error" ? "assertive" : "polite");
        dom.chipText.textContent = copy.text;
    }

    function renderFallbackActions(dom, state) {
        var STATES = window.JournalChatController.STATES;
        if (
            state === STATES.TIMEOUT ||
            state === STATES.ERROR ||
            state === STATES.QUOTA_LIMITED ||
            state === STATES.TOKEN_LIMITED
        ) {
            showFallbackActions(dom);
        }
    }

    function showFallbackActions(dom) {
        dom.fallbackActions.hidden = false;
    }

    function hideFallbackActions(dom) {
        dom.fallbackActions.hidden = true;
    }

    function renderComposerAvailability(dom, controller) {
        var busy = isRequestInFlight(controller);
        dom.textarea.readOnly = busy;
        dom.retryBtn.disabled = busy;
        dom.searchJournalBtn.disabled = busy;
        if (!busy) {
            var hasText = dom.textarea.value.trim() !== "";
            var overLimit = dom.textarea.value.length > CLIENT_INPUT_MAX_LENGTH;
            dom.sendBtn.disabled = !hasText || overLimit;
        } else {
            dom.sendBtn.disabled = true;
        }
    }

    function renderUserMessage(dom, text) {
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble--user";
        var body = document.createElement("div");
        body.className = "chat-bubble-content";
        body.textContent = text;
        bubble.appendChild(body);
        dom.messages.appendChild(bubble);
        scrollToLatest(dom);
    }

    var SOURCE_LABELS = {
        gemini: "GEMINI LIVE",
        journal: "JOURNAL SEARCH",
        hybrid: "HYBRID RESPONSE"
    };

    function renderAssistantMessage(dom, text, source) {
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble--assistant";

        var badge = document.createElement("span");
        badge.className = "chat-bubble-badge jc-source-badge";
        badge.dataset.source = source;
        badge.textContent = SOURCE_LABELS[source] || SOURCE_LABELS.journal;
        bubble.appendChild(badge);

        var body = document.createElement("div");
        body.className = "chat-bubble-content";
        body.innerHTML = renderMarkdownSafe(text);
        bubble.appendChild(body);

        dom.messages.appendChild(bubble);
        scrollToLatest(dom);
    }

    function scrollToLatest(dom) {
        var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var lastChild = dom.messages.lastElementChild;
        if (!lastChild) return;

        var containerRect = dom.messages.getBoundingClientRect();
        var childRect = lastChild.getBoundingClientRect();
        var alreadyVisible = childRect.bottom <= containerRect.bottom + 1 && childRect.top >= containerRect.top - 1;
        if (alreadyVisible) return;

        lastChild.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "nearest"
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

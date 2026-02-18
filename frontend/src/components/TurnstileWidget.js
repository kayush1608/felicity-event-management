import React, { useEffect, useRef } from 'react';

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript() {
  if (typeof window === 'undefined') return;
  if (window.turnstile) return;

  const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
  if (existing) return;

  const script = document.createElement('script');
  script.id = TURNSTILE_SCRIPT_ID;
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const hasRenderedRef = useRef(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    if (!siteKey) return;

    loadTurnstileScript();

    const containerEl = containerRef.current;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled) return;
      if (!containerEl) return;
      if (!window.turnstile) return;
      if (hasRenderedRef.current) return;

      containerEl.innerHTML = '';
      widgetIdRef.current = window.turnstile.render(containerEl, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token) => onVerifyRef.current?.(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.()
      });

      hasRenderedRef.current = true;
      clearInterval(interval);
    };

    const interval = setInterval(tryRender, 100);
    tryRender();

    return () => {
      cancelled = true;
      clearInterval(interval);

      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (_) {
        }
      }

      if (containerEl) {
        containerEl.innerHTML = '';
      }

      widgetIdRef.current = null;
      hasRenderedRef.current = false;
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}

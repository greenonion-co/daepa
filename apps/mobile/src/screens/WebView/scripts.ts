/**
 * 줌 방지 및 콘솔 인터셉터 재설정 스크립트 (페이지 로드 후 실행)
 */
export const injectedJsForNoZoom = `
  (function() {
    // viewport meta 태그 설정
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    // 줌 허용/비허용 전환 함수
    window.__setAllowZoom = function(allow) {
      window.__allowZoom = allow;
      if (meta) {
        if (allow) {
          meta.content = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        } else {
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
      }
    };

    // 터치 줌 방지 (window.__allowZoom이 true면 허용)
    document.addEventListener('gesturestart', function(e) {
      if (window.__allowZoom) return;
      e.preventDefault();
    }, { passive: false });

    // 더블탭 줌 방지 (window.__allowZoom이 true면 허용)
    var lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      if (window.__allowZoom) return;
      var now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Next.js hydration 후 console 인터셉터 재설정
    if (window.ReactNativeWebView && !window.__consoleInterceptedAfterLoad) {
      window.__consoleInterceptedAfterLoad = true;
      ['log', 'info', 'warn', 'error'].forEach(function(level) {
        var original = console[level];
        console[level] = function() {
          var args = Array.prototype.slice.call(arguments);
          original.apply(console, args);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOG',
              level: level,
              args: args.map(function(arg) {
                if (arg instanceof Error) {
                  return { message: arg.message, stack: arg.stack };
                }
                try {
                  return JSON.parse(JSON.stringify(arg));
                } catch (e) {
                  return String(arg);
                }
              })
            }));
          } catch (e) {}
        };
      });
    }

    true;
  })();
`;

/**
 * 페이지 로드 전에 실행되는 스크립트 생성 함수
 * @param accessToken - 앱에서 주입할 토큰
 *
 * 단순 덮어쓰기 대신 JWT iat(issued-at)을 비교해 **더 최신 토큰을 보존**.
 * 예: 다른 탭의 WebView가 web refresh로 방금 token_B를 저장했는데,
 *     이 탭이 마운트되며 native의 이전 token_A를 덮어쓰는 race를 방지.
 */
export const createInjectedJavaScriptBeforeContentLoaded = (
  accessToken: string | null,
): string => `
  (function() {
    try {
      // JWT iat (issued-at) 추출 — 실패 시 0 반환 (가장 오래된 것으로 처리)
      function getIat(jwt) {
        if (!jwt || typeof jwt !== 'string') return 0;
        try {
          var parts = jwt.split('.');
          if (parts.length < 2) return 0;
          var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          var pad = payload.length % 4 === 0 ? '' : new Array(5 - (payload.length % 4)).join('=');
          var decoded = atob(payload + pad);
          var iat = JSON.parse(decoded).iat;
          return typeof iat === 'number' ? iat : 0;
        } catch (e) { return 0; }
      }

      var nativeToken = ${accessToken ? JSON.stringify(accessToken) : 'null'};
      var currentWeb = null;
      try { currentWeb = localStorage.getItem('accessToken'); } catch (e) {}

      if (!nativeToken) {
        // native 로그아웃 상태 — 웹도 정리
        try { localStorage.removeItem('accessToken'); } catch (e) {}
      } else if (!currentWeb) {
        // 웹에 토큰 없음 — native 값 주입
        try { localStorage.setItem('accessToken', nativeToken); } catch (e) {}
      } else if (currentWeb !== nativeToken) {
        // 둘 다 있으나 다름 — iat 비교해 더 최신 것 보존
        var nativeIat = getIat(nativeToken);
        var webIat = getIat(currentWeb);
        if (nativeIat >= webIat) {
          try { localStorage.setItem('accessToken', nativeToken); } catch (e) {}
        }
        // web이 더 최신이면 overwrite하지 않음
      }
      // 같으면 write 생략

      // 앱 환경임을 표시
      window.isNativeApp = true;

      // 웹에서 앱으로 메시지 전송하는 헬퍼 함수
      window.sendToApp = function(message) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      };

      // console 로그를 앱으로 전달하는 인터셉터
      if (!window.__consoleIntercepted) {
        window.__consoleIntercepted = true;
        ['log', 'info', 'warn', 'error'].forEach(function(level) {
          var original = console[level];
          console[level] = function() {
            var args = Array.prototype.slice.call(arguments);
            original.apply(console, args);
            try {
              window.sendToApp({
                type: 'LOG',
                level: level,
                args: args.map(function(arg) {
                  if (arg instanceof Error) {
                    return { message: arg.message, stack: arg.stack };
                  }
                  try {
                    return JSON.parse(JSON.stringify(arg));
                  } catch (e) {
                    return String(arg);
                  }
                })
              });
            } catch (e) {}
          };
        });
      }

      // 링크 클릭 가로채기 함수
      function setupLinkInterceptor() {
        if (window.__linkInterceptorSetup) return;
        window.__linkInterceptorSetup = true;

        document.addEventListener('click', function(e) {
          var target = e.target;
          var link = null;

          // closest 대신 직접 탐색 (호환성)
          while (target && target !== document) {
            if (target.tagName === 'A') {
              link = target;
              break;
            }
            target = target.parentNode;
          }

          if (link && link.href) {
            // data-no-intercept 속성이 있으면 가로채기 건너뛰기
            if (link.hasAttribute('data-no-intercept')) {
              return;
            }

            try {
              var url = new URL(link.href, window.location.origin);

              // 같은 origin의 내부 링크만 처리
              if (url.origin === window.location.origin) {
                // 새 탭으로 열기가 아닌 경우에만
                if (link.target !== '_blank') {
                  e.preventDefault();
                  e.stopPropagation();

                  var path = url.pathname + url.search;
                  // 네이티브 앱에서 navigation 처리하도록 메시지만 전송
                  window.sendToApp({ type: 'NAVIGATE', path: path });
                }
              }
            } catch (err) {
              console.error('Link intercept error:', err);
            }
          }
        }, true);
      }

      // DOM 준비 후 링크 인터셉터 설정
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLinkInterceptor);
      } else {
        setupLinkInterceptor();
      }

      // 앱 준비 완료 알림
      window.sendToApp({ type: 'READY' });
    } catch (e) {
      console.error('Injected script error:', e);
    }

    true;
  })();
`;

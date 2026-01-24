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
 */
export const createInjectedJavaScriptBeforeContentLoaded = (
  accessToken: string | null,
): string => `
  (function() {
    try {
      // 앱에서 주입한 토큰을 localStorage에 저장
      var token = ${accessToken ? `'${accessToken}'` : 'null'};
      if (token) {
        localStorage.setItem('accessToken', token);
      }

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

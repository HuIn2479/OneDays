import { APP_CONFIG } from './config';
import { i18n } from './i18n';

interface HitokotoResult {
  content: string;
  url: string | null;
  source: string;
}

interface ApiAdapter {
  buildUrl(apiConfig: ApiConfig): string;
  parseResponse(data: Record<string, unknown>): HitokotoResult;
}

interface ApiConfig {
  url: string;
  categories?: string[];
  params?: Record<string, string>;
}

interface HitokotoConfig {
  provider: string;
  apis: Record<string, ApiConfig>;
  timeout: number;
  retries: number;
  cacheKey: string;
  cacheExpiry: number;
  skeletonDelay: number;
}

const cfg = APP_CONFIG || {};

if (cfg.enableHitokoto === false) {
  const hitokoto = document.getElementById('hitokoto');
  if (hitokoto) hitokoto.remove();
} else {
  const t = i18n?.t || ((k: string) => k);

  const config: HitokotoConfig = {
    provider: cfg.hitokotoProvider || 'hitokoto',
    apis: cfg.hitokotoApis || {
      hitokoto: {
        url: 'https://v1.hitokoto.cn/',
        categories: ['a', 'b', 'd', 'h'],
        params: { encode: 'json' },
      },
    },
    timeout: cfg.hitokotoTimeout || 8000,
    retries: cfg.hitokotoRetries || 2,
    cacheKey: 'hitokoto-cache',
    cacheExpiry: cfg.hitokotoCacheTime || 300000,
    skeletonDelay: cfg.skeletonFadeDelay || 120,
  };

  const adapters: Record<string, ApiAdapter> = {
    hitokoto: {
      buildUrl(apiConfig: ApiConfig): string {
        const params = new URLSearchParams(apiConfig.params || {});
        if (apiConfig.categories) {
          apiConfig.categories.forEach((cat) => params.append('c', cat));
        }
        return (
          apiConfig.url + (params.toString() ? '?' + params.toString() : '')
        );
      },

      parseResponse(data: Record<string, unknown>): HitokotoResult {
        if (!data.hitokoto) throw new Error('Invalid hitokoto response');
        const hitokoto = data.hitokoto as string;
        const from = data.from as string | undefined;
        const from_who = data.from_who as string | undefined;
        const uuid = data.uuid as string | undefined;
        return {
          content: hitokoto + (from ? ` — 「${from_who || from}」` : ''),
          url: uuid ? `https://hitokoto.cn/?uuid=${uuid}` : null,
          source: from_who || from || '伍名',
        };
      },
    },

    custom: {
      buildUrl(apiConfig: ApiConfig): string {
        if (!apiConfig.url) throw new Error('Custom API URL not configured');
        const params = new URLSearchParams(apiConfig.params || {});
        return (
          apiConfig.url + (params.toString() ? '?' + params.toString() : '')
        );
      },

      parseResponse(data: Record<string, unknown>): HitokotoResult {
        let content =
          (data.content as string) || (data.hitokoto as string) || (data.text as string) || (data.sentence as string);
        let source = (data.author as string) || (data.from as string) || (data.from_who as string) || (data.source as string);
        let url = (data.url as string) || (data.link as string);

        if (!content) throw new Error('Invalid custom API response');

        return {
          content: content + (source ? ` — 「${source}」` : ''),
          url: url || null,
          source: source || '伍名',
        };
      },
    },
  };

  const link = document.getElementById('hitokoto_text') as HTMLAnchorElement | null;
  const container = document.getElementById('hitokoto');

  if (link && container) {
    container.hidden = false;

    const currentAdapter = adapters[config.provider];
    if (!currentAdapter) {
      console.error(`[Hitokoto] Unknown provider: ${config.provider}`);
    } else {
      const currentApiConfig = config.apis[config.provider];
      if (!currentApiConfig) {
        console.error(
          `[Hitokoto] API config not found for provider: ${config.provider}`,
        );
      } else {
        const cache = {
          get(): HitokotoResult | null {
            try {
              const cached = localStorage.getItem(config.cacheKey);
              if (!cached) return null;
              const data = JSON.parse(cached);
              if (Date.now() - data.timestamp > config.cacheExpiry) {
                localStorage.removeItem(config.cacheKey);
                return null;
              }
              return data.content;
            } catch (e) {
              return null;
            }
          },
          set(content: HitokotoResult): void {
            try {
              localStorage.setItem(
                config.cacheKey,
                JSON.stringify({
                  content,
                  timestamp: Date.now(),
                }),
              );
            } catch (e) {
              // ignore storage errors
            }
          },
        };

        function removeSkeleton(delay: number = config.skeletonDelay): void {
          if (container.classList.contains('skeleton')) {
            setTimeout(() => {
              container.classList.remove('skeleton');
            }, delay);
          }
        }

        function setHitokoto(content: string, url: string | null = null, isError: boolean = false): void {
          link.textContent = content;
          if (url) {
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          } else {
            link.removeAttribute('href');
            link.removeAttribute('target');
          }

          if (isError) {
            link.style.color = 'var(--fg-mute, #999)';
          } else {
            link.style.color = '';
          }

          removeSkeleton();
        }

        async function fetchHitokoto(attempt: number = 0): Promise<HitokotoResult> {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);

          try {
            const apiUrl = currentAdapter.buildUrl(currentApiConfig);

            const response = await fetch(apiUrl, {
              mode: 'cors',
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
              },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const result = currentAdapter.parseResponse(data);

            cache.set(result);

            return result;
          } catch (error) {
            clearTimeout(timeoutId);

            if ((error as Error).name === 'AbortError') {
              throw new Error('Request timeout');
            }

            if (attempt < config.retries) {
              const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchHitokoto(attempt + 1);
            }

            throw error;
          }
        }

        async function loadHitokoto(): Promise<void> {
          try {
            const cached = cache.get();
            if (cached) {
              setHitokoto(cached.content, cached.url);
              return;
            }

            const result = await fetchHitokoto();
            setHitokoto(result.content, result.url);
          } catch (error) {
            console.warn(
              `[Hitokoto] Failed to load from ${config.provider}:`,
              (error as Error).message,
            );

            let errorMessage: string;
            if ((error as Error).message.includes('timeout')) {
              errorMessage = t('hitokotoTimeout') || '一言加载超时';
            } else if (
              (error as Error).message.includes('network') ||
              (error as Error).message.includes('fetch')
            ) {
              errorMessage = t('hitokotoNetwork') || '网络连接失败';
            } else {
              errorMessage = t('hitokotoError') || '获取一言失败 (离线?)';
            }

            setHitokoto(errorMessage, null, true);
          }
        }

        loadHitokoto();
      }
    }
  }
}

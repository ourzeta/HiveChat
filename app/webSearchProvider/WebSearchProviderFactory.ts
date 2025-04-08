import { WebSearchProvider, WebSearchResponse } from '@/types/search';

import BaseWebSearchProvider from './BaseWebSearchProvider';
import DefaultProvider from './DefaultProvider';
import TavilyProvider from './TavilyProvider';

export default class WebSearchProviderFactory {
  static create(provider: WebSearchProvider): BaseWebSearchProvider {
    switch (provider.id) {
      case 'tavily':
        return new TavilyProvider(provider);
      default:
        return new DefaultProvider(provider);
    }
  }
}
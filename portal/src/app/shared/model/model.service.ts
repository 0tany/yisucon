import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/share';

import { CacheService } from '../cache.service';
import { ApiService } from '../api.service';
import { URLSearchParams, Headers, RequestOptions } from '@angular/http';

export function hashCodeString(str: string): string {
  let hash = 0;
  if (str.length === 0) {
    return hash + '';
  }
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash + '';
}

// domain/feature service
@Injectable()
export class ModelService {
  // This is only one example of one Model depending on your domain
  constructor(public _api: ApiService, public _cache: CacheService) {

  }

  /**
   * whatever domain/feature method name
   */
  get(url, queries?: any, headers?: any) {
    // you want to return the cache if there is a response in it.
    // This would cache the first response so if your API isn't idempotent
    // you probably want to remove the item from the cache after you use it. LRU of 10
    // you can use also hashCodeString here
    let key;
    let options = this.createOptions(queries, headers);
    if (options.search) {
      key = `get-${url}?${options.search.toString()}`;
    } else {
      key = `get-${url}`;
    }

    if (this._cache.has(key)) {
      return Observable.of(this._cache.get(key));
    }

    // you probably shouldn't .share() and you should write the correct logic
    return this._api.get(url, options)
      .do(json => {
        this._cache.set(key, json);
      })
      .share();
  }

  // don't cache here since we're creating
  create(url, body, headers?: any) {
    let key = `create-${url}`;

    let options = this.createOptions(null, headers);

    return this._api.set(url, body, options)
      .share();
  }

  private createOptions(queries?: any, headers?: any) {
    let options = new RequestOptions();

    if (queries && typeof queries === 'object') {
      let searchParams = new URLSearchParams();
      for (let key in queries) {
        searchParams.set(key, queries[key]);
      }

      options.search = searchParams;
    }

    if (headers && typeof headers === 'object') {
      let headerParams = new Headers();
      for (let key in headers) {
        headerParams.set(key, headers[key]);
      }

      options.headers = headerParams;
    }

    return options;
  }

}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { map } from 'rxjs/operators';
import { HttpClient as AngularHttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class HypermediaClientService {

  // private entryPoint = 'http://localhost:5000/Customers/Query?Pagination.PageSize=4';
  // private entryPoint = 'http://localhost:5000/entrypoint';
  private entryPoint = 'http://localhost:5000/Customers/1';

  private currentClientObject$: BehaviorSubject<SirenClientObject> = new BehaviorSubject<SirenClientObject>(new SirenClientObject());
  private currentClientObjectRaw$: BehaviorSubject<object> = new BehaviorSubject<object>({});

  constructor(private httpClient: AngularHttpClient) { }

  getHypermediaObjectStream(): BehaviorSubject<SirenClientObject> {
    return this.currentClientObject$;
  }

  getHypermediaObjectRawStream(): BehaviorSubject<object> {
    return this.currentClientObjectRaw$;
  }

  enterApi() {
    this.httpClient.get(this.entryPoint).subscribe(response => { // TODO is subscribe ok here? use pipe?
      const sirenClientObject = this.MapResponse(response);
      this.currentClientObject$.next(sirenClientObject);
      this.currentClientObjectRaw$.next(response);
    });
  }

  Navigate(url: string) {
    this.httpClient.get(url).subscribe(response => {  // TODO is subscribe ok here? use pipe?
      const sirenClientObject = this.MapResponse(response);
      this.currentClientObject$.next(sirenClientObject);
      this.currentClientObjectRaw$.next(response);
    });
  }

  private MapResponse(response: any): SirenClientObject {
    const hco = new SirenClientObject();
    hco.deserialize(response);
    return hco;
  }
}


export class SirenClientObject {

  classes: string[] = new Array<string>();
  links: HypermediaLink[] = new Array<HypermediaLink>();
  properties: PropertyInfo[];
  embeddedLinkEntities: EmbeddedLinkEntity[];
  embeddedEntities: EmbeddedEntity[];
  title: string;
  actions: HypermediaAction[];

  constructor() { }

  deserialize(response: any) {
    this.classes = [...(<string[]>response.class)]; // todo what if undefined
    this.title = response.title;
    this.links = this.deserializeLinks(response.links); // todo what if undefined
    this.properties = this.deserializeProperties(response.properties);
    this.actions = this.deserializeActions(response.actions);


    // todo preserve order of embeddedLinkEntitys and embeddedEntity, splitting types changes order
    this.embeddedLinkEntities = this.deserializeEmbeddedLinkEntity(response.entities);
    this.embeddedEntities = this.deserializeEmbeddedEntity(response.entities);
  }

  deserializeEmbeddedLinkEntity(entities: Array<any>): Array<EmbeddedLinkEntity> {
    const result = new Array<EmbeddedLinkEntity>();

    entities.forEach(entity => {
      if (!this.isEmbeddedLinkEntity(entity)) {
        return;
      }

      const linkEntity = new EmbeddedLinkEntity();
      linkEntity.href = entity.href;           // todo what if not there
      linkEntity.relations = [...entity.rel];  // todo what if not there
      linkEntity.classes = [...entity.class];  // todo what if not there
      linkEntity.title = entity.title;         // todo what if not there
      linkEntity.mediaType = entity.mediaType; // todo what if not there

      result.push(linkEntity);
    });

    return result;
  }



  deserializeEmbeddedEntity(entities: Array<any>): Array<EmbeddedEntity> {
    const result = new Array<EmbeddedEntity>();
    entities.forEach(entity => {
      if (this.isEmbeddedLinkEntity(entity)) {
        return;
      }

      const embeddedEntity = new EmbeddedEntity();
      embeddedEntity.relations = [...entity.rel];  // todo what if not there
      embeddedEntity.deserialize(entity);
      result.push(embeddedEntity);
    });

    return result;
  }

  deserializeLinks(links: any[]): HypermediaLink[] {
    const result = new Array<HypermediaLink>();
    links.forEach(link => {
      result.push(new HypermediaLink([...link.rel], link.href));
    });

    return result;
  }

  deserializeActions(actions: any[]): HypermediaAction[] {
    const result = new Array<HypermediaAction>();

    actions.forEach(action => {
      const hypermediaAction = new HypermediaAction();
      hypermediaAction.name = action.name;

      if (this.isStringArray(action, 'class')) {
        hypermediaAction.classes = [...action.class];
      }

      hypermediaAction.method = action.method;
      hypermediaAction.href = action.href;
      hypermediaAction.title = action.title;
      hypermediaAction.type = action.type;

      result.push(hypermediaAction);
    });

    return result;
  }

  deserializeProperties(properties: any): PropertyInfo[] {
    const result = new Array<PropertyInfo>();

    for (const property in properties) {
      if (!properties.hasOwnProperty(property)) {
        continue;
      }

      const value = properties[property];
      const propertyType = typeof value;


      if (value === null) {
        result.push(new PropertyInfo(property, value, PropertyTypes.nullvalue));
        continue;
      }

      switch (propertyType) {
        case 'number':
          result.push(new PropertyInfo(property, value, PropertyTypes.number));
          break;

        case 'boolean':
          result.push(new PropertyInfo(property, value, PropertyTypes.boolean));
          break;

        case 'string':
          result.push(new PropertyInfo(property, value, PropertyTypes.string));
          break;

        case 'object':
          if (Array.isArray(value)) {
            result.push(new PropertyInfo(property, value, PropertyTypes.array)); // todo nested values
          } else {
            result.push(new PropertyInfo(property, value, PropertyTypes.object)); // todo nested values
          }

          break;

        case 'undefined':
        case 'function':
        case 'symbol':
        default:
          continue;
      }
    }

    return result;
  }

  private hasProperty(obj: object, propertyName: string): boolean {
    if (obj.hasOwnProperty(propertyName)) {
      return true;
    }
    return false;
  }

  private hasFilledProperty(obj: object, propertyName: string): boolean {
    if (this.hasProperty(obj, propertyName) && obj[propertyName]) {
      return true;
    }

    return false;
  }

  private isStringArray(obj: object, propertyName: string): boolean {
    if (this.hasFilledProperty(obj, propertyName) && Array.isArray(obj[propertyName])) {
      return true;
    }

    return false;
  }


  private isEmbeddedLinkEntity(entity: any) {
    if (entity.hasOwnProperty('href')) {
      return true;
    }

    return false;
  }
}

export class EmbeddedLinkEntity extends SirenClientObject implements IEmbeddedEntity {
  public relations: string[] = new Array<string>();
  public href: string;
  public classes: string[] = new Array<string>();
  public mediaType: string;
  public title: string;

  constructor() {
    super();
  }

}

export class EmbeddedEntity extends SirenClientObject implements IEmbeddedEntity {
  public relations: string[];
}

export interface IEmbeddedEntity {
  relations: string[];
}

export class PropertyInfo {
  constructor(public name: string, public value: any, public type: PropertyTypes) { }
}

export enum PropertyTypes {
  nullvalue = 'nullvalue',
  boolean = 'boolean',
  number = 'number',
  string = 'string',
  object = 'object',
  array = 'array'
}

export enum HttpMethodTyes {
  GET,
  POST,
  PUT,
  DELETE,
  OPTIONS
}

export class HypermediaLink {
  constructor(public relations: string[], public url: string) { }
}

export class HypermediaAction {
  public name: string;
  public classes: string[] = new Array<string>();
  public method: HttpMethodTyes;
  public href: string;
  public title: string;
  public type: string;

  constructor() { }
}

